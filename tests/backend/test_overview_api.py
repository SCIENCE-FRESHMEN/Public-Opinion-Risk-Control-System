import pandas as pd

from backend.services.overview_service import build_overview_payload


def test_overview_payload_uses_a_share_price_data() -> None:
    payload = build_overview_payload("600519.SH", "2026-04-01", "2026-04-21")

    assert payload.header.ticker == "600519.SH"
    assert payload.kpis.price.value != 0
    assert payload.price_context


def test_overview_payload_kpis_follow_requested_date_window() -> None:
    earlier = build_overview_payload("300750.SZ", "2026-04-01", "2026-04-15")
    later = build_overview_payload("300750.SZ", "2026-04-01", "2026-04-22")

    assert earlier.kpis.sentiment.value != later.kpis.sentiment.value
    assert later.kpis.sentiment.value > earlier.kpis.sentiment.value
    assert later.kpis.news_heat.value >= earlier.kpis.news_heat.value
    assert earlier.header.as_of == "2026-04-15T15:00:00"
    assert later.header.as_of == "2026-04-22T15:00:00"


def test_overview_payload_alerts_stay_inside_requested_window() -> None:
    payload = build_overview_payload("600519.SH", "2026-04-01", "2026-04-21")

    assert payload.alerts
    assert all("2026-04-21" >= row.trade_date >= "2026-04-01" for row in payload.alerts)
    assert all(row.trade_date != "2026-04-24" for row in payload.alerts)


def test_overview_payload_prefers_submission_quote_when_available(monkeypatch) -> None:
    from backend.services import overview_service

    monkeypatch.setattr(
        overview_service,
        "load_prices",
        lambda: pd.DataFrame(
            [
                {"ticker": "600519.SH", "trade_date": pd.Timestamp("2026-04-20"), "close": 1290.0},
                {"ticker": "600519.SH", "trade_date": pd.Timestamp("2026-04-21"), "close": 1295.0},
            ]
        ),
    )
    monkeypatch.setattr(
        overview_service,
        "load_optional_table",
        lambda name, date_columns=None: pd.DataFrame(),
    )
    monkeypatch.setattr(
        overview_service,
        "_load_submission_quotes",
        lambda: pd.DataFrame(
            [
                {
                    "ticker": "600519.SH",
                    "current_price": 1308.45,
                    "change_percent": -0.09,
                    "quote_time": "20260602143718",
                }
            ]
        ),
    )

    payload = build_overview_payload("600519.SH", "2026-04-01", "2026-04-21")

    assert payload.kpis.price.value == 1308.45
    assert payload.kpis.price.delta == -0.0009
    assert payload.header.as_of == "2026-06-02 14:37:18"
    assert payload.price_context[-1].value == 1308.45


def test_overview_payload_uses_nearest_future_boundary_feature_for_window_end_kpi(monkeypatch) -> None:
    from backend.services import overview_service

    monkeypatch.setattr(
        overview_service,
        "load_prices",
        lambda: pd.DataFrame(
            [
                {"ticker": "300750.SZ", "trade_date": pd.Timestamp("2026-04-16"), "close": 220.8},
                {"ticker": "300750.SZ", "trade_date": pd.Timestamp("2026-04-17"), "close": 224.2},
                {"ticker": "300750.SZ", "trade_date": pd.Timestamp("2026-04-22"), "close": 234.4},
            ]
        ),
    )

    def fake_optional_table(name, date_columns=None):
        if name == "daily_sentiment_features":
            return pd.DataFrame(
                [
                    {
                        "ticker": "300750.SZ",
                        "trading_date_anchor": pd.Timestamp("2026-04-16"),
                        "daily_sentiment_score": -0.02,
                        "news_count": 1,
                        "negative_ratio": 0.0,
                    },
                    {
                        "ticker": "300750.SZ",
                        "trading_date_anchor": pd.Timestamp("2026-04-23"),
                        "daily_sentiment_score": 0.16,
                        "news_count": 1,
                        "negative_ratio": 0.0,
                    },
                ]
            )
        if name == "risk_alerts":
            return pd.DataFrame(columns=["ticker", "trade_date"])
        return pd.DataFrame()

    monkeypatch.setattr(overview_service, "load_optional_table", fake_optional_table)
    monkeypatch.setattr(overview_service, "_load_submission_quotes", lambda: pd.DataFrame())

    payload = build_overview_payload("300750.SZ", "2026-04-01", "2026-04-22")

    assert payload.kpis.sentiment.value > 0
    assert payload.kpis.news_heat.value == 1


def test_overview_endpoint_rejects_inactive_ticker(api_client) -> None:
    response = api_client.get(
        "/api/overview",
        params={"ticker": "601989.SH", "start_date": "2020-01-01", "end_date": "2026-04-27"},
    )

    assert response.status_code == 404
