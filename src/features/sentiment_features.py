"""情绪特征聚合模块。"""

from __future__ import annotations

import pandas as pd


def build_daily_sentiment_features(news_sentiment_df: pd.DataFrame) -> pd.DataFrame:
    """聚合生成日度情绪特征。"""
    expected_columns = [
        "ticker",
        "trading_date_anchor",
        "daily_sentiment_score",
        "news_count",
        "negative_ratio",
        "sentiment_change",
        "keyword_count",
    ]
    if news_sentiment_df.empty:
        return pd.DataFrame(columns=expected_columns)

    df = news_sentiment_df.copy()
    df["publish_timestamp"] = pd.to_datetime(df["publish_timestamp"], errors="coerce")
    df = df.dropna(subset=["ticker", "publish_timestamp"])
    if "trading_date_anchor" in df.columns:
        df["trading_date_anchor"] = pd.to_datetime(df["trading_date_anchor"], errors="coerce").dt.date
    else:
        df["trading_date_anchor"] = pd.NaT
    df["trading_date_anchor"] = df["trading_date_anchor"].where(df["trading_date_anchor"].notna(), df["publish_timestamp"].dt.date)

    grouped = (
        df.groupby(["ticker", "trading_date_anchor"], as_index=False)
        .agg(
            daily_sentiment_score=("sentiment_score", "mean"),
            news_count=("news_id", "count"),
            negative_ratio=("sentiment_label", lambda s: float((s == "negative").mean())),
            keyword_count=(
                "title",
                lambda s: int(
                    s.fillna("")
                    .astype(str)
                    .str.lower()
                    .str.count(r"risk|pressure|drop|fall|miss|weak|down")
                    .sum()
                ),
            ),
        )
        .sort_values(["ticker", "trading_date_anchor"])
        .reset_index(drop=True)
    )
    grouped["sentiment_change"] = grouped.groupby("ticker")["daily_sentiment_score"].diff()
    return grouped[expected_columns].copy()
