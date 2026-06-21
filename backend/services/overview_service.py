from datetime import datetime

import pandas as pd

from app.components.data_access import load_optional_table, load_prices
from backend.schemas.common import SeriesPoint
from backend.schemas.overview import (
    MetricValue,
    OverviewAlertRow,
    OverviewHeader,
    OverviewKpis,
    OverviewPayload,
    RiskMetric,
)
from backend.services.date_projection import build_daily_window, build_projection_context, clamp_projected_frame, extend_with_boundary_points
from backend.services.submission_quote_service import (
    apply_submission_quote_to_price_frame,
    load_submission_quotes as _load_submission_quotes,
    should_use_submission_quote,
)


def _build_projected_price_context(price_view: pd.DataFrame, start_date: str, end_date: str) -> pd.DataFrame:
    if price_view.empty:
        return pd.DataFrame(columns=["trade_date", "close"])

    context = build_projection_context(start_date, end_date, price_view["trade_date"])
    projected = clamp_projected_frame(price_view, "trade_date", context)
    if projected.empty:
        projected = price_view.tail(1).copy()
        projected["trade_date"] = pd.to_datetime(end_date)

    daily_window = build_daily_window(context)
    projected = projected.set_index("trade_date").reindex(daily_window)
    projected["close"] = projected["close"].interpolate(method="linear").ffill().bfill()
    projected.index.name = "trade_date"
    projected = projected.reset_index()
    return projected.tail(30)


def _build_projected_alerts(alerts_view: pd.DataFrame, end_date: str) -> list[OverviewAlertRow]:
    if alerts_view.empty:
        return []

    context = build_projection_context(end_date, end_date, alerts_view["trade_date"])
    projected = clamp_projected_frame(alerts_view, "trade_date", context)
    if projected.empty:
        projected = alerts_view.head(1).copy()
        projected["trade_date"] = pd.to_datetime(end_date)

    alert_type_map = {
        "negative_spike": "负面情绪激增",
        "sentiment_price_divergence": "情绪价格背离",
        "news_heat_spike": "新闻热度激增",
    }
    severity_map = {
        "HIGH": "高",
        "MEDIUM": "中",
        "LOW": "低",
        "High": "高",
        "Medium": "中",
        "Low": "低",
    }
    fallback_times = ["14:32:00", "13:18:00", "11:06:00", "09:45:00"]
    rows = []
    for index, row in enumerate(projected.sort_values("trade_date", ascending=False).head(8).itertuples()):
        rows.append(
            OverviewAlertRow(
                trade_date=pd.to_datetime(row.trade_date).strftime("%Y-%m-%d"),
                timestamp=fallback_times[index % len(fallback_times)],
                alert_type=alert_type_map.get(str(row.alert_type), str(row.alert_type)),
                severity=severity_map.get(str(getattr(row, "alert_level", "")), "中"),
                description=str(row.description),
            )
        )
    return rows


def _build_projected_features(feature_view: pd.DataFrame, start_date: str, end_date: str) -> pd.DataFrame:
    if feature_view.empty:
        return pd.DataFrame()

    feature_view = feature_view.copy()
    feature_view["trading_date_anchor"] = pd.to_datetime(feature_view["trading_date_anchor"], errors="coerce")
    context = build_projection_context(start_date, end_date, feature_view["trading_date_anchor"])
    projected = clamp_projected_frame(feature_view, "trading_date_anchor", context)
    if projected.empty:
        nearest_future = feature_view[feature_view["trading_date_anchor"] > pd.to_datetime(end_date).normalize()].head(1)
        projected = nearest_future if not nearest_future.empty else feature_view.tail(1).copy()
        projected["trading_date_anchor"] = pd.to_datetime(end_date)
    if context.offset_days == 0:
        projected = extend_with_boundary_points(feature_view, "trading_date_anchor", start_date, end_date)
        if projected.empty:
            nearest_future = feature_view[feature_view["trading_date_anchor"] > pd.to_datetime(end_date).normalize()].head(1)
            projected = nearest_future if not nearest_future.empty else feature_view.tail(1).copy()
            projected["trading_date_anchor"] = pd.to_datetime(end_date)
    daily_window = build_daily_window(context)
    interpolation_index = daily_window.union(pd.DatetimeIndex(projected["trading_date_anchor"]))
    projected = projected.set_index("trading_date_anchor").reindex(interpolation_index)
    projected["daily_sentiment_score"] = pd.to_numeric(projected["daily_sentiment_score"], errors="coerce")
    projected["news_count"] = pd.to_numeric(projected["news_count"], errors="coerce")
    projected["negative_ratio"] = pd.to_numeric(projected["negative_ratio"], errors="coerce")
    projected["daily_sentiment_score"] = projected["daily_sentiment_score"].interpolate(method="linear", limit_area="inside").fillna(0.0)
    projected["news_count"] = projected["news_count"].interpolate(method="nearest", limit_area="inside").fillna(0.0)
    projected["negative_ratio"] = projected["negative_ratio"].interpolate(method="nearest", limit_area="inside").fillna(0.0)
    projected = projected.loc[daily_window]
    projected.index.name = "trading_date_anchor"
    return projected.reset_index()


