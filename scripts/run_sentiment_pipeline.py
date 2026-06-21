"""第 4 周固化流程：新闻级情绪打分 + 日度特征聚合。"""

from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pandas as pd

from src.data.duckdb_client import get_connection, write_df
from src.features.sentiment_features import build_daily_sentiment_features
from src.sentiment.sentiment_pipeline import run_sentiment_pipeline
from src.utils.logging_utils import get_logger

PROCESSED_DIR = ROOT / "data" / "processed"
NEWS_INPUT = PROCESSED_DIR / "news_clean.parquet"
NEWS_SENTIMENT_OUTPUT = PROCESSED_DIR / "news_sentiment.parquet"
DAILY_FEATURE_OUTPUT = PROCESSED_DIR / "daily_sentiment_features.parquet"
DB_PATH = PROCESSED_DIR / "market_data.duckdb"


def main() -> None:
    logger = get_logger("run_sentiment_pipeline")
    if not NEWS_INPUT.exists():
        raise FileNotFoundError(f"缺少输入文件: {NEWS_INPUT}")

    news_df = pd.read_parquet(NEWS_INPUT)
    news_sentiment_df = run_sentiment_pipeline(news_df, method="hybrid")
    news_sentiment_df.to_parquet(NEWS_SENTIMENT_OUTPUT, index=False)
    logger.info("新闻级情绪结果已写入: %s (%s 行)", NEWS_SENTIMENT_OUTPUT, len(news_sentiment_df))

    daily_features = build_daily_sentiment_features(news_sentiment_df)
    daily_features.to_parquet(DAILY_FEATURE_OUTPUT, index=False)
    logger.info("日度情绪特征已写入: %s (%s 行)", DAILY_FEATURE_OUTPUT, len(daily_features))

    conn = get_connection(str(DB_PATH))
    try:
        write_df(conn, "news_sentiment", news_sentiment_df)
        write_df(conn, "daily_sentiment_features", daily_features)
    finally:
        conn.close()
    logger.info("DuckDB 同步完成: %s", DB_PATH)


if __name__ == "__main__":
    main()
