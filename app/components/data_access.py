"""前端数据读取工具。"""

from __future__ import annotations

import pathlib

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROCESSED_DIR = ROOT / "data" / "processed"

TABLE_SCHEMAS: dict[str, list[str]] = {
    "prices": ["ticker", "trade_date", "open", "high", "low", "close", "volume", "return_1d"],
    "news_clean": ["news_id", "ticker", "publish_timestamp", "trading_date_anchor", "title", "summary", "source"],
    "news_sentiment": [
        "news_id",
        "ticker",
        "publish_timestamp",
        "trading_date_anchor",
        "title",
        "summary",
        "source",
        "lexicon_score",
        "positive_prob",
        "neutral_prob",
        "negative_prob",
        "sentiment_label",
        "sentiment_score",
        "sentiment_model_source",
    ],
    "daily_sentiment_features": [
        "ticker",
        "trading_date_anchor",
        "daily_sentiment_score",
        "news_count",
        "negative_ratio",
        "sentiment_change",
        "keyword_count",
    ],
    "risk_alerts": ["ticker", "trade_date", "alert_type", "alert_level", "description", "score"],
    "backtest_results": [
        "ticker",
        "alert_type",
        "horizon",
        "trigger_count",
        "avg_return",
        "cum_return",
        "max_drawdown",
        "negative_return_ratio",
        "volatility",
    ],
    "backtest_event_results": [
        "ticker",
        "trade_date",
        "alert_type",
        "alert_level",
        "horizon",
        "avg_return",
        "cum_return",
        "max_drawdown",
        "negative_return_ratio",
        "volatility",
        "n_obs",
        "forward_return",
    ],
}


def _empty_table(name: str) -> pd.DataFrame:
    return pd.DataFrame(columns=TABLE_SCHEMAS.get(name, []))


def _read_parquet_safe(path: pathlib.Path, date_columns: list[str] | None = None, table_name: str | None = None) -> pd.DataFrame:
    if not path.exists():
        return _empty_table(table_name or path.stem)
    df = pd.read_parquet(path)
    for col in date_columns or []:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


