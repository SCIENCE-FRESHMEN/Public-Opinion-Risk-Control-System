"""交易时间锚定模块。"""

from __future__ import annotations

import pandas as pd

from src.features.trading_calendar import is_trading_day, next_trading_day, previous_trading_day


def assign_trading_date_anchor(news_df: pd.DataFrame, trading_days, market_open="09:30", market_close="16:00") -> pd.DataFrame:
    """按发布时间将新闻锚定到可交易日期，避免看前偏误。"""
    anchored = news_df.copy()
    if "publish_timestamp" not in anchored.columns:
        anchored["trading_date_anchor"] = None
        return anchored

    open_h, open_m = [int(x) for x in str(market_open).split(":")]
    close_h, close_m = [int(x) for x in str(market_close).split(":")]
    open_minutes = open_h * 60 + open_m
    close_minutes = close_h * 60 + close_m

    ts = pd.to_datetime(anchored["publish_timestamp"], errors="coerce")
    anchors = []
    for t in ts:
        if pd.isna(t):
            anchors.append(None)
            continue
        d = t.date()
        minutes = t.hour * 60 + t.minute
        if is_trading_day(d, trading_days):
            if minutes <= open_minutes:
                anchor = d
            elif minutes >= close_minutes:
                anchor = next_trading_day(d, trading_days)
            else:
                anchor = d
        else:
            # 非交易日新闻使用下一交易日（保守策略）。
            anchor = next_trading_day(d, trading_days)
        anchors.append(anchor)

    anchored["trading_date_anchor"] = anchors
    # 若出现超出交易日范围情况，回退到最后一个已知交易日，避免空值传播。
    if trading_days:
        last_day = sorted(pd.to_datetime(list(trading_days)).date)[-1]
        first_day = sorted(pd.to_datetime(list(trading_days)).date)[0]
        anchored["trading_date_anchor"] = anchored["trading_date_anchor"].apply(
            lambda x: first_day if x is None else (last_day if x > last_day else x)
        )
        anchored["trading_date_anchor"] = anchored["trading_date_anchor"].apply(
            lambda x: previous_trading_day(x, trading_days) if x not in set(pd.to_datetime(list(trading_days)).date) else x
        )
    return anchored
