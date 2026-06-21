"""交易日历工具。"""

from __future__ import annotations

import datetime as dt

import pandas as pd


def is_trading_day(date, trading_days):
    d = pd.to_datetime(date).date()
    return d in set(pd.to_datetime(list(trading_days)).date)


def next_trading_day(date, trading_days):
    d = pd.to_datetime(date).date()
    ordered = sorted(pd.to_datetime(list(trading_days)).date)
    for day in ordered:
        if day > d:
            return day
    return d + dt.timedelta(days=1)


def previous_trading_day(date, trading_days):
    d = pd.to_datetime(date).date()
    ordered = sorted(pd.to_datetime(list(trading_days)).date)
    prev = None
    for day in ordered:
        if day > d:
            break
        prev = day
    return prev if prev is not None else d


def trading_days_from_prices(price_df: pd.DataFrame):
    if price_df.empty or "trade_date" not in price_df.columns:
        return []
    return sorted(pd.to_datetime(price_df["trade_date"], errors="coerce").dt.date.dropna().unique().tolist())
