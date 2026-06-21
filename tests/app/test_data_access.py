from pathlib import Path

import pandas as pd

from app.components import data_access


def test_load_prices_returns_schema_when_parquet_missing(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(data_access, "PROCESSED_DIR", tmp_path)

    prices = data_access.load_prices()

    assert list(prices.columns) == ["ticker", "trade_date", "open", "high", "low", "close", "volume", "return_1d"]
    assert prices.empty


def test_load_optional_table_returns_schema_when_parquet_missing(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(data_access, "PROCESSED_DIR", tmp_path)

    alerts = data_access.load_optional_table("risk_alerts", date_columns=["trade_date"])

    assert list(alerts.columns) == ["ticker", "trade_date", "alert_type", "alert_level", "description", "score"]
    assert alerts.empty
