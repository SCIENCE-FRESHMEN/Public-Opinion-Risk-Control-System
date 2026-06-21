from backend.services.backtest_service import build_backtest_payload


def test_backtest_payload_contains_summary() -> None:
    payload = build_backtest_payload("全部", 5)

    assert payload.summary.historical_triggers >= 0
    assert payload.trajectory is not None


def test_backtest_endpoint_returns_distribution(api_client) -> None:
    response = api_client.get("/api/backtest", params={"alert_type": "全部", "horizon": 5})

    assert response.status_code == 200
    assert "distribution" in response.json()


def test_backtest_payload_maps_ui_alert_label_to_dataset_alert_type() -> None:
    payload = build_backtest_payload("新闻热度激增", 5)

    assert payload.summary.historical_triggers > 0
    assert payload.trajectory
    assert payload.events


def test_backtest_payload_projects_event_dates_to_current_demo_window() -> None:
    payload = build_backtest_payload("新闻热度激增", 5)

    assert payload.events
    assert payload.events[0].trade_date.startswith("2026-04")


def test_backtest_payload_uses_ticker_specific_trajectory() -> None:
    yili_payload = build_backtest_payload("新闻热度激增", 5, ticker="600887.SH", start_date="2026-04-01", end_date="2026-04-24")
    catl_payload = build_backtest_payload("新闻热度激增", 5, ticker="300750.SZ", start_date="2026-04-01", end_date="2026-04-24")

    assert yili_payload.trajectory
    assert catl_payload.trajectory
    assert [(point.horizon, point.avg_return) for point in yili_payload.trajectory] != [
        (point.horizon, point.avg_return) for point in catl_payload.trajectory
    ]


def test_backtest_payload_keeps_projected_events_within_demo_date_window() -> None:
    payload = build_backtest_payload("新闻热度激增", 5, ticker="600887.SH", start_date="2026-04-01", end_date="2026-04-24")

    assert payload.events
    assert payload.events[0].trade_date.startswith("2026-")


def test_backtest_payload_supports_a_share_ticker_specific_results() -> None:
    payload = build_backtest_payload("新闻热度激增", 5, ticker="600887.SH", start_date="2026-04-01", end_date="2026-04-24")

    assert payload.trajectory
    assert any(event.ticker == "600887.SH" for event in payload.events)


def test_backtest_payload_supports_news_heat_spike_alias() -> None:
    payload = build_backtest_payload("新闻热度激增", 5, ticker="300750.SZ", start_date="2026-04-01", end_date="2026-04-24")

    assert payload.summary.historical_triggers > 0
    assert payload.trajectory
    assert payload.events
    assert payload.active_alert_type == "新闻热度激增"


def test_backtest_payload_falls_back_to_ticker_available_alert_type() -> None:
    payload = build_backtest_payload("负面情绪激增", 5, ticker="600519.SH", start_date="2026-04-01", end_date="2026-04-24")

    assert payload.summary.historical_triggers > 0
    assert payload.active_alert_type == "新闻热度激增"
    assert payload.events


def test_backtest_endpoint_rejects_inactive_ticker(api_client) -> None:
    response = api_client.get(
        "/api/backtest",
        params={"ticker": "601989.SH", "alert_type": "全部", "horizon": 5, "start_date": "2020-01-01", "end_date": "2026-04-27"},
    )

    assert response.status_code == 404
