import pandas as pd

from app.components.data_access import load_optional_table
from backend.schemas.backtest import (
    BacktestPayload,
    BacktestSummary,
    DistributionPayload,
    EventRow,
    TrajectoryPoint,
)
from backend.services.date_projection import build_projection_context, project_timestamp

ALERT_TYPE_ALIASES = {
    "Negative Sentiment Spike": "negative_spike",
    "负面情绪激增": "negative_spike",
    "negative_spike": "negative_spike",
    "News Heat Spike": "news_heat_spike",
    "新闻热度激增": "news_heat_spike",
    "news_heat_spike": "news_heat_spike",
    "Sentiment Price Divergence": "sentiment_price_divergence",
    "情绪价格背离": "sentiment_price_divergence",
    "sentiment_price_divergence": "sentiment_price_divergence",
    "全部": "全部",
}

ALERT_TYPE_LABELS = {
    "negative_spike": "负面情绪激增",
    "news_heat_spike": "新闻热度激增",
    "sentiment_price_divergence": "情绪价格背离",
}

ALERT_TYPE_PRIORITY = [
    "news_heat_spike",
    "negative_spike",
    "sentiment_price_divergence",
]


def _normalize_alert_type(alert_type: str) -> str:
    return ALERT_TYPE_ALIASES.get(alert_type, alert_type)


def _display_alert_type(alert_type: str) -> str:
    return ALERT_TYPE_LABELS.get(alert_type, alert_type)


def _resolve_effective_alert_type(backtest: pd.DataFrame, ticker: str | None, normalized_alert_type: str) -> str:
    if backtest.empty or normalized_alert_type == "全部":
        return normalized_alert_type

    ticker_view = backtest[backtest["ticker"] == ticker] if ticker and "ticker" in backtest.columns else backtest
    if ticker_view.empty:
        return normalized_alert_type

    if (ticker_view["alert_type"] == normalized_alert_type).any():
        return normalized_alert_type

    available = set(ticker_view["alert_type"].dropna().astype(str))
    for candidate in ALERT_TYPE_PRIORITY:
        if candidate in available:
            return candidate
    return sorted(available)[0] if available else normalized_alert_type


def build_backtest_payload(
    alert_type: str,
    horizon: int,
    ticker: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> BacktestPayload:
    backtest = load_optional_table("backtest_results", date_columns=["trade_date"])
    events = load_optional_table("backtest_event_results", date_columns=["trade_date"])
    normalized_alert_type = _normalize_alert_type(alert_type)
    effective_alert_type = _resolve_effective_alert_type(backtest, ticker, normalized_alert_type)
    effective_end_date = end_date or "2026-04-21"

    view = backtest.copy()
    if not view.empty and effective_alert_type != "全部":
        view = view[view["alert_type"] == effective_alert_type]
    if not view.empty and ticker and "ticker" in view.columns:
        view = view[view["ticker"] == ticker]
    view_h = view[view["horizon"] == horizon] if not view.empty else pd.DataFrame()

    event_view = events.copy()
    if not event_view.empty and effective_alert_type != "全部":
        event_view = event_view[event_view["alert_type"] == effective_alert_type]
    if not event_view.empty and ticker:
        event_view = event_view[event_view["ticker"] == ticker]
    event_view = event_view[event_view["horizon"] == horizon] if not event_view.empty else pd.DataFrame()
    if not event_view.empty:
        projection_context = build_projection_context(start_date or effective_end_date, effective_end_date, event_view["trade_date"])
        event_view = event_view.copy()
        event_view["projected_trade_date"] = event_view["trade_date"].apply(lambda value: project_timestamp(value, projection_context))
        if start_date:
            event_view = event_view[event_view["projected_trade_date"] >= pd.to_datetime(start_date)]
        if end_date:
            event_view = event_view[event_view["projected_trade_date"] <= pd.to_datetime(end_date)]
        event_view = event_view.sort_values(["projected_trade_date", "ticker"], ascending=[False, True]).reset_index(drop=True)

    if view_h.empty:
        return BacktestPayload(
            summary=BacktestSummary(historical_triggers=0, mean_forward_return=0.0, max_drawdown=0.0, negative_hit_rate=0.0),
            active_alert_type=_display_alert_type(effective_alert_type),
            trajectory=[],
            distribution=DistributionPayload(min=0.0, q1=0.0, median=0.0, q3=0.0, max=0.0),
            events=[],
        )

    summary = BacktestSummary(
        historical_triggers=int(view_h["event_count"].sum()) if "event_count" in view_h else int(view_h["trigger_count"].sum()) if "trigger_count" in view_h else len(view_h),
        mean_forward_return=float(view_h["avg_return"].mean()) if "avg_return" in view_h else 0.0,
        max_drawdown=float(view_h["max_drawdown"].mean()) if "max_drawdown" in view_h else 0.0,
        negative_hit_rate=float(view_h["negative_ratio"].mean()) if "negative_ratio" in view_h else float(view_h["negative_return_ratio"].mean()) if "negative_return_ratio" in view_h else 0.0,
    )
    trajectory = [
        TrajectoryPoint(horizon=int(row.horizon), avg_return=float(row.avg_return))
        for row in view.groupby("horizon", as_index=False)["avg_return"].mean().itertuples()
    ] if not view.empty else []

    event_return_column = "forward_return" if "forward_return" in event_view else "avg_return" if "avg_return" in event_view else None
    if not event_view.empty and event_return_column:
        series = event_view[event_return_column].astype(float)
        distribution = DistributionPayload(
            min=float(series.min()),
            q1=float(series.quantile(0.25)),
            median=float(series.median()),
            q3=float(series.quantile(0.75)),
            max=float(series.max()),
        )
        event_rows = [
            EventRow(
                ticker=str(row.ticker),
                trade_date=pd.to_datetime(row.projected_trade_date).strftime("%Y-%m-%d"),
                alert_type=ALERT_TYPE_LABELS.get(str(row.alert_type), str(row.alert_type)),
                horizon=int(row.horizon),
                forward_return=float(getattr(row, event_return_column)),
            )
            for row in event_view.head(50).itertuples()
        ]
    else:
        distribution = DistributionPayload(min=0.0, q1=0.0, median=0.0, q3=0.0, max=0.0)
        event_rows = []

    return BacktestPayload(
        summary=summary,
        active_alert_type=_display_alert_type(effective_alert_type),
        trajectory=trajectory,
        distribution=distribution,
        events=event_rows,
    )
