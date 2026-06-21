"""数据清洗模块。"""

from __future__ import annotations

import pandas as pd


def clean_news(news_df: pd.DataFrame) -> pd.DataFrame:
    """清洗新闻数据。"""
    if news_df.empty:
        return news_df.copy()
    df = news_df.copy()
    df["title"] = df["title"].fillna("").astype(str).str.strip()
    df["summary"] = df["summary"].fillna("").astype(str).str.strip()
    df["source"] = df["source"].fillna("unknown").astype(str).str.strip()
    df["publish_timestamp"] = pd.to_datetime(df["publish_timestamp"], errors="coerce")
    df = df.dropna(subset=["publish_timestamp", "ticker"])
    df = df[df["title"].str.len() > 0]
    df = df.drop_duplicates(subset=["ticker", "publish_timestamp", "title"])
    df = df.sort_values(["ticker", "publish_timestamp"]).reset_index(drop=True)
    df["news_id"] = (
        df["ticker"].astype(str)
        + "_"
        + df["publish_timestamp"].dt.strftime("%Y%m%d%H%M%S")
        + "_"
        + df.index.astype(str)
    )
    return df[["news_id", "ticker", "publish_timestamp", "title", "summary", "source"]]


def clean_prices(price_df: pd.DataFrame) -> pd.DataFrame:
    """清洗价格数据。"""
    if price_df.empty:
        return price_df.copy()
    df = price_df.copy()
    df["trade_date"] = pd.to_datetime(df["trade_date"], errors="coerce")
    df = df.dropna(subset=["ticker", "trade_date", "close"])
    df["ticker"] = df["ticker"].astype(str).str.upper()
    df = df.drop_duplicates(subset=["ticker", "trade_date"])
    df = df.sort_values(["ticker", "trade_date"]).reset_index(drop=True)
    df["trade_date"] = df["trade_date"].dt.date
    return df
