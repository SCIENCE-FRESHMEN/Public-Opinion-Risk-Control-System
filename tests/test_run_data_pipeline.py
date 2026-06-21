import pandas as pd

from scripts import run_data_pipeline


def test_resolve_pipeline_tickers_includes_all_active_symbols(monkeypatch) -> None:
    class Instrument:
        def __init__(self, symbol: str):
            self.symbol = symbol

    monkeypatch.setattr(
        run_data_pipeline,
        "load_active_instruments",
        lambda: [Instrument("600519.SH"), Instrument("000858.SZ"), Instrument("000001.SZ")],
    )

    out = run_data_pipeline.resolve_pipeline_tickers({"default_tickers": ["600519.SH", "000858.SZ"]})

    assert out == ["600519.SH", "000858.SZ", "000001.SZ"]


def test_load_pipeline_news_prefers_live_a_share_news(monkeypatch) -> None:
    live_news = pd.DataFrame(
        {
            "ticker": ["600519.SH"],
            "publish_timestamp": ["2026-04-23 09:35:00"],
            "title": ["贵州茅台一季报预期改善"],
            "summary": ["机构关注动销修复"],
            "source": ["证券时报"],
            "url": ["https://example.com/news"],
        }
    )
    seen = {}

    def fake_fetch_all_a_share_news(tickers, limit=10):
        seen["tickers"] = tickers
        seen["limit"] = limit
        return live_news

    monkeypatch.setattr(run_data_pipeline, "fetch_all_a_share_news", fake_fetch_all_a_share_news)
    monkeypatch.setattr(run_data_pipeline, "load_news_csv", lambda path: pd.DataFrame())
    monkeypatch.setattr(run_data_pipeline, "match_news_to_tickers", lambda news_df, ticker_map: news_df)

    out = run_data_pipeline.load_pipeline_news(["600519.SH"], {"600519.SH": {"keywords": ["贵州茅台"]}})

    assert out.equals(live_news)
    assert seen == {"tickers": ["600519.SH"], "limit": 50}


def test_load_pipeline_news_falls_back_to_sample_mapping_when_live_news_empty(monkeypatch) -> None:
    sample_news = pd.DataFrame(
        {
            "publish_timestamp": ["2026-04-10 09:10:00"],
            "title": ["贵州茅台一季报预期走弱"],
            "summary": ["多家机构下调短期增速预测"],
            "source": ["sample_feed"],
        }
    )
    mapped_news = sample_news.assign(ticker="600519.SH")

    monkeypatch.setattr(run_data_pipeline, "fetch_all_a_share_news", lambda tickers, limit=10: pd.DataFrame())
    monkeypatch.setattr(run_data_pipeline, "load_news_csv", lambda path: sample_news)
    monkeypatch.setattr(run_data_pipeline, "match_news_to_tickers", lambda news_df, ticker_map: mapped_news)

    out = run_data_pipeline.load_pipeline_news(["600519.SH"], {"600519.SH": {"keywords": ["贵州茅台"]}})

    assert out.equals(mapped_news)
