import pandas as pd

from app.components.data_access import load_optional_table, load_prices
from backend.schemas.common import SeriesPoint
from backend.schemas.linkage import (
    AlertSpike,
    AnchorPayload,
    LinkagePayload,
    LinkageSeriesGroup,
    LinkageSummary,
)
from backend.services.date_projection import build_daily_window, build_projection_context, clamp_projected_frame, extend_with_boundary_points
from backend.services.instrument_service import load_active_instruments
from backend.services.submission_quote_service import (
    apply_submission_quote_to_price_frame,
    load_submission_quotes as _load_submission_quotes,
    should_use_submission_quote,
)

SECTOR_MAP = {
    '600519.SH': '消费',
    '000858.SZ': '消费',
    '300750.SZ': '新能源',
    '002594.SZ': '新能源',
    '601318.SH': '金融',
}

INSTRUMENT_SECTOR_MAP = {instrument.symbol: instrument.sector_group for instrument in load_active_instruments()}


def _as_finite_number(value: object, fallback: float = 0.0) -> float:
    numeric = pd.to_numeric(pd.Series([value]), errors='coerce').iloc[0]
    if pd.isna(numeric):
        return fallback
    return float(numeric)


def _project_price_series(price_view: pd.DataFrame, start_date: str, end_date: str) -> pd.DataFrame:
    if price_view.empty:
        return pd.DataFrame({'trade_date': pd.date_range(start_date, end_date, freq='D'), 'close': 0.0})
    context = build_projection_context(start_date, end_date, price_view['trade_date'])
    projected = clamp_projected_frame(price_view, 'trade_date', context)
    if projected.empty:
        projected = price_view.tail(1).copy()
        projected['trade_date'] = pd.to_datetime(end_date)
    daily_window = build_daily_window(context)
    projected = projected.set_index('trade_date').reindex(daily_window)
    projected['close'] = pd.to_numeric(projected['close'], errors='coerce')
    projected['close'] = projected['close'].interpolate(method='linear').ffill().bfill().fillna(0.0)
    projected.index.name = 'trade_date'
    return projected.reset_index()


def _project_feature_series(feature_view: pd.DataFrame, daily_index: pd.DatetimeIndex, start_date: str, end_date: str) -> pd.DataFrame:
    if feature_view.empty:
        return pd.DataFrame({'trading_date_anchor': daily_index, 'daily_sentiment_score': 0.0, 'news_count': 0.0, 'negative_ratio': 0.0})

    feature_view = feature_view.copy()
    feature_view['trading_date_anchor'] = pd.to_datetime(feature_view['trading_date_anchor'], errors='coerce')
    context = build_projection_context(start_date, end_date, feature_view['trading_date_anchor'])
    projected = clamp_projected_frame(feature_view, 'trading_date_anchor', context)
    if projected.empty:
        nearest_future = feature_view[feature_view['trading_date_anchor'] > pd.to_datetime(end_date).normalize()].head(1)
        projected = nearest_future if not nearest_future.empty else feature_view.tail(1).copy()
        projected['trading_date_anchor'] = pd.to_datetime(end_date)
    elif context.offset_days == 0:
        projected = extend_with_boundary_points(feature_view, 'trading_date_anchor', start_date, end_date)
    interpolation_index = daily_index.union(pd.DatetimeIndex(projected['trading_date_anchor']))
    projected = projected.set_index('trading_date_anchor').reindex(interpolation_index)
    projected['daily_sentiment_score'] = pd.to_numeric(projected['daily_sentiment_score'], errors='coerce')
    projected['news_count'] = pd.to_numeric(projected['news_count'], errors='coerce')
    projected['negative_ratio'] = pd.to_numeric(projected['negative_ratio'], errors='coerce')
    projected['daily_sentiment_score'] = projected['daily_sentiment_score'].interpolate(method='linear', limit_area='inside').fillna(0.0)
    projected['news_count'] = projected['news_count'].interpolate(method='nearest', limit_area='inside').fillna(0.0)
    projected['negative_ratio'] = projected['negative_ratio'].interpolate(method='nearest', limit_area='inside').fillna(0.0)
    projected = projected.loc[daily_index]
    projected.index.name = 'trading_date_anchor'
    return projected.reset_index()


