"""第 1 周数据流程：价格下载、新闻导入清洗、DuckDB 入库与 Parquet 落盘。"""

from __future__ import annotations

import pathlib
import sys
from datetime import date

import yaml
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.services.instrument_service import load_active_instruments
from src.data.cleaner import clean_news, clean_prices
from src.data.duckdb_client import get_connection, write_df
from src.data.news_loader import fetch_all_a_share_news, load_news_csv, match_news_to_tickers
from src.data.price_loader import download_prices, normalize_price_data
from src.utils.logging_utils import get_logger

CONFIG_PATH = ROOT / "config" / "config.yaml"
TICKERS_PATH = ROOT / "config" / "tickers.yaml"
PROCESSED_DIR = ROOT / "data" / "processed"
RAW_DIR = ROOT / "data" / "raw"
DB_PATH = PROCESSED_DIR / "market_data.duckdb"
PRICES_PARQUET = PROCESSED_DIR / "prices.parquet"
NEWS_PARQUET = PROCESSED_DIR / "news_clean.parquet"
SAMPLE_NEWS_PATH = RAW_DIR / "news_sample.csv"
DEFAULT_A_SHARE_NEWS_LIMIT = 50
CORE_A_SHARE_SYMBOLS = ["600519.SH", "300750.SZ", "601318.SH"]
SAMPLE_NEWS_LINES = [
    "publish_timestamp,title,summary,source",
    "\"2026-04-08 08:20:00\",\"贵州茅台渠道库存承压\",\"白酒渠道反馈动销分化，市场担忧高端白酒短期承压\",\"sample_feed\"",
    "\"2026-04-10 09:10:00\",\"贵州茅台一季报预期走弱\",\"多家机构下调短期增速预测，负面情绪升温\",\"sample_feed\"",
    "\"2026-04-11 18:30:00\",\"宁德时代动力电池订单承压\",\"车企价格战延续，市场关注电池盈利能力\",\"sample_feed\"",
    "\"2026-04-14 17:40:00\",\"宁德时代海外扩产推进\",\"机构认为长期竞争力仍在，但短期波动加剧\",\"sample_feed\"",
    "\"2026-04-15 07:55:00\",\"中国平安寿险改革效果显现\",\"渠道质量提升带动新业务价值改善\",\"sample_feed\"",
    "\"2026-04-17 12:45:00\",\"中国平安地产风险敞口再受关注\",\"市场担忧投资端波动影响估值修复\",\"sample_feed\"",
    "\"2026-04-18 11:15:00\",\"机构关注A股核心资产轮动\",\"贵州茅台、宁德时代和中国平安成交活跃\",\"sample_feed\"",
]


def ensure_dirs() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)


def ensure_sample_news_file() -> None:
    SAMPLE_NEWS_PATH.write_text("\n".join(SAMPLE_NEWS_LINES), encoding="utf-8")


def _build_price_path(symbol: str, dates: pd.DatetimeIndex) -> list[float]:
    if symbol == "600519.SH":
        start = 1685.0
        steps = [8.2, -12.4, -16.8, -10.5, -6.3, 5.8, 7.4, 9.6, 6.2, 11.5]
    elif symbol == "300750.SZ":
        start = 202.0
        steps = [-3.6, -5.4, -2.1, 4.8, 5.2, 3.9, -1.6, 2.8, 4.6, 3.4]
    elif symbol == "601318.SH":
        start = 41.5
        steps = [0.5, -0.3, 0.2, 0.6, 0.4, -0.2, 0.5, 0.7, 0.3, 0.4]
    else:
        start = 30.0 + (sum(ord(ch) for ch in symbol) % 90)
        steps = [((index % 5) - 2) * 0.6 + 1.0 for index in range(len(dates))]

    values: list[float] = []
    close = start
    for index, _ in enumerate(dates):
        step = steps[index] if index < len(steps) else steps[-1]
        close = round(close + step, 2)
        values.append(close)
    return values


