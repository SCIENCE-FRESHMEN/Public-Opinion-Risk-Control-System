"""回测指标计算模块。"""

from __future__ import annotations

import pandas as pd


def max_drawdown(price_series):
    s = pd.Series(price_series).dropna().astype(float)
    if s.empty:
        return 0.0
    nav = (1.0 + s).cumprod() if s.abs().max() < 2 else s
    peak = nav.cummax()
    dd = nav / peak - 1.0
    return float(dd.min())


def negative_return_ratio(returns):
    s = pd.Series(returns).dropna().astype(float)
    if s.empty:
        return 0.0
    return float((s < 0).mean())
