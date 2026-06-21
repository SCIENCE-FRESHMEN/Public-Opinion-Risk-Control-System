from datetime import date

from fastapi.testclient import TestClient

from backend.app import create_app
from backend.services.meta_service import (
    _normalize_submission_ticker,
    build_filters_payload,
    build_status_payload,
)

EXPECTED_RELIABLE_TICKERS = [
    "600519.SH",
    "000858.SZ",
    "600887.SH",
    "000568.SZ",
    "002714.SZ",
    "300498.SZ",
    "002304.SZ",
    "600809.SH",
    "000596.SZ",
    "600276.SH",
    "300760.SZ",
    "600436.SH",
    "000538.SZ",
    "603259.SH",
    "300122.SZ",
    "300750.SZ",
    "002594.SZ",
    "601012.SH",
    "300274.SZ",
    "688223.SH",
    "600438.SH",
    "603501.SH",
    "002371.SZ",
    "300223.SZ",
    "688008.SH",
    "688981.SH",
    "600584.SH",
    "688111.SH",
    "002230.SZ",
    "600570.SH",
    "300033.SZ",
    "600588.SH",
    "300454.SZ",
    "002027.SZ",
    "002475.SZ",
    "000063.SZ",
    "300308.SZ",
    "300782.SZ",
    "002241.SZ",
    "002938.SZ",
    "002415.SZ",
    "002050.SZ",
    "600050.SH",
    "600036.SH",
    "601318.SH",
    "600030.SH",
    "601688.SH",
    "601166.SH",
    "601398.SH",
    "600999.SH",
    "601601.SH",
    "601211.SH",
    "601899.SH",
    "601088.SH",
    "600028.SH",
    "600938.SH",
    "600111.SH",
    "000807.SZ",
    "600309.SH",
    "601225.SH",
    "601668.SH",
    "600900.SH",
    "600089.SH",
    "601390.SH",
    "600941.SH",
    "001979.SZ",
    "600031.SH",
    "300124.SZ",
    "601877.SH",
    "600760.SH",
    "600893.SH",
    "601111.SH",
    "601021.SH",
    "000768.SZ",
    "601766.SH",
]