def _fallback_news_sentiment() -> pd.DataFrame:
    rows = [
        {
            "news_id": "sample_maotai_0417",
            "ticker": "600519.SH",
            "publish_timestamp": "2026-04-17 09:20:00",
            "trading_date_anchor": "2026-04-17",
            "title": "贵州茅台盘中波动放大",
            "summary": "贵州茅台盘中震荡加剧，资金博弈明显升温。",
            "source": "sample_feed",
            "lexicon_score": -0.08,
            "positive_prob": 0.12,
            "neutral_prob": 0.26,
            "negative_prob": 0.62,
            "sentiment_label": "negative",
            "sentiment_score": -0.24,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0422",
            "ticker": "600519.SH",
            "publish_timestamp": "2026-04-22 10:05:00",
            "trading_date_anchor": "2026-04-22",
            "title": "贵州茅台渠道反馈分化",
            "summary": "贵州茅台渠道动销节奏分化，机构继续跟踪库存变化。",
            "source": "sample_feed",
            "lexicon_score": -0.05,
            "positive_prob": 0.18,
            "neutral_prob": 0.47,
            "negative_prob": 0.35,
            "sentiment_label": "neutral",
            "sentiment_score": -0.04,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0423",
            "ticker": "600519.SH",
            "publish_timestamp": "2026-04-23 11:10:00",
            "trading_date_anchor": "2026-04-23",
            "title": "贵州茅台获机构持续关注",
            "summary": "贵州茅台成交活跃，消费核心资产再度成为市场焦点。",
            "source": "sample_feed",
            "lexicon_score": 0.03,
            "positive_prob": 0.29,
            "neutral_prob": 0.51,
            "negative_prob": 0.20,
            "sentiment_label": "neutral",
            "sentiment_score": 0.02,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0424",
            "ticker": "600519.SH",
            "publish_timestamp": "2026-04-24 13:45:00",
            "trading_date_anchor": "2026-04-24",
            "title": "贵州茅台一季报预期走弱",
            "summary": "贵州茅台短期盈利预期承压，但核心品牌力仍被长期资金看好。",
            "source": "sample_feed",
            "lexicon_score": -0.12,
            "positive_prob": 0.08,
            "neutral_prob": 0.18,
            "negative_prob": 0.74,
            "sentiment_label": "negative",
            "sentiment_score": -0.31,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0427",
            "ticker": "600519.SH",
            "publish_timestamp": "2026-04-27 09:35:00",
            "trading_date_anchor": "2026-04-27",
            "title": "贵州茅台估值修复预期升温",
            "summary": "贵州茅台在消费板块反弹中表现稳健，风险偏好边际改善。",
            "source": "sample_feed",
            "lexicon_score": 0.10,
            "positive_prob": 0.54,
            "neutral_prob": 0.31,
            "negative_prob": 0.15,
            "sentiment_label": "positive",
            "sentiment_score": 0.19,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0428",
            "ticker": "600519.SH",
            "publish_timestamp": "2026-04-28 14:20:00",
            "trading_date_anchor": "2026-04-28",
            "title": "贵州茅台延续稳健表现",
            "summary": "贵州茅台交易热度保持高位，市场继续关注基本面验证节奏。",
            "source": "sample_feed",
            "lexicon_score": 0.05,
            "positive_prob": 0.41,
            "neutral_prob": 0.41,
            "negative_prob": 0.18,
            "sentiment_label": "neutral",
            "sentiment_score": 0.04,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_catl_0423",
            "ticker": "300750.SZ",
            "publish_timestamp": "2026-04-23 10:30:00",
            "trading_date_anchor": "2026-04-23",
            "title": "宁德时代海外扩产推进",
            "summary": "宁德时代海外产能布局继续推进，市场关注盈利韧性与订单质量。",
            "source": "sample_feed",
            "lexicon_score": 0.06,
            "positive_prob": 0.45,
            "neutral_prob": 0.38,
            "negative_prob": 0.17,
            "sentiment_label": "positive",
            "sentiment_score": 0.16,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_byd_0428",
            "ticker": "002594.SZ",
            "publish_timestamp": "2026-04-28 15:10:00",
            "trading_date_anchor": "2026-04-28",
            "title": "比亚迪销量与出海进展受关注",
            "summary": "比亚迪销量结构持续优化，市场聚焦新车型交付与海外拓展节奏。",
            "source": "sample_feed",
            "lexicon_score": 0.07,
            "positive_prob": 0.46,
            "neutral_prob": 0.36,
            "negative_prob": 0.18,
            "sentiment_label": "positive",
            "sentiment_score": 0.18,
            "sentiment_model_source": "fallback_sample",
        },
    ]
    df = pd.DataFrame(rows)
    df["publish_timestamp"] = pd.to_datetime(df["publish_timestamp"], errors="coerce")
    df["trading_date_anchor"] = pd.to_datetime(df["trading_date_anchor"], errors="coerce")
    return df


def load_prices() -> pd.DataFrame:
    return _read_parquet_safe(PROCESSED_DIR / "prices.parquet", date_columns=["trade_date"], table_name="prices")


def load_news() -> pd.DataFrame:
    return _read_parquet_safe(
        PROCESSED_DIR / "news_clean.parquet",
        date_columns=["publish_timestamp", "trading_date_anchor"],
        table_name="news_clean",
    )


def load_news_sentiment() -> pd.DataFrame:
    df = _read_parquet_safe(
        PROCESSED_DIR / "news_sentiment.parquet",
        date_columns=["publish_timestamp", "trading_date_anchor"],
        table_name="news_sentiment",
    )
    if not df.empty:
        return df
    return _fallback_news_sentiment()


def load_optional_table(name: str, date_columns: list[str] | None = None) -> pd.DataFrame:
    return _read_parquet_safe(PROCESSED_DIR / f"{name}.parquet", date_columns=date_columns, table_name=name)
