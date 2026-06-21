import pandas as pd

from src.data import price_loader
from src.data.price_loader import _download_a_share_prices, normalize_price_data, normalize_vendor_symbol


def test_normalize_vendor_symbol_maps_a_share_suffix_for_yfinance() -> None:
    assert normalize_vendor_symbol("600519.SH") == "600519.SS"
    assert normalize_vendor_symbol("300750.SZ") == "300750.SZ"
    assert normalize_vendor_symbol("601318.SH") == "601318.SS"


def test_normalize_price_data_keeps_a_share_daily_structure() -> None:
    raw = pd.DataFrame(
        {
            "Date": ["2026-04-08", "2026-04-09"],
            "Open": [1685.0, 1672.0],
            "High": [1692.0, 1679.0],
            "Low": [1678.0, 1665.0],
            "Close": [1680.0, 1668.0],
            "Volume": [5230000, 4880000],
            "ticker": ["600519.SH", "600519.SH"],
        }
    )

    out = normalize_price_data(raw)

    assert list(out.columns) == ["ticker", "trade_date", "open", "high", "low", "close", "volume", "return_1d"]
    assert out.iloc[0]["ticker"] == "600519.SH"
    assert float(out.iloc[1]["close"]) == 1668.0


def test_download_a_share_prices_splits_long_ranges_by_year(monkeypatch) -> None:
    calls = []

    class FakeAk:
        @staticmethod
        def stock_zh_a_hist(symbol, period, start_date, end_date, adjust):
            calls.append((symbol, start_date, end_date))
            return pd.DataFrame(
                {
                    "日期": [f"{start_date[:4]}-01-02"],
                    "开盘": [10.0],
                    "收盘": [11.0],
                    "最高": [12.0],
                    "最低": [9.0],
                    "成交量": [1000],
                }
            )

    monkeypatch.setattr(price_loader, "ak", FakeAk)

    out = _download_a_share_prices("600519.SH", "2020-01-01", "2022-04-22")

    assert calls == [
        ("600519", "20200101", "20201231"),
        ("600519", "20210101", "20211231"),
        ("600519", "20220101", "20220422"),
    ]
    assert len(out) == 3
    assert set(out["ticker"]) == {"600519.SH"}


def test_download_prices_falls_back_to_sina_a_share_source(monkeypatch) -> None:
    monkeypatch.setattr(price_loader, "_download_a_share_prices", lambda *args, **kwargs: pd.DataFrame())
    monkeypatch.setattr(
        price_loader,
        "_download_a_share_prices_sina",
        lambda ticker, start_date, end_date: pd.DataFrame(
            {
                "trade_date": ["2026-04-22"],
                "open": [1415.0],
                "high": [1419.0],
                "low": [1404.98],
                "close": [1409.5],
                "volume": [2691593],
                "ticker": [ticker],
            }
        ),
    )
    monkeypatch.setattr(price_loader, "_download_yfinance_prices", lambda *args, **kwargs: pd.DataFrame())

    out = price_loader.download_prices(["600519.SH"], "2026-04-01", "2026-04-22")

    assert len(out) == 1
    assert out.iloc[0]["ticker"] == "600519.SH"
    assert float(out.iloc[0]["close"]) == 1409.5


def test_download_prices_uses_sina_when_akshare_coverage_is_incomplete(monkeypatch) -> None:
    monkeypatch.setattr(
        price_loader,
        "_download_a_share_prices",
        lambda *args, **kwargs: pd.DataFrame(
            {
                "trade_date": ["2026-04-01", "2026-04-02"],
                "open": [10.0, 10.5],
                "high": [10.2, 10.7],
                "low": [9.8, 10.1],
                "close": [10.1, 10.6],
                "volume": [1000, 1200],
                "ticker": ["600519.SH", "600519.SH"],
            }
        ),
    )
    monkeypatch.setattr(
        price_loader,
        "_download_a_share_prices_sina",
        lambda ticker, start_date, end_date: pd.DataFrame(
            {
                "trade_date": ["2026-04-01", "2026-04-02", "2026-04-03"],
                "open": [10.0, 10.5, 10.7],
                "high": [10.2, 10.7, 10.9],
                "low": [9.8, 10.1, 10.4],
                "close": [10.1, 10.6, 10.8],
                "volume": [1000, 1200, 1300],
                "ticker": [ticker, ticker, ticker],
            }
        ),
    )
    monkeypatch.setattr(price_loader, "_download_yfinance_prices", lambda *args, **kwargs: pd.DataFrame())

    out = price_loader.download_prices(["600519.SH"], "2026-04-01", "2026-04-03")

    assert len(out) == 3
    assert out["trade_date"].max() == "2026-04-03"