EXPECTED_MEMBER_B_TICKERS = [
    "000539.SZ",
    "000690.SZ",
    "000791.SZ",
    "000875.SZ",
]


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(create_app())

    response = client.get("/api/meta/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_filters_payload_uses_config_defaults() -> None:
    payload = build_filters_payload()
    expected_end = max("2026-04-21", date.today().isoformat())

    assert payload.defaults.ticker == "600519.SH"
    assert payload.date_range.start == "2020-01-01"
    assert payload.date_range.end == expected_end
    assert payload.defaults.end_date == expected_end
    assert payload.tickers == EXPECTED_RELIABLE_TICKERS + EXPECTED_MEMBER_B_TICKERS


def test_filters_payload_exposes_a_share_groups_and_default_symbol() -> None:
    payload = build_filters_payload()

    assert payload.defaults.ticker.endswith((".SH", ".SZ"))
    assert payload.instrument_groups
    assert [group.group_name for group in payload.instrument_groups] == [
        "消费",
        "医药",
        "新能源",
        "半导体",
        "人工智能 / 计算机",
        "通信 / 电子制造",
        "金融",
        "周期 / 资源",
        "基建 / 地产 / 央国企",
        "交通 / 军工 / 综合热点",
    ]
    assert [group.instruments[0].name for group in payload.instrument_groups] == [
        "贵州茅台",
        "恒瑞医药",
        "宁德时代",
        "韦尔股份",
        "金山办公",
        "立讯精密",
        "招商银行",
        "紫金矿业",
        "中国建筑",
        "中航沈飞",
    ]


def test_status_payload_reports_expected_artifacts() -> None:
    payload = build_status_payload()

    names = {item.name for item in payload.artifacts}
    assert "prices.parquet" in names
    assert "news_sentiment.parquet" in names


def test_filters_endpoint_returns_defaults(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/filters")

    assert response.status_code == 200
    assert response.json()["defaults"]["ticker"] == "600519.SH"


def test_filters_endpoint_returns_grouped_a_share_metadata(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/filters")

    assert response.status_code == 200
    payload = response.json()
    assert [group["group_name"] for group in payload["instrument_groups"]] == [
        "消费",
        "医药",
        "新能源",
        "半导体",
        "人工智能 / 计算机",
        "通信 / 电子制造",
        "金融",
        "周期 / 资源",
        "基建 / 地产 / 央国企",
        "交通 / 军工 / 综合热点",
    ]
    assert payload["defaults"]["ticker"] == "600519.SH"
    assert payload["tickers"] == EXPECTED_RELIABLE_TICKERS + EXPECTED_MEMBER_B_TICKERS


def test_status_endpoint_returns_artifact_list(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/status")

    assert response.status_code == 200
    assert isinstance(response.json()["artifacts"], list)


def test_project_evidence_endpoint_returns_real_summary(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/project-evidence")

    assert response.status_code == 200
    payload = response.json()
    assert set(payload.keys()) == {"dataset", "model", "featured_prediction"}
    assert payload["dataset"]["total_records"] > 0
    assert payload["dataset"]["unique_stocks"] >= 1
    assert payload["model"]["trigger_count"] >= 0
    assert payload["featured_prediction"]["direction"] in {"上涨", "下跌"}


def test_acquisition_summary_endpoint_returns_real_collection_metrics(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/acquisition-summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["stock_pool_count"] == 1000
    assert payload["selection_mode"] == "guba_hot"
    assert payload["window_start"] == "2026-05-03"
    assert payload["window_end"] == "2026-06-02"
    assert payload["external_site_url"].startswith("https://")
    assert len(payload["coverage_items"]) >= 6


def test_submission_heat_top_endpoint_returns_top10_rows(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/submission-heat-top")

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload["rows"], list)
    assert len(payload["rows"]) == 10
    first = payload["rows"][0]
    assert set(first.keys()) == {
        "rank",
        "ticker",
        "stock_name",
        "heat_score",
        "sentiment_score",
        "risk_level",
        "change_pct",
    }
    assert first["rank"] == 1
    assert first["ticker"].endswith((".SH", ".SZ"))
    assert len(first["ticker"].split(".")[0]) == 6
    assert isinstance(first["heat_score"], int)


def test_submission_ticker_normalization_keeps_six_digit_codes() -> None:
    assert _normalize_submission_ticker("89") == "000089.SZ"
    assert _normalize_submission_ticker("2594") == "002594.SZ"
    assert _normalize_submission_ticker("600519") == "600519.SH"


def test_submission_risk_events_endpoint_returns_ranked_event_rows(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/submission-risk-events")

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload["events"], list)
    assert len(payload["events"]) == 8
    first = payload["events"][0]
    assert set(first.keys()) == {
        "time",
        "ticker",
        "stock_name",
        "title",
        "severity",
        "source",
    }
    assert first["ticker"].endswith((".SH", ".SZ"))
    assert first["severity"] in {"高", "中", "低"}
    assert first["source"] in {"新浪财经", "巨潮公告", "上交所公告"}


def test_submission_stock_risk_timeline_endpoint_returns_single_stock_events(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/submission-stock-risk-timeline", params={"ticker": "000089.SZ"})

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload["events"], list)
    assert len(payload["events"]) >= 1
    first = payload["events"][0]
    assert set(first.keys()) == {
        "time",
        "event_type",
        "title",
        "description",
        "severity",
    }
    assert first["severity"] in {"高", "中", "低"}


def test_submission_stock_posts_endpoint_returns_multi_source_posts(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/submission-stock-posts", params={"ticker": "000089.SZ"})

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload["posts"], list)
    assert len(payload["posts"]) >= 1
    first = payload["posts"][0]
    assert set(first.keys()) == {
        "id",
        "source",
        "publish_time",
        "sentiment",
        "summary",
    }
    assert first["source"] in {"东方财富股吧", "新浪财经", "巨潮公告", "上交所公告"}
    assert first["sentiment"] in {"正面", "中性", "负面"}


def test_submission_stock_coverage_endpoint_returns_source_summary(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/submission-stock-coverage", params={"ticker": "000089.SZ"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["ticker"] == "000089.SZ"
    assert payload["stock_name"] == "深圳机场"
    assert payload["active_source_count"] >= 1
    assert payload["quote_status"] == "OK"
    assert isinstance(payload["source_items"], list)
    assert len(payload["source_items"]) >= 1
    first = payload["source_items"][0]
    assert set(first.keys()) == {"source", "record_count", "status"}


def test_member_b_analysis_endpoint_returns_algorithm_outputs(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/member-b-analysis", params={"ticker": "600900.SH"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["matched"] is True
    assert payload["stock_name"] == "长江电力"
    assert payload["total_opinions"] > 0
    assert payload["risk_label"] in {"低风险", "中等风险", "高风险", "极高风险"}
    assert len(payload["top_topics"]) >= 1
    assert len(payload["risk_timeline"]) >= 1
    assert len(payload["covered_stocks"]) >= 5


def test_member_b_analysis_endpoint_returns_coverage_when_current_stock_unmatched(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/member-b-analysis", params={"ticker": "600519.SH"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["matched"] is False
    assert payload["stock_name"] == "当前标的暂无算法分析结果"
    assert len(payload["covered_stocks"]) >= 5


def test_llm_brief_endpoint_fuses_a_b_c_outputs(api_client: TestClient) -> None:
    response = api_client.get("/api/meta/llm-brief", params={"ticker": "600900.SH"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["ticker"] == "600900.SH"
    assert payload["stock_name"] == "长江电力"
    assert payload["generation_mode"] in {"local_template_a_b_fusion", "remote_llm_a_b_fusion"}
    assert "A: stock_source_overview/source_coverage" in payload["data_sources"]
    assert "B: sentiment/topic/risk" in payload["data_sources"]
    assert "C: briefing_template" in payload["data_sources"]
    assert payload["brief"]["headline"] == "长江电力舆情风险研判简报"
    assert "电力" in payload["brief"]["summary"]


def test_cors_preflight_allows_frontend_origin(api_client: TestClient) -> None:
    response = api_client.options(
        "/api/meta/filters",
        headers={
            "Origin": "http://127.0.0.1:5174",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5174"
