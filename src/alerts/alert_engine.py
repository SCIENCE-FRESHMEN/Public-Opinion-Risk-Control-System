"""预警引擎模块。"""

from __future__ import annotations

import pandas as pd

from src.alerts.rules import (
    detect_negative_spike,
    detect_news_heat_spike,
    detect_sentiment_price_divergence,
)


def run_alert_engine(feature_df: pd.DataFrame) -> pd.DataFrame:
    """汇总规则输出统一预警结果表。"""
    if feature_df.empty:
        return pd.DataFrame(columns=["ticker", "trade_date", "alert_type", "alert_level", "description", "score"])

    cfg = feature_df.attrs.get("alert_thresholds", {})
    parts = [
        detect_negative_spike(
            feature_df,
            sentiment_drop=cfg.get("sentiment_drop", 0.20),
            negative_ratio_delta=0.20,
            negative_abs_sentiment=cfg.get("negative_abs_sentiment", -0.45),
            negative_abs_ratio=cfg.get("negative_abs_ratio", 0.75),
        ),
        detect_news_heat_spike(
            feature_df,
            news_count_multiplier=cfg.get("news_count_multiplier", 1.8),
            abs_news_count=3,
        ),
        detect_sentiment_price_divergence(
            feature_df,
            divergence_sentiment_abs=cfg.get("divergence_sentiment_abs", 0.20),
            divergence_intraday_return=cfg.get("divergence_intraday_return", 0.002),
        ),
    ]
    alerts = pd.concat([p for p in parts if not p.empty], ignore_index=True) if any(not p.empty for p in parts) else pd.DataFrame()
    if alerts.empty:
        return pd.DataFrame(columns=["ticker", "trade_date", "alert_type", "alert_level", "description", "score"])

    alerts["trade_date"] = pd.to_datetime(alerts["trade_date"], errors="coerce").dt.date
    alerts["score"] = pd.to_numeric(alerts["score"], errors="coerce").fillna(0).clip(0, 1)
    alerts["alert_level"] = alerts["score"].apply(lambda s: "High" if s >= 0.75 else ("Medium" if s >= 0.45 else "Low"))
    alerts = alerts.sort_values(["ticker", "trade_date", "score"], ascending=[True, True, False]).drop_duplicates(
        subset=["ticker", "trade_date", "alert_type"], keep="first"
    )
    return alerts[["ticker", "trade_date", "alert_type", "alert_level", "description", "score"]].reset_index(drop=True)
