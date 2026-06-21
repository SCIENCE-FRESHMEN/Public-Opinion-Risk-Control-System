"""价格特征生成模块。"""

from __future__ import annotations

import pandas as pd


def add_return_features(price_df: pd.DataFrame) -> pd.DataFrame:
    df = price_df.copy()
    if "close" in df.columns:
        df["return_1d"] = df.groupby("ticker")["close"].pct_change()
    return df


def add_volatility_features(price_df: pd.DataFrame) -> pd.DataFrame:
    df = price_df.copy()
    return df
