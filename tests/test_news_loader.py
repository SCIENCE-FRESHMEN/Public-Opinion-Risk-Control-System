import json

import pandas as pd

from src.data import news_loader


def test_fetch_a_share_news_returns_normalized_fields(monkeypatch) -> None:
    payload = {
        "result": {
            "cmsArticleWebOld": [
                {
                    "date": "2026-04-23 09:35:00",
                    "mediaName": "证券时报",
                    "code": "an202604236000001",
                    "title": "<em>贵州茅台</em>一季报预期改善",
                    "content": "<em>贵州茅台</em>渠道反馈回暖\\u3000机构关注动销修复",
                }
            ]
        }
    }

    class FakeResponse:
        text = f'jQuery35101792940631092459_1764599530165({json.dumps(payload, ensure_ascii=False)})'

        def raise_for_status(self):
            return None

    def fake_get(url, params, headers, timeout):
        assert params["param"]
        assert "600519" in params["param"]
        return FakeResponse()

    monkeypatch.setattr(news_loader.requests, "get", fake_get)

    out = news_loader.fetch_a_share_news("600519")

    assert list(out.columns) == ["publish_timestamp", "title", "summary", "source", "url"]
    assert len(out) == 1
    assert out.iloc[0]["title"] == "贵州茅台一季报预期改善"
    assert out.iloc[0]["summary"] == "贵州茅台渠道反馈回暖机构关注动销修复"
    assert out.iloc[0]["source"] == "证券时报"
    assert out.iloc[0]["url"].endswith("an202604236000001.html")


def test_fetch_all_a_share_news_keeps_ticker_column(monkeypatch) -> None:
    seen_limits = []

    monkeypatch.setattr(
        news_loader,
        "fetch_a_share_news",
        lambda symbol, limit=10: (
            seen_limits.append(limit),
            pd.DataFrame(
                {
                    "publish_timestamp": ["2026-04-23 09:35:00"],
                    "title": [f"{symbol} 新闻"],
                    "summary": ["摘要"],
                    "source": ["证券时报"],
                    "url": [f"https://example.com/{symbol}"],
                }
            ),
        )[1],
    )

    out = news_loader.fetch_all_a_share_news(["600519.SH", "300750.SZ"], limit=50)

    assert out["ticker"].tolist() == ["600519.SH", "300750.SZ"]
    assert out["title"].tolist() == ["600519.SH 新闻", "300750.SZ 新闻"]
    assert seen_limits == [50, 50]
