import pandas as pd

from backend.services.news_service import build_news_dates_payload, build_news_drilldown_payload
from src.features.sentiment_features import build_daily_sentiment_features


def test_news_dates_payload_returns_anchor_dates_for_a_share_ticker() -> None:
    payload = build_news_dates_payload("600519.SH")

    assert payload.dates == ["2026-04-28", "2026-04-27", "2026-04-24", "2026-04-23", "2026-04-22", "2026-04-17"]


def test_news_dates_payload_prefers_submission_batch_when_requested_window_covers_delivery_range() -> None:
    payload = build_news_dates_payload("600519.SH", start_date="2020-01-01", end_date="2026-06-04")

    assert payload.dates[0] == "2026-06-02"
    assert "2026-04-28" not in payload.dates


def test_news_dates_payload_uses_real_trading_date_anchor_instead_of_end_date_projection() -> None:
    payload = build_news_dates_payload("600519.SH", end_date="2026-04-23")

    assert payload.dates[0] == "2026-04-23"
    assert "2026-04-25" not in payload.dates


def test_news_dates_payload_filters_anchor_dates_by_requested_range() -> None:
    payload = build_news_dates_payload("600519.SH", start_date="2026-04-18", end_date="2026-04-23")

    assert payload.dates == ["2026-04-23", "2026-04-22"]


def test_news_dates_payload_returns_empty_when_requested_range_has_no_anchor_dates() -> None:
    payload = build_news_dates_payload("600519.SH", start_date="2026-04-01", end_date="2026-04-07")

    assert payload.dates == []


def test_news_drilldown_payload_supports_manual_date_without_alert_anchor() -> None:
    payload = build_news_drilldown_payload("300750.SZ", "2026-05-09", start_date="2026-04-01", end_date="2026-05-09")

    assert payload.header.alert_date == "2026-05-09"
    assert payload.anchor.anchor_date == "2026-05-09"
    assert payload.anchor.in_range is True
    assert "当天无预警锚点" in payload.anchor.note


def test_news_drilldown_payload_returns_items_for_real_anchor_date() -> None:
    payload = build_news_drilldown_payload("600519.SH", "2026-04-24")

    assert payload.header.ticker == "600519.SH"
    assert payload.header.alert_date == "2026-04-24"
    assert payload.news_items
    assert payload.anchor.anchor_date == "2026-04-24"
    assert payload.news_items[0].publish_time.endswith("北京时间")
    assert "贵州茅台" in payload.news_items[0].summary


def test_news_drilldown_payload_prefers_submission_items_when_requested_window_covers_delivery_range() -> None:
    payload = build_news_drilldown_payload(
        "600519.SH",
        "2026-06-02",
        start_date="2020-01-01",
        end_date="2026-06-04",
    )

    assert payload.news_items
    assert all(item.source != "sample_feed" for item in payload.news_items)
    assert any(item.source in {"巨潮公告", "上交所公告", "新浪财经", "东方财富股吧"} for item in payload.news_items)
    assert payload.news_items[0].source in {"巨潮公告", "上交所公告", "新浪财经"}
    assert payload.news_items[0].title.strip() != ""


def test_news_drilldown_payload_filters_noisy_driver_terms_for_submission_window() -> None:
    maotai = build_news_drilldown_payload("600519.SH", "2026-06-02", start_date="2020-01-01", end_date="2026-06-04")
    catl = build_news_drilldown_payload("300750.SZ", "2026-06-02", start_date="2020-01-01", end_date="2026-06-04")
    byd = build_news_drilldown_payload("002594.SZ", "2026-06-02", start_date="2020-01-01", end_date="2026-06-04")

    maotai_terms = [item.term for item in maotai.drivers]
    catl_terms = [item.term for item in catl.drivers]
    byd_terms = [item.term for item in byd.drivers]

    assert "加油" not in maotai_terms
    assert "文件下载" not in catl_terms
    assert all("年宁德时代公" != term for term in catl_terms)
    assert "法定" not in byd_terms
    assert "限公司" not in byd_terms
    assert "說明" not in byd_terms
    assert "此前茅台多次" not in maotai_terms
    assert "将追究黔茅策" not in maotai_terms
    assert "划公司相关法" not in maotai_terms


def test_news_drilldown_payload_filters_by_anchor_date_not_publish_projection() -> None:
    payload = build_news_drilldown_payload("600519.SH", "2026-04-17")

    assert payload.news_items
    assert len(payload.news_items) >= 1
    assert payload.news_items[0].title.startswith("贵州茅台")
    assert payload.anchor.anchor_date == "2026-04-17"