def build_overview_payload(ticker: str, start_date: str, end_date: str) -> OverviewPayload:
    prices = load_prices()
    features = load_optional_table("daily_sentiment_features", date_columns=["trading_date_anchor"])
    alerts = load_optional_table("risk_alerts", date_columns=["trade_date"])
    submission_quotes = _load_submission_quotes()

    price_view = prices[prices["ticker"] == ticker].copy().sort_values("trade_date")
    feature_view = (
        features[features["ticker"] == ticker].copy().sort_values("trading_date_anchor")
        if not features.empty
        else pd.DataFrame()
    )
    alerts_view = (
        alerts[alerts["ticker"] == ticker].copy().sort_values("trade_date", ascending=False)
        if not alerts.empty
        else pd.DataFrame()
    )

    projected_prices = _build_projected_price_context(price_view, start_date, end_date)
    latest_price = float(projected_prices["close"].iloc[-1]) if not projected_prices.empty else 0.0
    delta = float(projected_prices["close"].iloc[-1] / projected_prices["close"].iloc[-2] - 1) if len(projected_prices) >= 2 else 0.0
    projected_features = _build_projected_features(feature_view, start_date, end_date)
    latest_feature = projected_features.iloc[-1] if not projected_features.empty else None
    sentiment_score = float(latest_feature["daily_sentiment_score"]) if latest_feature is not None else 0.0
    news_count = int(latest_feature["news_count"]) if latest_feature is not None else 0
    negative_ratio = float(latest_feature["negative_ratio"]) if latest_feature is not None else 0.0
    risk_level = "高" if negative_ratio >= 0.6 else "中" if negative_ratio >= 0.45 else "低"
    submission_quote = (
        submission_quotes[submission_quotes["ticker"] == ticker].head(1)
        if not submission_quotes.empty
        else pd.DataFrame()
    )
    as_of = f"{end_date}T15:00:00"
    latest_local_trade_date = (
        pd.to_datetime(price_view["trade_date"], errors="coerce").max()
        if not price_view.empty and "trade_date" in price_view.columns
        else pd.NaT
    )
    use_submission_quote = should_use_submission_quote(submission_quote, latest_local_trade_date, end_date)
    if use_submission_quote:
        projected_prices = apply_submission_quote_to_price_frame(projected_prices, submission_quote, end_date)
        quote_row = submission_quote.iloc[0]
        if pd.notna(quote_row["current_price"]):
            latest_price = float(quote_row["current_price"])
        if pd.notna(quote_row["change_percent"]):
            delta = float(quote_row["change_percent"]) / 100.0
        if pd.notna(quote_row["quote_time"]):
            as_of = pd.to_datetime(quote_row["quote_time"]).strftime("%Y-%m-%d %H:%M:%S")

    price_context = [
        SeriesPoint(date=pd.to_datetime(row.trade_date).strftime("%Y-%m-%d"), value=float(row.close))
        for row in projected_prices.itertuples()
    ]
    alert_rows = _build_projected_alerts(alerts_view, end_date)

    return OverviewPayload(
        header=OverviewHeader(ticker=ticker, as_of=as_of),
        kpis=OverviewKpis(
            price=MetricValue(value=latest_price, delta=delta),
            sentiment=MetricValue(value=sentiment_score, label="中性偏空" if sentiment_score < 0 else "中性偏多"),
            news_heat=MetricValue(value=news_count, label="24H"),
            risk=RiskMetric(level=risk_level, label={"低": "低风险", "中": "中风险", "高": "高风险"}[risk_level]),
        ),
        price_context=price_context,
        alerts=alert_rows,
    )
