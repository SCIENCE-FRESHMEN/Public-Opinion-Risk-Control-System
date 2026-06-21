import datetime as dt

import pandas as pd

from src.backtest.bias_checks import check_no_lookahead


def test_check_no_lookahead_pass_case():
    news = pd.DataFrame(
        {
            "ticker": ["TSLA"],
            "publish_timestamp": ["2024-01-08 18:30:00"],
            "trading_date_anchor": [dt.date(2024, 1, 9)],
        }
    )
    alerts = pd.DataFrame(
        {
            "ticker": ["TSLA"],
            "trade_date": [dt.date(2024, 1, 9)],
            "alert_type": ["negative_spike"],
            "alert_level": ["High"],
        }
    )
    report = check_no_lookahead(news, alerts)
    assert report["passed"] is True


def test_check_no_lookahead_detects_anchor_before_publish():
    news = pd.DataFrame(
        {
            "ticker": ["TSLA"],
            "publish_timestamp": ["2024-01-08 18:30:00"],
            "trading_date_anchor": [dt.date(2024, 1, 7)],
        }
    )
    alerts = pd.DataFrame(
        {
            "ticker": ["TSLA"],
            "trade_date": [dt.date(2024, 1, 7)],
        }
    )
    report = check_no_lookahead(news, alerts)
    assert report["passed"] is False
    assert "anchor_before_publish" in report["violations"]

