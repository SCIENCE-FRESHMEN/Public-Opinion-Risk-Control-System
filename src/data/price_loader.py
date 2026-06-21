"""股票价格数据读取模块。"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Iterable

import pandas as pd
import yfinance as yf

try:
    import akshare as ak
except Exception:  # pragma: no cover - runtime optional dependency
    ak = None

logger = logging.getLogger(__name__)


def normalize_vendor_symbol(ticker: str) -> str:
    symbol = str(ticker).upper()
    if symbol.endswith(".SH"):
        return f"{symbol[:-3]}.SS"
    return symbol


def _iter_year_ranges(start_date: str, end_date: str) -> Iterable[tuple[str, str]]:
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    current = start
    while current <= end:
        chunk_end = min(pd.Timestamp(year=current.year, month=12, day=31), end)
        yield current.strftime("%Y%m%d"), chunk_end.strftime("%Y%m%d")
        current = chunk_end + pd.Timedelta(days=1)


def _download_a_share_prices(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    if ak is None:
        logger.warning("akshare 未安装或导入失败，跳过 A 股原生价格源: %s", ticker)
        return pd.DataFrame()

    symbol = str(ticker).upper()
    if not (symbol.endswith(".SH") or symbol.endswith(".SZ")):
        return pd.DataFrame()

    code = symbol.split(".")[0]
    chunks: list[pd.DataFrame] = []
    for chunk_start, chunk_end in _iter_year_ranges(start_date, end_date):
        try:
            raw = ak.stock_zh_a_hist(
                symbol=code,
                period="daily",
                start_date=chunk_start,
                end_date=chunk_end,
                adjust="qfq",
            )
        except Exception as exc:
            logger.warning("akshare 抓取失败: ticker=%s, start=%s, end=%s, error=%s", symbol, chunk_start, chunk_end, exc)
            continue
        if raw is not None and not raw.empty:
            chunks.append(raw)

    if not chunks:
        logger.warning("akshare 未返回可用价格数据: ticker=%s, start=%s, end=%s", symbol, start_date, end_date)
        return pd.DataFrame()

    raw = pd.concat(chunks, ignore_index=True).drop_duplicates(subset=["日期"]).sort_values("日期")
    logger.info("akshare 价格数据完成: ticker=%s, rows=%s", symbol, len(raw))

    rename_map = {
        "日期": "trade_date",
        "开盘": "open",
        "收盘": "close",
        "最高": "high",
        "最低": "low",
        "成交量": "volume",
    }
    local = raw.rename(columns=rename_map).copy()
    keep = [column for column in ["trade_date", "open", "high", "low", "close", "volume"] if column in local.columns]
    local = local[keep]
    local["ticker"] = symbol
    return local


def _download_a_share_prices_sina(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    if ak is None:
        return pd.DataFrame()

    symbol = str(ticker).upper()
    if symbol.endswith(".SH"):
        vendor_symbol = f"sh{symbol[:-3]}"
    elif symbol.endswith(".SZ"):
        vendor_symbol = f"sz{symbol[:-3]}"
    else:
        return pd.DataFrame()

    try:
        raw = ak.stock_zh_a_daily(
            symbol=vendor_symbol,
            start_date=start_date.replace("-", ""),
            end_date=end_date.replace("-", ""),
            adjust="qfq",
        )
    except Exception as exc:
        logger.warning("新浪 A 股日线抓取失败: ticker=%s, error=%s", symbol, exc)
        return pd.DataFrame()

    if raw is None or raw.empty:
        logger.warning("新浪 A 股日线未返回可用数据: ticker=%s, start=%s, end=%s", symbol, start_date, end_date)
        return pd.DataFrame()

    local = raw.rename(columns={"date": "trade_date"}).copy()
    keep = [column for column in ["trade_date", "open", "high", "low", "close", "volume"] if column in local.columns]
    local = local[keep]
    local["ticker"] = symbol
    logger.info("新浪 A 股日线完成: ticker=%s, rows=%s", symbol, len(local))
    return local


def _download_yfinance_prices(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    raw = yf.download(
        tickers=normalize_vendor_symbol(ticker),
        start=start_date,
        end=(pd.to_datetime(end_date) + timedelta(days=1)).strftime("%Y-%m-%d"),
        interval="1d",
        auto_adjust=False,
        progress=False,
        threads=False,
    )
    if raw.empty:
        return pd.DataFrame()
    local = raw.reset_index().copy()
    local["ticker"] = ticker
    return local


def _has_reasonable_coverage(raw: pd.DataFrame, start_date: str, end_date: str) -> bool:
    if raw.empty or "trade_date" not in raw.columns:
        return False

    dates = pd.to_datetime(raw["trade_date"], errors="coerce").dropna()
    if dates.empty:
        return False

    expected_business_days = len(pd.date_range(start_date, end_date, freq="B"))
    if expected_business_days <= 0:
        return False

    coverage_ratio = len(dates.drop_duplicates()) / expected_business_days
    end_gap_days = (pd.to_datetime(end_date) - dates.max()).days
    return coverage_ratio >= 0.8 and end_gap_days <= 3


def download_prices(tickers: Iterable[str], start_date: str, end_date: str) -> pd.DataFrame:
    """优先使用 A 股原生数据源，失败时回退到新浪 A 股日线，再回退到 yfinance。"""
    frames: list[pd.DataFrame] = []
    for ticker in tickers:
        raw = _download_a_share_prices(ticker, start_date, end_date)
        if str(ticker).upper().endswith((".SH", ".SZ")) and not _has_reasonable_coverage(raw, start_date, end_date):
            raw = pd.DataFrame()
        if raw.empty:
            raw = _download_a_share_prices_sina(ticker, start_date, end_date)
        if raw.empty:
            try:
                raw = _download_yfinance_prices(ticker, start_date, end_date)
            except Exception as exc:
                logger.warning("yfinance 抓取失败: ticker=%s, error=%s", ticker, exc)
                raw = pd.DataFrame()
        if raw.empty:
            continue
        frames.append(raw)

    if not frames:
        return pd.DataFrame(
            columns=["ticker", "trade_date", "open", "high", "low", "close", "volume", "return_1d"]
        )
    return pd.concat(frames, ignore_index=True)


def normalize_price_data(raw_df: pd.DataFrame) -> pd.DataFrame:
    """标准化价格数据字段。"""
    if raw_df.empty:
        return pd.DataFrame(
            columns=["ticker", "trade_date", "open", "high", "low", "close", "volume", "return_1d"]
        )

    df = raw_df.copy()
    if isinstance(df.columns, pd.MultiIndex):
        # yfinance 在不同版本可能返回多级列，统一扁平化。
        df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    rename_map = {"date": "trade_date", "adj_close": "adj_close"}
    df = df.rename(columns=rename_map)
    required = ["ticker", "trade_date", "open", "high", "low", "close", "volume"]
    existing = [c for c in required if c in df.columns]
    df = df[existing].copy()

    df["ticker"] = df["ticker"].astype(str).str.upper()
    df["trade_date"] = pd.to_datetime(df["trade_date"], errors="coerce").dt.date
    for col in ["open", "high", "low", "close", "volume"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.sort_values(["ticker", "trade_date"]).reset_index(drop=True)
    df["return_1d"] = df.groupby("ticker")["close"].pct_change()
    return df
