"""风险预警规则定义。"""

from __future__ import annotations

import pandas as pd


def detect_negative_spike(
    df: pd.DataFrame,
    *,
    sentiment_drop: float = 0.20,
    negative_ratio_delta: float = 0.20,
    negative_abs_sentiment: float = -0.45,
    negative_abs_ratio: float = 0.75,
) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["ticker", "trade_date", "alert_type", "score", "description"])
    x = df.copy().sort_values(["ticker", "trading_date_anchor"])
    x["sent_roll7"] = x.groupby("ticker")["daily_sentiment_score"].transform(lambda s: s.rolling(7, min_periods=2).mean())
    x["neg_roll7"] = x.groupby("ticker")["negative_ratio"].transform(lambda s: s.rolling(7, min_periods=2).mean())
    cond = (
        (x["daily_sentiment_score"] < (x["sent_roll7"] - float(sentiment_drop)))
        | (x["negative_ratio"] > (x["neg_roll7"] + float(negative_ratio_delta)))
        | (x["daily_sentiment_score"] <= float(negative_abs_sentiment))
        | (x["negative_ratio"] >= float(negative_abs_ratio))
    )
    out = x[cond].copy()
    out["alert_type"] = "negative_spike"
    out["score"] = (out["negative_ratio"].fillna(0) * 0.7 + (-(out["daily_sentiment_score"].fillna(0))).clip(lower=0) * 0.3).clip(0, 1)
    out["description"] = "负面情绪激增或负面占比异常"
    out = out.rename(columns={"trading_date_anchor": "trade_date"})
    return out[["ticker", "trade_date", "alert_type", "score", "description"]]


def detect_news_heat_spike(df: pd.DataFrame, *, news_count_multiplier: float = 1.8, abs_news_count: int = 3) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["ticker", "trade_date", "alert_type", "score", "description"])
    x = df.copy().sort_values(["ticker", "trading_date_anchor"])
    x["news_roll14"] = x.groupby("ticker")["news_count"].transform(lambda s: s.rolling(14, min_periods=2).mean())
    cond = (x["news_count"] > (x["news_roll14"] * float(news_count_multiplier))) | (x["news_count"] >= int(abs_news_count))
    out = x[cond].copy()
    out["alert_type"] = "news_heat_spike"
    ratio = out["news_count"] / out["news_roll14"].replace(0, pd.NA)
    out["score"] = ((ratio.fillna(1.0) - 1.0) / 2.0).clip(0, 1)
    out["description"] = "新闻热度显著高于近期均值"
    out = out.rename(columns={"trading_date_anchor": "trade_date"})
    return out[["ticker", "trade_date", "alert_type", "score", "description"]]


def detect_sentiment_price_divergence(
    df: pd.DataFrame,
    *,
    divergence_sentiment_abs: float = 0.20,
    divergence_intraday_return: float = 0.002,
) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["ticker", "trade_date", "alert_type", "score", "description"])
    required = {"intraday_return", "daily_sentiment_score"}
    if not required.issubset(df.columns):
        return pd.DataFrame(columns=["ticker", "trade_date", "alert_type", "score", "description"])
    x = df.copy().sort_values(["ticker", "trading_date_anchor"])
    s_abs = float(divergence_sentiment_abs)
    r_abs = float(divergence_intraday_return)
    cond = ((x["daily_sentiment_score"] < -s_abs) & (x["intraday_return"] > r_abs)) | (
        (x["daily_sentiment_score"] > s_abs) & (x["intraday_return"] < -r_abs)
    )
    out = x[cond].copy()
    out["alert_type"] = "sentiment_price_divergence"
    out["score"] = (x.loc[out.index, "daily_sentiment_score"].abs() * 0.6 + x.loc[out.index, "intraday_return"].abs() * 80 * 0.4).clip(0, 1)
    out["description"] = "情绪方向与当日价格方向背离"
    out = out.rename(columns={"trading_date_anchor": "trade_date"})
    return out[["ticker", "trade_date", "alert_type", "score", "description"]]
