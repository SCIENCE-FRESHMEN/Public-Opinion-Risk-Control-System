import datetime as dt

import pandas as pd

from src.alerts.rules import detect_negative_spike


def test_detect_negative_spike_placeholder():
    assert callable(detect_negative_spike)


def test_detect_negative_spike_outputs_alert_rows():
    df = pd.DataFrame(
        {
            "ticker": ["AAPL"] * 8,
            "trading_date_anchor": [dt.date(2024, 1, i) for i in range(1, 9)],
            "daily_sentiment_score": [0.1, 0.09, 0.08, 0.05, 0.02, -0.01, -0.15, -0.6],
            "news_count": [1, 1, 1, 2, 2, 2, 2, 4],
            "negative_ratio": [0.1, 0.1, 0.1, 0.12, 0.15, 0.2, 0.3, 0.9],
        }
    )
    out = detect_negative_spike(df)
    assert not out.empty
    assert set(["ticker", "trade_date", "alert_type", "score", "description"]).issubset(out.columns)
