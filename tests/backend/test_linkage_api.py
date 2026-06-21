import math
import pandas as pd

from backend.services.linkage_service import build_linkage_payload


def test_build_linkage_payload_contains_series() -> None:
    payload = build_linkage_payload("NVDA", "2020-01-01", "2025-12-31")

    assert payload.summary.ticker == "NVDA"
    assert payload.series.price is not None
    assert payload.anchor.note


def test_linkage_endpoint_returns_alert_spikes(api_client) -> None:
    response = api_client.get(
        "/api/linkage",
        params={"ticker": "600519.SH", "start_date": "2026-04-01", "end_date": "2026-04-24"},
    )

    assert response.status_code == 200
    assert "alert_spikes" in response.json()


def test_build_linkage_payload_projects_dates_and_keeps_non_aapl_series_complete() -> None:
    payload = build_linkage_payload("NVDA", "2026-04-01", "2026-04-20")

    assert payload.summary.ticker == "NVDA"
    assert payload.series.price[-1].date == "2026-04-20"
    assert payload.series.sentiment
    assert payload.series.news_volume


def test_linkage_endpoint_returns_valid_json_for_a_share_tickers(api_client) -> None:
    for ticker in ["600519.SH", "300750.SZ", "002594.SZ"]:
        response = api_client.get(
            "/api/linkage",
            params={"ticker": ticker, "start_date": "2026-04-01", "end_date": "2026-04-21"},
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["summary"]["ticker"] == ticker
        assert all(math.isfinite(point["value"]) for point in payload["series"]["price"])
        assert all(math.isfinite(point["value"]) for point in payload["series"]["sentiment"])
        assert all(math.isfinite(point["value"]) for point in payload["series"]["news_volume"])
        assert any(point["value"] != 0 for point in payload["series"]["price"])


def test_build_linkage_payload_uses_new_energy_sector_for_byd() -> None:
    payload = build_linkage_payload("002594.SZ", "2026-04-01", "2026-04-24")

    assert payload.summary.ticker == "002594.SZ"
    assert payload.summary.sector == "新能源"


def test_build_linkage_payload_uses_instrument_master_sector_for_yili() -> None:
    payload = build_linkage_payload("600887.SH", "2026-04-01", "2026-04-24")

    assert payload.summary.ticker == "600887.SH"
    assert payload.summary.sector == "消费"


def test_linkage_endpoint_rejects_inactive_ticker(api_client) -> None:
    response = api_client.get(
        "/api/linkage",
        params={"ticker": "601989.SH", "start_date": "2020-01-01", "end_date": "2026-04-27"},
    )

    assert response.status_code == 404


def test_build_linkage_payload_does_not_backfill_sparse_feature_rows_across_the_full_window(monkeypatch) -> None:
    from backend.services import linkage_service

    monkeypatch.setattr(
        linkage_service,
        "load_prices",
        lambda: pd.DataFrame(
            [
                {"ticker": "600519.SH", "trade_date": pd.Timestamp("2026-04-23"), "close": 1298.0},
                {"ticker": "600519.SH", "trade_date": pd.Timestamp("2026-04-24"), "close": 1300.0},
            ]
        ),
    )

    def fake_optional_table(name, date_columns=None):
        if name == "daily_sentiment_features":
            return pd.DataFrame(
                [
                    {
                        "ticker": "600519.SH",
                        "trading_date_anchor": pd.Timestamp("2026-04-24"),
                        "daily_sentiment_score": 0.18,
                        "news_count": 1,
                        "negative_ratio": 0.0,
                    }
                ]
            )
        if name == "risk_alerts":
            return pd.DataFrame(columns=["ticker", "trade_date"])
        return pd.DataFrame()

    monkeypatch.setattr(linkage_service, "load_optional_table", fake_optional_table)

    payload = build_linkage_payload("600519.SH", "2026-05-01", "2026-05-04")

    assert [point.value for point in payload.series.news_volume] == [0.0, 0.0, 0.0, 1.0]
    assert [point.value for point in payload.series.sentiment] == [0.0, 0.0, 0.0, 0.18]


def test_build_linkage_payload_aligns_last_price_point_with_submission_quote(monkeypatch) -> None:
    from backend.services import linkage_service

    monkeypatch.setattr(
        linkage_service,
        "load_prices",
        lambda: pd.DataFrame(
            [
                {"ticker": "600519.SH", "trade_date": pd.Timestamp("2026-04-23"), "close": 1298.0},
                {"ticker": "600519.SH", "trade_date": pd.Timestamp("2026-04-24"), "close": 1300.0},
            ]
        ),
    )

    def fake_optional_table(name, date_columns=None):
        if name == "daily_sentiment_features":
            return pd.DataFrame(
                [
                    {
                        "ticker": "600519.SH",
                        "trading_date_anchor": pd.Timestamp("2026-04-24"),
                        "daily_sentiment_score": 0.18,
                        "news_count": 1,
                        "negative_ratio": 0.0,
                    }
                ]
            )
        if name == "risk_alerts":
            return pd.DataFrame(columns=["ticker", "trade_date"])
        return pd.DataFrame()

    monkeypatch.setattr(linkage_service, "load_optional_table", fake_optional_table)
    monkeypatch.setattr(
        linkage_service,
        "_load_submission_quotes",
        lambda: pd.DataFrame(
            [
                {
                    "ticker": "600519.SH",
                    "current_price": 1308.45,
                    "change_percent": -0.09,
                    "quote_time": pd.Timestamp("2026-06-02 14:37:18"),
                }
            ]
        ),
    )

    payload = build_linkage_payload("600519.SH", "2026-05-01", "2026-05-04")

    assert payload.series.price[-1].value == 1308.45


def test_build_linkage_payload_uses_nearest_future_boundary_point_to_avoid_flat_feature_lines(monkeypatch) -> None:
    from backend.services import linkage_service

    monkeypatch.setattr(
        linkage_service,
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

    monkeypatch.setattr(linkage_service, "load_optional_table", fake_optional_table)
    monkeypatch.setattr(linkage_service, "_load_submission_quotes", lambda: pd.DataFrame())

    payload = build_linkage_payload("300750.SZ", "2026-04-01", "2026-04-22")

    sentiment_tail = [point.value for point in payload.series.sentiment if point.date >= "2026-04-17"]

    assert any(value > 0 for value in sentiment_tail)
    assert sentiment_tail[-1] > 0
