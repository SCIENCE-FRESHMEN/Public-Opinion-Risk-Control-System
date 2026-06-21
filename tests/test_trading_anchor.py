import datetime as dt

import pandas as pd

from src.features.trading_anchor import assign_trading_date_anchor


def test_assign_trading_date_anchor_placeholder():
    assert callable(assign_trading_date_anchor)


def test_assign_trading_date_anchor_after_close_goes_next_day():
    news = pd.DataFrame(
        {
            "publish_timestamp": [
                "2024-01-08 08:00:00",
                "2024-01-08 18:30:00",
            ]
        }
    )
    trading_days = [dt.date(2024, 1, 8), dt.date(2024, 1, 9), dt.date(2024, 1, 10)]
    out = assign_trading_date_anchor(news, trading_days, market_open="09:30", market_close="16:00")
    assert out.loc[0, "trading_date_anchor"] == dt.date(2024, 1, 8)
    assert out.loc[1, "trading_date_anchor"] == dt.date(2024, 1, 9)
