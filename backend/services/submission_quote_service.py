from __future__ import annotations

import pandas as pd

from backend.services.data_loader import ROOT

SUBMISSION_TENCENT_QUOTE_PATH = ROOT / "submission_final" / "data_package" / "tencent_realtime_quote.csv"


def load_submission_quotes() -> pd.DataFrame:
    if not SUBMISSION_TENCENT_QUOTE_PATH.exists():
        return pd.DataFrame(columns=["ticker", "current_price", "change_percent", "quote_time"])

    quote_df = pd.read_csv(SUBMISSION_TENCENT_QUOTE_PATH, encoding="utf-8-sig")
    if quote_df.empty:
        return pd.DataFrame(columns=["ticker", "current_price", "change_percent", "quote_time"])

    quote_df = quote_df.copy()
    quote_df["ticker"] = quote_df["stock_code"].astype(str).str.zfill(6).apply(
        lambda code: f"{code}.SH" if code.startswith(("600", "601", "603", "605", "688", "900")) else f"{code}.SZ"
    )
    quote_df["current_price"] = pd.to_numeric(quote_df["current_price"], errors="coerce")
    quote_df["change_percent"] = pd.to_numeric(quote_df["change_percent"], errors="coerce")
    quote_df["quote_time"] = pd.to_datetime(quote_df["quote_time"], format="%Y%m%d%H%M%S", errors="coerce")
    return quote_df[["ticker", "current_price", "change_percent", "quote_time"]]


def should_use_submission_quote(
    submission_quote: pd.DataFrame,
    latest_local_trade_date: pd.Timestamp | pd.NaT,
    end_date: str,
) -> bool:
    if submission_quote.empty:
        return False
    return pd.isna(latest_local_trade_date) or pd.to_datetime(end_date) >= pd.to_datetime(latest_local_trade_date).normalize()


def apply_submission_quote_to_price_frame(
    price_frame: pd.DataFrame,
    submission_quote: pd.DataFrame,
    end_date: str,
) -> pd.DataFrame:
    if submission_quote.empty:
        return price_frame

    quote_row = submission_quote.iloc[0]
    if pd.isna(quote_row.get("current_price")):
        return price_frame

    result = price_frame.copy()
    if result.empty:
        return pd.DataFrame([{"trade_date": pd.to_datetime(end_date), "close": float(quote_row["current_price"])}])

    result.loc[result.index[-1], "trade_date"] = pd.to_datetime(end_date)
    result.loc[result.index[-1], "close"] = float(quote_row["current_price"])
    return result
