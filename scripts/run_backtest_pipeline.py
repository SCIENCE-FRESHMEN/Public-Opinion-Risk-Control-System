"""第 4 周固化流程：事件驱动统计（3/5/10日）。"""

from __future__ import annotations

import pathlib
import sys
import json

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pandas as pd

from src.backtest.bias_checks import check_no_lookahead
from src.backtest.event_study import build_event_level_results, run_event_study
from src.data.duckdb_client import get_connection, write_df
from src.utils.logging_utils import get_logger

PROCESSED_DIR = ROOT / "data" / "processed"
ALERT_PATH = PROCESSED_DIR / "risk_alerts.parquet"
PRICES_PATH = PROCESSED_DIR / "prices.parquet"
NEWS_SENTIMENT_PATH = PROCESSED_DIR / "news_sentiment.parquet"
BACKTEST_OUTPUT = PROCESSED_DIR / "backtest_results.parquet"
BACKTEST_EVENT_OUTPUT = PROCESSED_DIR / "backtest_event_results.parquet"
BIAS_REPORT_OUTPUT = PROCESSED_DIR / "bias_check_report.json"
DB_PATH = PROCESSED_DIR / "market_data.duckdb"


def main():
    logger = get_logger("run_backtest_pipeline")
    for p in [ALERT_PATH, PRICES_PATH, NEWS_SENTIMENT_PATH]:
        if not p.exists():
            raise FileNotFoundError(f"缺少输入文件: {p}")

    alerts = pd.read_parquet(ALERT_PATH)
    prices = pd.read_parquet(PRICES_PATH)
    news = pd.read_parquet(NEWS_SENTIMENT_PATH)

    bias_report = check_no_lookahead(news, alerts)
    with open(BIAS_REPORT_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(bias_report, f, ensure_ascii=False, indent=2, default=str)
    logger.info("偏误检查报告已写入: %s (passed=%s)", BIAS_REPORT_OUTPUT, bias_report.get("passed"))

    results = run_event_study(alerts, prices)
    results.to_parquet(BACKTEST_OUTPUT, index=False)
    logger.info("回测统计已写入: %s (%s 行)", BACKTEST_OUTPUT, len(results))

    event_results = build_event_level_results(alerts, prices)
    event_results.to_parquet(BACKTEST_EVENT_OUTPUT, index=False)
    logger.info("事件级回测结果已写入: %s (%s 行)", BACKTEST_EVENT_OUTPUT, len(event_results))

    try:
        conn = get_connection(str(DB_PATH))
        try:
            write_df(conn, "backtest_results", results)
            write_df(conn, "backtest_event_results", event_results)
        finally:
            conn.close()
        logger.info("DuckDB 同步完成: %s", DB_PATH)
    except Exception as exc:
        logger.warning("DuckDB 同步失败（不影响 parquet 产物）：%s", exc)


if __name__ == "__main__":
    main()
