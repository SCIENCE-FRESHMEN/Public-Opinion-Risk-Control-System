import datetime as dt

import pandas as pd

from src.backtest.event_study import build_event_level_results, run_event_study


def _sample_prices():
    return pd.DataFrame(
        {
            "ticker": ["TSLA"] * 5 + ["AAPL"] * 5,
            "trade_date": [dt.date(2024, 1, d) for d in [8, 9, 10, 11, 12]] * 2,
            "return_1d": [0.0, 0.01, -0.02, 0.03, 0.01, 0.0, -0.03, -0.01, 0.02, 0.01],
            "open": [100, 101, 100, 103, 104, 200, 194, 192, 196, 198],
            "close": [101, 100, 103, 104, 105, 194, 192, 196, 198, 200],
        }
    )


def _sample_alerts():
    return pd.DataFrame(
        {
            "ticker": ["TSLA", "AAPL"],
            "trade_date": [dt.date(2024, 1, 8), dt.date(2024, 1, 8)],
            "alert_type": ["negative_spike", "negative_spike"],
            "alert_level": ["High", "High"],
        }
    )


def test_run_event_study_has_horizon_rows():
    out = run_event_study(_sample_alerts(), _sample_prices())
    assert not out.empty
    assert set([3, 5, 10]).issubset(set(out["horizon"].tolist()))


def test_run_event_study_groups_results_by_ticker() -> None:
    out = run_event_study(_sample_alerts(), _sample_prices())

    assert "ticker" in out.columns
    assert set(out["ticker"]) == {"TSLA", "AAPL"}
    tsla_curve = out[out["ticker"] == "TSLA"]["avg_return"].tolist()
    aapl_curve = out[out["ticker"] == "AAPL"]["avg_return"].tolist()
    assert tsla_curve != aapl_curve


def test_event_level_results_contains_detail_columns():
    out = build_event_level_results(_sample_alerts(), _sample_prices())
    assert not out.empty
    assert set(["ticker", "trade_date", "alert_type", "alert_level", "horizon", "avg_return"]).issubset(out.columns)
