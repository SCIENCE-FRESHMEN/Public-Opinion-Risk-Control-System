"""第 4 周固化流程：交易时间锚定 + 规则预警。"""

from __future__ import annotations

import pathlib
import sys
import json

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pandas as pd
import yaml

from src.alerts.alert_engine import run_alert_engine
from src.data.duckdb_client import get_connection, write_df
from src.features.trading_anchor import assign_trading_date_anchor
from src.features.trading_calendar import trading_days_from_prices
from src.utils.logging_utils import get_logger

PROCESSED_DIR = ROOT / "data" / "processed"
CONFIG_PATH = ROOT / "config" / "config.yaml"
NEWS_SENTIMENT_PATH = PROCESSED_DIR / "news_sentiment.parquet"
DAILY_FEATURE_PATH = PROCESSED_DIR / "daily_sentiment_features.parquet"
PRICES_PATH = PROCESSED_DIR / "prices.parquet"
ALERT_OUTPUT = PROCESSED_DIR / "risk_alerts.parquet"
THRESHOLD_SNAPSHOT_OUTPUT = PROCESSED_DIR / "alert_thresholds_snapshot.json"
DB_PATH = PROCESSED_DIR / "market_data.duckdb"


def main():
    logger = get_logger("run_alert_pipeline")
    for p in [NEWS_SENTIMENT_PATH, DAILY_FEATURE_PATH, PRICES_PATH]:
        if not p.exists():
            raise FileNotFoundError(f"缺少输入文件: {p}")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    news_df = pd.read_parquet(NEWS_SENTIMENT_PATH)
    _feature_df = pd.read_parquet(DAILY_FEATURE_PATH)
    prices_df = pd.read_parquet(PRICES_PATH)

    trading_days = trading_days_from_prices(prices_df)
    anchored = assign_trading_date_anchor(
        news_df,
        trading_days=trading_days,
        market_open=cfg.get("market_open", "09:30"),
        market_close=cfg.get("market_close", "16:00"),
    )
    anchored.to_parquet(NEWS_SENTIMENT_PATH, index=False)
    persisted_news = pd.read_parquet(NEWS_SENTIMENT_PATH)
    if "trading_date_anchor" not in persisted_news.columns:
        raise RuntimeError(f"锚点列写回失败: {NEWS_SENTIMENT_PATH}")
    # 基于锚定后的新闻重算日度特征，确保预警日期与证据日期一致。
    anchored_daily = (
        anchored.groupby(["ticker", "trading_date_anchor"], as_index=False)
        .agg(
            news_count=("news_id", "count"),
            negative_ratio=("sentiment_label", lambda s: float((s == "negative").mean())),
            daily_sentiment_score=("sentiment_score", "mean"),
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
    anchored_daily["sentiment_change"] = anchored_daily.groupby("ticker")["daily_sentiment_score"].diff()
    merged = anchored_daily.copy()

    px = prices_df.copy()
    px["trade_date"] = pd.to_datetime(px["trade_date"], errors="coerce").dt.date
    px["intraday_return"] = (px["close"] - px["open"]) / px["open"]
    merged = merged.merge(
        px[["ticker", "trade_date", "return_1d", "intraday_return"]],
        left_on=["ticker", "trading_date_anchor"],
        right_on=["ticker", "trade_date"],
        how="left",
    )
    merged = merged.drop(columns=["trade_date"])
    merged.attrs["alert_thresholds"] = cfg.get("alert_thresholds", {})
    with open(THRESHOLD_SNAPSHOT_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(merged.attrs["alert_thresholds"], f, ensure_ascii=False, indent=2)

    alerts = run_alert_engine(merged)
    # 偏误保护：仅保留有新闻证据的预警日期。
    evidence = anchored[["ticker", "trading_date_anchor"]].drop_duplicates().rename(
        columns={"trading_date_anchor": "trade_date"}
    )
    alerts = alerts.merge(evidence, on=["ticker", "trade_date"], how="inner")
    alerts.to_parquet(ALERT_OUTPUT, index=False)
    logger.info("风险预警结果已写入: %s (%s 行)", ALERT_OUTPUT, len(alerts))
    logger.info("预警阈值快照已写入: %s", THRESHOLD_SNAPSHOT_OUTPUT)

    try:
        conn = get_connection(str(DB_PATH))
        try:
            write_df(conn, "news_sentiment", anchored)
            write_df(conn, "risk_alerts", alerts)
        finally:
            conn.close()
        logger.info("DuckDB 同步完成: %s", DB_PATH)
    except Exception as exc:
        logger.warning("DuckDB 同步失败（不影响 parquet 产物）：%s", exc)


if __name__ == "__main__":
    main()