def test_news_drilldown_payload_keeps_a_share_content_localized() -> None:
    payload = build_news_drilldown_payload("300750.SZ", "2026-04-23")

    assert payload.news_items
    assert "宁德时代" in payload.news_items[0].title
    assert all("A股" not in item.term and "a股" not in item.term for item in payload.drivers)
    assert all(".sz" not in item.term.lower() and ".sh" not in item.term.lower() for item in payload.drivers)
    assert all(".sz" not in item.title.lower() and ".sh" not in item.title.lower() for item in payload.news_items)
    assert all(".sz" not in item.summary.lower() and ".sh" not in item.summary.lower() for item in payload.news_items)
    assert all("（宁德时代）" not in item.summary for item in payload.news_items)
    assert all("(宁德时代)" not in item.summary for item in payload.news_items)


def test_news_drilldown_payload_removes_other_market_security_codes_from_body() -> None:
    payload = build_news_drilldown_payload("600519.SH", "2026-04-24", start_date="2026-04-01", end_date="2026-04-24")

    assert payload.news_items
    combined = " ".join(f"{item.title} {item.summary}" for item in payload.news_items).lower()
    assert "00700.hk" not in combined
    assert "09988.hk" not in combined
    assert "002384.sz" not in combined
    assert "(300502)" not in combined


def test_news_drilldown_payload_cleans_residual_a_share_formatting_noise() -> None:
    payload = build_news_drilldown_payload("002594.SZ", "2026-04-28", start_date="2026-04-01", end_date="2026-04-29")

    assert payload.news_items
    combined = " ".join(f"{item.title} {item.summary}" for item in payload.news_items)
    assert "（比亚迪/）" not in combined
    assert "比亚迪/" not in combined
    assert "代码 简称" not in combined
    assert "001219 青岛食品" not in combined
    assert "4540.00 16979.60" not in combined


def test_news_drilldown_payload_uses_new_range_summary_copy() -> None:
    payload = build_news_drilldown_payload(
        "300750.SZ",
        "2026-04-23",
        start_date="2026-04-01",
        end_date="2026-04-22",
    )

    assert payload.header.summary == "当前展示的是全局范围 2026-04-01 至 2026-04-22 内，锚定到 2026-04-23 的新闻热度拆解"
    assert "全局筛选日期范围" in payload.anchor.note


def test_news_drilldown_payload_anchor_note_mentions_out_of_range_behavior() -> None:
    payload = build_news_drilldown_payload(
        "300750.SZ",
        "2026-04-23",
        start_date="2026-04-01",
        end_date="2026-04-22",
    )

    assert "若结束日期自动更新到今日" in payload.anchor.note


def test_daily_sentiment_features_preserves_existing_trading_date_anchor() -> None:
    news_sentiment = pd.DataFrame(
        {
            "news_id": ["n1", "n2"],
            "ticker": ["600519.SH", "600519.SH"],
            "publish_timestamp": ["2026-04-18 11:15:00", "2026-04-10 09:10:00"],
            "trading_date_anchor": [pd.Timestamp("2026-04-21"), pd.Timestamp("2026-04-10")],
            "title": ["机构关注A股核心资产轮动", "贵州茅台一季报预期走弱"],
            "sentiment_label": ["neutral", "negative"],
            "sentiment_score": [0.060854, -1.0],
        }
    )

    features = build_daily_sentiment_features(news_sentiment)

    assert features["trading_date_anchor"].astype(str).tolist() == ["2026-04-10", "2026-04-21"]


def test_news_drilldown_endpoint_returns_stats(api_client) -> None:
    response = api_client.get("/api/news/drilldown", params={"ticker": "600519.SH", "alert_date": "2026-04-24"})

    assert response.status_code == 200
    body = response.json()
    assert "stats" in body
    assert body["anchor"]["anchor_date"] == "2026-04-24"


def test_news_dates_endpoint_filters_by_global_date_window(api_client) -> None:
    response = api_client.get(
        "/api/news/dates",
        params={"ticker": "600519.SH", "start_date": "2026-04-18", "end_date": "2026-04-23"},
    )

    assert response.status_code == 200
    assert response.json()["dates"] == ["2026-04-23", "2026-04-22"]


def test_news_endpoints_reject_inactive_ticker(api_client) -> None:
    dates_response = api_client.get(
        "/api/news/dates",
        params={"ticker": "601989.SH", "start_date": "2020-01-01", "end_date": "2026-04-27"},
    )
    drilldown_response = api_client.get(
        "/api/news/drilldown",
        params={"ticker": "601989.SH", "alert_date": "2026-04-27", "start_date": "2020-01-01", "end_date": "2026-04-27"},
    )

    assert dates_response.status_code == 404
    assert drilldown_response.status_code == 404
