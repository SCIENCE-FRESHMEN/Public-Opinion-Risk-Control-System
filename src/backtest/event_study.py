"""事件驱动回测模块。"""

from __future__ import annotations

import pandas as pd

from src.backtest.metrics import max_drawdown, negative_return_ratio


def _forward_window_returns(price_slice: pd.DataFrame, horizon: int) -> list[float]:
    vals = price_slice["return_1d"].dropna().astype(float).tolist()
    if not vals:
        return []
    return vals[:horizon]


def calculate_forward_returns(alerts_df: pd.DataFrame, prices_df: pd.DataFrame, horizons=(3, 5, 10)) -> pd.DataFrame:
    if alerts_df.empty or prices_df.empty:
        return pd.DataFrame()

    px = prices_df.copy()
    px["trade_date"] = pd.to_datetime(px["trade_date"], errors="coerce").dt.date
    px = px.sort_values(["ticker", "trade_date"])

    rows = []
    for _, a in alerts_df.iterrows():
        ticker = a["ticker"]
        d = pd.to_datetime(a["trade_date"], errors="coerce").date()
        series = px[px["ticker"] == ticker].copy()
        if series.empty:
            continue
        future = series[series["trade_date"] > d].copy()
        if future.empty:
            continue
        for h in horizons:
            ws = _forward_window_returns(future, int(h))
            if not ws:
                continue
            rows.append(
                {
                    "ticker": ticker,
                    "trade_date": d,
                    "alert_type": a["alert_type"],
                    "alert_level": a.get("alert_level", ""),
                    "horizon": int(h),
                    "avg_return": float(sum(ws) / len(ws)),
                    "cum_return": float((pd.Series(ws) + 1.0).prod() - 1.0),
                    "max_drawdown": float(max_drawdown(ws)),
                    "negative_return_ratio": float(negative_return_ratio(ws)),
                    "volatility": float(pd.Series(ws).std(ddof=0)) if len(ws) > 1 else 0.0,
                    "n_obs": len(ws),
                }
            )
    return pd.DataFrame(rows)


def run_event_study(alerts_df: pd.DataFrame, prices_df: pd.DataFrame) -> pd.DataFrame:
    raw = calculate_forward_returns(alerts_df, prices_df, horizons=(3, 5, 10))
    if raw.empty:
        return pd.DataFrame(
            columns=[
                "ticker",
                "alert_type",
                "horizon",
                "trigger_count",
                "avg_return",
                "cum_return",
                "max_drawdown",
                "negative_return_ratio",
                "volatility",
            ]
        )

    grouped = (
        raw.groupby(["ticker", "alert_type", "horizon"], as_index=False)
        .agg(
            trigger_count=("trade_date", "count"),
            avg_return=("avg_return", "mean"),
            cum_return=("cum_return", "mean"),
            max_drawdown=("max_drawdown", "mean"),
            negative_return_ratio=("negative_return_ratio", "mean"),
            volatility=("volatility", "mean"),
        )
        .sort_values(["ticker", "alert_type", "horizon"])
        .reset_index(drop=True)
    )
    return grouped


def build_event_level_results(alerts_df: pd.DataFrame, prices_df: pd.DataFrame) -> pd.DataFrame:
    """
    生成事件级结果（按 ticker+trade_date+alert_type+alert_level+horizon），
    用于前端明细展示和解释性分析。
    """
    raw = calculate_forward_returns(alerts_df, prices_df, horizons=(3, 5, 10))
    if raw.empty:
        return pd.DataFrame(
            columns=[
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
            ]
        )
    return raw[
        [
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
        ]
    ].sort_values(["trade_date", "ticker", "alert_type", "horizon"]).reset_index(drop=True)
