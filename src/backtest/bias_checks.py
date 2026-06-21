"""偏误检查模块。"""

from __future__ import annotations

from typing import Any

import pandas as pd


def check_no_lookahead(news_df: pd.DataFrame, alerts_df: pd.DataFrame) -> dict[str, Any]:
    """
    检查是否存在可识别的看前偏误风险，并返回可审计报告。

    核心检查：
    1. 新闻锚定日期不得早于新闻发布时间日期（否则存在“未来新闻回填到过去”的风险）。
    2. 每条预警应能在同 ticker、同交易锚定日找到至少一条新闻证据。
    """
    report: dict[str, Any] = {
        "passed": True,
        "total_news_rows": int(len(news_df)),
        "total_alert_rows": int(len(alerts_df)),
        "violations": {},
    }

    if news_df.empty:
        report["violations"]["news_empty"] = True
        report["passed"] = False
        return report

    required_news_cols = {"ticker", "publish_timestamp", "trading_date_anchor"}
    miss_news = sorted(required_news_cols - set(news_df.columns))
    if miss_news:
        report["violations"]["missing_news_columns"] = miss_news
        report["passed"] = False
        return report

    x = news_df.copy()
    x["publish_timestamp"] = pd.to_datetime(x["publish_timestamp"], errors="coerce")
    x["publish_date"] = x["publish_timestamp"].dt.date
    x["trading_date_anchor"] = pd.to_datetime(x["trading_date_anchor"], errors="coerce").dt.date

    invalid_time = x[x["trading_date_anchor"] < x["publish_date"]].copy()
    if not invalid_time.empty:
        report["passed"] = False
        report["violations"]["anchor_before_publish"] = invalid_time[
            ["ticker", "publish_timestamp", "trading_date_anchor"]
        ].head(20).to_dict(orient="records")

    if alerts_df.empty:
        report["violations"]["alerts_empty"] = True
        report["passed"] = False
        return report

    required_alert_cols = {"ticker", "trade_date"}
    miss_alert = sorted(required_alert_cols - set(alerts_df.columns))
    if miss_alert:
        report["violations"]["missing_alert_columns"] = miss_alert
        report["passed"] = False
        return report

    a = alerts_df.copy()
    a["trade_date"] = pd.to_datetime(a["trade_date"], errors="coerce").dt.date
    evidence = x[["ticker", "trading_date_anchor"]].dropna().drop_duplicates()
    merged = a.merge(
        evidence,
        left_on=["ticker", "trade_date"],
        right_on=["ticker", "trading_date_anchor"],
        how="left",
    )
    no_evidence = merged[merged["trading_date_anchor"].isna()].copy()
    if not no_evidence.empty:
        report["passed"] = False
        keep_cols = [c for c in ["ticker", "trade_date", "alert_type", "alert_level"] if c in no_evidence.columns]
        report["violations"]["alert_without_news_evidence"] = no_evidence[keep_cols].head(20).to_dict(
            orient="records"
        )

    return report