def build_fallback_prices(tickers: list[str], start_date: str, end_date: str) -> pd.DataFrame:
    dates = pd.date_range(start_date, end_date, freq="B")
    rows = []
    for t in tickers:
        closes = _build_price_path(t, dates)
        for i, d in enumerate(dates):
            close = closes[i]
            open_price = round(close - (1.2 if i % 2 == 0 else -0.8), 2)
            rows.append(
                {
                    "ticker": t,
                    "trade_date": d.date(),
                    "open": round(open_price, 2),
                    "high": round(max(open_price, close) + max(0.8, close * 0.008), 2),
                    "low": round(min(open_price, close) - max(0.9, close * 0.009), 2),
                    "close": round(close, 2),
                    "volume": int(8_000_000 + i * 280_000 + (sum(ord(ch) for ch in t) % 2_500_000)),
                }
            )
    df = pd.DataFrame(rows).sort_values(["ticker", "trade_date"]).reset_index(drop=True)
    df["return_1d"] = df.groupby("ticker")["close"].pct_change()
    return df


def load_config() -> tuple[dict, dict]:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    with open(TICKERS_PATH, "r", encoding="utf-8") as f:
        ticker_map = yaml.safe_load(f)
    return config, ticker_map


def resolve_pipeline_tickers(config: dict) -> list[str]:
    configured = [str(item).upper() for item in config.get("default_tickers", []) if str(item).strip()]
    active_symbols = [item.symbol for item in load_active_instruments()]
    if configured:
        merged = list(dict.fromkeys(configured + active_symbols))
        return merged

    preferred = [symbol for symbol in CORE_A_SHARE_SYMBOLS if symbol in active_symbols]
    return preferred or active_symbols[:10]


def resolve_pipeline_end_date(config: dict) -> str:
    configured_end = str(config["end_date"])
    return max(configured_end, date.today().isoformat())


def load_pipeline_news(tickers: list[str], ticker_map: dict) -> pd.DataFrame:
    live_news = fetch_all_a_share_news(tickers, limit=DEFAULT_A_SHARE_NEWS_LIMIT)
    if not live_news.empty:
        return live_news

    raw_news = load_news_csv(str(SAMPLE_NEWS_PATH))
    return match_news_to_tickers(raw_news, ticker_map)


def main() -> None:
    logger = get_logger("run_data_pipeline")
    ensure_dirs()
    ensure_sample_news_file()

    config, ticker_map = load_config()
    tickers = resolve_pipeline_tickers(config)
    start_date = config["start_date"]
    end_date = resolve_pipeline_end_date(config)
    logger.info("开始执行数据流程: tickers=%s, start=%s, end=%s", tickers, start_date, end_date)

    raw_prices = download_prices(tickers=tickers, start_date=start_date, end_date=end_date)
    norm_prices = normalize_price_data(raw_prices)
    clean_price_df = clean_prices(norm_prices)
    if clean_price_df.empty:
        logger.warning("yfinance 未返回可用数据，使用本地 fallback 示例价格数据以保持流程可运行。")
        clean_price_df = build_fallback_prices(tickers, start_date, end_date)
    clean_price_df.to_parquet(PRICES_PARQUET, index=False)
    logger.info("价格数据完成: %s 行 -> %s", len(clean_price_df), PRICES_PARQUET)

    pipeline_news = load_pipeline_news(tickers, ticker_map)
    clean_news_df = clean_news(pipeline_news)
    clean_news_df.to_parquet(NEWS_PARQUET, index=False)
    logger.info("新闻数据完成: %s 行 -> %s", len(clean_news_df), NEWS_PARQUET)

    conn = get_connection(str(DB_PATH))
    try:
        write_df(conn, "stock_prices", clean_price_df)
        write_df(conn, "news_raw", clean_news_df)
    finally:
        conn.close()
    logger.info("DuckDB 入库完成: %s", DB_PATH)


if __name__ == "__main__":
    main()