def build_linkage_payload(ticker: str, start_date: str, end_date: str) -> LinkagePayload:
    prices = load_prices()
    features = load_optional_table('daily_sentiment_features', date_columns=['trading_date_anchor'])
    alerts = load_optional_table('risk_alerts', date_columns=['trade_date'])
    submission_quotes = _load_submission_quotes()

    price_view = prices[prices['ticker'] == ticker].copy().sort_values('trade_date')
    feature_view = (
        features[features['ticker'] == ticker].copy().sort_values('trading_date_anchor')
        if not features.empty
        else pd.DataFrame()
    )
    projected_prices = _project_price_series(price_view, start_date, end_date)
    submission_quote = (
        submission_quotes[submission_quotes['ticker'] == ticker].head(1)
        if not submission_quotes.empty
        else pd.DataFrame()
    )
    latest_local_trade_date = (
        pd.to_datetime(price_view['trade_date'], errors='coerce').max()
        if not price_view.empty and 'trade_date' in price_view.columns
        else pd.NaT
    )
    if should_use_submission_quote(submission_quote, latest_local_trade_date, end_date):
        projected_prices = apply_submission_quote_to_price_frame(projected_prices, submission_quote, end_date)
    daily_index = pd.to_datetime(projected_prices['trade_date']) if not projected_prices.empty else pd.date_range(start_date, end_date, freq='D')
    projected_features = _project_feature_series(feature_view, pd.DatetimeIndex(daily_index), start_date, end_date)
    merged = projected_features.merge(projected_prices[['trade_date', 'close']], left_on='trading_date_anchor', right_on='trade_date', how='left')
    merged['close'] = pd.to_numeric(merged['close'], errors='coerce').interpolate(method='linear').ffill().bfill().fillna(0.0)

    avg_sentiment = float(merged['daily_sentiment_score'].tail(10).mean()) if not merged.empty else 0.0
    neg_ratio = float(merged['negative_ratio'].tail(10).mean()) if not merged.empty else 0.0
    risk_status = '高' if neg_ratio >= 0.6 else '中' if neg_ratio >= 0.45 else '低'

    price_series = [
        SeriesPoint(date=pd.to_datetime(row.trade_date).strftime('%Y-%m-%d'), value=_as_finite_number(row.close))
        for row in projected_prices.itertuples()
    ]
    sentiment_series = [
        SeriesPoint(date=pd.to_datetime(row.trading_date_anchor).strftime('%Y-%m-%d'), value=_as_finite_number(row.daily_sentiment_score))
        for row in merged.itertuples()
    ] if not merged.empty else []
    volume_series = [
        SeriesPoint(date=pd.to_datetime(row.trading_date_anchor).strftime('%Y-%m-%d'), value=_as_finite_number(row.news_count))
        for row in merged.itertuples()
    ] if not merged.empty else []

    alert_points = []
    ticker_alerts = alerts[alerts['ticker'] == ticker].copy() if not alerts.empty else pd.DataFrame()
    if not ticker_alerts.empty:
        alert_context = build_projection_context(start_date, end_date, ticker_alerts['trade_date'])
        ticker_alerts = clamp_projected_frame(ticker_alerts, 'trade_date', alert_context)
    if ticker_alerts.empty and not merged.empty:
        ticker_alerts = pd.DataFrame([{'trade_date': pd.to_datetime(end_date)}])

    for row in ticker_alerts.head(3).itertuples():
        current = merged[merged['trading_date_anchor'] == pd.to_datetime(row.trade_date)] if not merged.empty else pd.DataFrame()
        if current.empty and not merged.empty:
            current = merged.tail(1)
        if current.empty:
            continue
        first = current.iloc[0]
        alert_points.append(
            AlertSpike(
                date=pd.to_datetime(row.trade_date).strftime('%Y-%m-%d'),
                price=_as_finite_number(first['close']),
                sentiment=_as_finite_number(first['daily_sentiment_score']),
                news_volume=int(_as_finite_number(first['news_count'])),
                label='预警触发',
            )
        )

    last_anchor = pd.to_datetime(end_date).strftime('%Y-%m-%d') if not merged.empty else end_date
    return LinkagePayload(
        summary=LinkageSummary(
            ticker=ticker,
            sector=INSTRUMENT_SECTOR_MAP.get(ticker, SECTOR_MAP.get(ticker, '科技')),
            avg_sentiment=avg_sentiment,
            risk_status=risk_status,
        ),
        series=LinkageSeriesGroup(price=price_series, sentiment=sentiment_series, news_volume=volume_series),
        alert_spikes=alert_points,
        anchor=AnchorPayload(anchor_date=last_anchor, note='计算相对于指定交易日收盘时点'),
    )
