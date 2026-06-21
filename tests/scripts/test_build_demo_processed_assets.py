from pathlib import Path

import pandas as pd

from scripts.build_demo_processed_assets import ARTIFACT_NAMES, build_demo_processed_assets


def test_build_demo_processed_assets_creates_required_parquet_files(tmp_path: Path) -> None:
    build_demo_processed_assets(tmp_path)

    for artifact_name in ARTIFACT_NAMES:
        artifact_path = tmp_path / artifact_name
        assert artifact_path.exists(), f"缺少工件: {artifact_name}"

    prices = pd.read_parquet(tmp_path / "prices.parquet")
    features = pd.read_parquet(tmp_path / "daily_sentiment_features.parquet")
    alerts = pd.read_parquet(tmp_path / "risk_alerts.parquet")
    backtest = pd.read_parquet(tmp_path / "backtest_results.parquet")
    backtest_events = pd.read_parquet(tmp_path / "backtest_event_results.parquet")

    assert "600519.SH" in set(prices["ticker"])
    assert "300750.SZ" in set(features["ticker"])
    assert "600887.SH" in set(alerts["ticker"])
    assert (backtest["horizon"] == 5).any()
    assert (backtest_events["ticker"] == "600887.SH").any()
