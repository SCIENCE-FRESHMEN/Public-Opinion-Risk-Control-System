from collections import Counter
from functools import lru_cache
import re

import pandas as pd

from app.components.data_access import load_news_sentiment
from backend.services.data_loader import ROOT
from backend.schemas.news import (
    DriverTag,
    NewsAnchor,
    NewsDatesPayload,
    NewsDrilldownPayload,
    NewsHeader,
    NewsItem,
    NewsStats,
)
from backend.services.date_projection import build_projection_context, project_timestamp
from backend.services.instrument_service import load_active_instruments
SUBMISSION_UNIFIED_EVENTS_PATH = ROOT / "submission_final" / "data_package" / "unified_text_events.csv"
SUBMISSION_RANGE_START = "2026-05-03"
SUBMISSION_RANGE_END = "2026-06-02"
SUBMISSION_NEWS_SOURCES = {"sina_news", "cninfo_announcement", "sse_announcement", "eastmoney_guba"}
SUBMISSION_SOURCE_PRIORITY = {
    "cninfo_announcement": 0,
    "sse_announcement": 1,
    "sina_news": 2,
    "eastmoney_guba": 3,
}
SUBMISSION_DRIVER_KEYWORDS = (
    "茅台保健酒业",
    "合作峰会",
    "打假",
    "招商",
    "搭售",
    "法律责任",
    "回应",
    "产销快报",
    "汽车视点",
    "价格战",
    "涨价潮",
    "车企竞争",
    "销量",
    "出海",
    "券商",
    "金股",
    "概念飙升",
    "电子板块",
    "热度第一",
    "钠离子电池",
    "量产",
    "新能源电池",
    "绿色科技创新债券",
    "捐资",
    "出口增长",
    "韩国公布数据",
)
CHINESE_DRIVER_STOPWORDS = {
    "公司",
    "有限公司",
    "股份有限公司",
    "公告",
    "摘要",
    "说明",
    "說明",
    "法定",
    "文件下载",
    "显示",
    "今日",
    "已经",
    "目前",
    "相关",
    "继续",
    "情况",
    "市场",
    "计划",
    "消息",
    "数据",
    "内容",
    "影响",
    "表示",
    "可以",
    "一个",
    "进行",
    "关于",
    "加油",
    "此前",
    "此前茅台多次",
    "继续关注",
    "第十九",
    "章上市的香港",
    "年宁德时代公",
    "司深度研究",
    "限公司",
    "将追究黔茅策",
    "划公司相关法",
}

TEXT_TRANSLATIONS = {
    "Apple launches new AI features": "苹果发布新一代人工智能功能",
    "Apple expands on-device AI strategy": "苹果进一步扩展端侧人工智能战略",
    "Tesla faces delivery pressure": "特斯拉面临交付压力",
    "Analysts discuss demand softness and pricing": "分析师讨论需求走弱与定价压力",
    "NVIDIA partners with cloud providers": "英伟达与云服务商达成合作",
    "GPU demand remains strong": "图形处理器需求维持强劲",
    "Tech stocks mixed after Fed comments": "美联储表态后科技股走势分化",
    "AAPL and NVDA volatile while TSLA rebounds": "苹果与英伟达波动加剧，特斯拉反弹",
}

TERM_TRANSLATIONS = {
    "apple": "苹果",
    "launches": "发布",
    "features": "功能",
    "expands": "扩展",
    "on-device": "端侧",
    "strategy": "战略",
    "device": "端侧",
    "tesla": "特斯拉",
    "faces": "面临",
    "delivery": "交付",
    "pressure": "压力",
    "analysts": "分析师",
    "discuss": "讨论",
    "demand": "需求",
    "softness": "走弱",
    "pricing": "定价",
    "nvidia": "英伟达",
    "partners": "合作",
    "cloud": "云服务",
    "providers": "服务商",
    "gpu": "图形处理器",
    "remains": "维持",
    "strong": "强劲",
    "tech": "科技",
    "stocks": "股票",
    "mixed": "分化",
    "after": "之后",
    "fed": "美联储",
    "comments": "表态",
    "volatile": "波动",
    "while": "同时",
    "rebounds": "反弹",
    "aapl": "苹果",
    "nvda": "英伟达",
    "tsla": "特斯拉",
}


def localize_text(value: str) -> str:
    translated = TEXT_TRANSLATIONS.get(value, value)
    return replace_instrument_tokens(translated)


def localize_term(value: str) -> str:
    normalized = value.lower().strip()
    localized = TERM_TRANSLATIONS.get(normalized, value)
    return replace_instrument_tokens(localized.replace("A股", "境内股票").replace("a股", "境内股票"))


@lru_cache(maxsize=1)
def _instrument_alias_map() -> tuple[tuple[re.Pattern[str], str], ...]:
    raw_pairs: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for instrument in load_active_instruments():
        replacements = {instrument.symbol, instrument.code}
        for raw in replacements:
            normalized = str(raw).strip()
            if not normalized:
                continue
            key = (normalized.upper(), instrument.name)
            if key in seen:
                continue
            seen.add(key)
            raw_pairs.append((normalized, instrument.name))

    raw_pairs.sort(key=lambda item: len(item[0]), reverse=True)
    pairs = [
        (re.compile(rf"(?<![A-Za-z0-9]){re.escape(token)}(?![A-Za-z0-9])", re.IGNORECASE), instrument_name)
        for token, instrument_name in raw_pairs
    ]
    return tuple(pairs)


def replace_instrument_tokens(value: str) -> str:
    result = value
    for pattern, instrument_name in _instrument_alias_map():
        result = pattern.sub(instrument_name, result)
        result = result.replace(f"{instrument_name}（{instrument_name}）", instrument_name)
        result = result.replace(f"{instrument_name}({instrument_name})", instrument_name)
        result = result.replace(f"{instrument_name}（{instrument_name}/）", instrument_name)
        result = result.replace(f"{instrument_name}({instrument_name}/)", instrument_name)
        result = result.replace(f"{instrument_name}/", instrument_name)
    # Remove remaining stock-code markers from other markets when no safe Chinese mapping exists.
    result = re.sub(r"[（(]\d{6}\.(?:SH|SZ|HK)[)）]", "", result, flags=re.IGNORECASE)
    result = re.sub(r"[（(]\d{5}\.(?:HK)[)）]", "", result, flags=re.IGNORECASE)
    result = re.sub(r"[（(]\d{6}[)）]", "", result)
    result = re.sub(r"\b\d{6}\.(?:SH|SZ|HK)\b", "", result, flags=re.IGNORECASE)
    result = re.sub(r"\b\d{5}\.(?:HK)\b", "", result, flags=re.IGNORECASE)
    result = re.sub(r"\b代码\s+简称\b", "", result, flags=re.IGNORECASE)
    result = re.sub(r"(?:\b\d+(?:\.\d+)?\b\s+){5,}", "", result)
    result = re.sub(r"\s{2,}", " ", result).strip()
    return result


def _should_keep_driver_token(token: str) -> bool:
    lowered = token.lower().strip()
    if len(lowered) < 4:
        return False
    if lowered in {"aapl", "nvda", "tsla"}:
        return False
    if ".sz" in lowered or ".sh" in lowered:
        return False
    if any(char.isdigit() for char in lowered) and any(suffix in lowered for suffix in {".sz", ".sh", "sz)", "sh)", "sz）", "sh）"}):
        return False
    return True


def _normalize_submission_stock_code(ticker: str) -> str:
    return str(ticker).split(".")[0].zfill(6)


def _normalize_submission_source(source: str) -> str:
    return {
        "sina_news": "新浪财经",
        "cninfo_announcement": "巨潮公告",
        "sse_announcement": "上交所公告",
        "eastmoney_guba": "东方财富股吧",
    }.get(source, source)


def _extract_submission_title(text: str, source: str) -> str:
    normalized = str(text).strip().replace("\n", " ")
    if not normalized:
        return "未命名舆情事件"

    if "｜摘要：" in normalized:
        normalized = normalized.split("｜摘要：", 1)[0].strip()

    normalized = replace_instrument_tokens(normalized)
    normalized = re.sub(r"\$[^$]{1,20}\((?:SZ|SH)\d{6}\)\$", "", normalized, flags=re.IGNORECASE).strip()
    normalized = re.sub(r"[\[\(（【].*?[\]\)）】]", "", normalized).strip()
    normalized = re.sub(r"\s{2,}", " ", normalized).strip(" -:：,，。；;")

    if source == "eastmoney_guba":
        if re.fullmatch(r"[\d.\-+% ]+", normalized):
            return "股吧讨论热度上升"
        if len(normalized) < 8:
            return "股吧讨论热度上升"

    return normalized[:48] if normalized else "未命名舆情事件"


def _load_submission_events() -> pd.DataFrame:
    if not SUBMISSION_UNIFIED_EVENTS_PATH.exists():
        return pd.DataFrame()
    df = pd.read_csv(
        SUBMISSION_UNIFIED_EVENTS_PATH,
        encoding="utf-8-sig",
        usecols=["id", "timestamp", "stock_code", "stock_name", "source", "event_type", "text_content"],
    )
    if df.empty:
        return df
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["stock_code"] = df["stock_code"].astype(str).str.zfill(6)
    df["text_content"] = df["text_content"].fillna("").astype(str).str.strip()
    return df[df["source"].isin(SUBMISSION_NEWS_SOURCES) & (df["text_content"] != "")]


def _should_use_submission_window(start_date: str | None, end_date: str | None, alert_date: str | None = None) -> bool:
    # Prefer the submission batch whenever the requested window overlaps the
    # May/June delivery range. This keeps historical April-only windows on the
    # legacy sample set, while allowing the default broad window used by the
    # formal frontend to surface the newer multi-source submission data.
    if start_date and end_date:
        return not (end_date < SUBMISSION_RANGE_START or start_date > SUBMISSION_RANGE_END)
    if start_date:
        return start_date <= SUBMISSION_RANGE_END
    if end_date:
        return end_date >= SUBMISSION_RANGE_START
    if alert_date:
        return SUBMISSION_RANGE_START <= alert_date <= SUBMISSION_RANGE_END
    return False


def _infer_submission_sentiment(text: str, source: str) -> tuple[str, float]:
    negative_words = ("风险", "罚单", "处罚", "隐患", "下跌", "承压", "减持", "问询", "跌停", "恶心", "被套")
    positive_words = ("利好", "增长", "推进", "支持", "涨停", "回升", "高增", "启用", "买入", "改革")
    if any(word in text for word in negative_words):
        return "负面", 0.78
    if any(word in text for word in positive_words):
        return "正面", 0.72
    if source in {"cninfo_announcement", "sse_announcement"}:
        return "中性", 0.66
    return "中性", 0.58


def _extract_submission_drivers(texts: list[str]) -> list[DriverTag]:
    keyword_counter: Counter[str] = Counter()
    for text in texts:
        normalized = replace_instrument_tokens(str(text))
        for keyword in SUBMISSION_DRIVER_KEYWORDS:
            if keyword in normalized:
                keyword_counter[keyword] += 1
    if keyword_counter:
        return [DriverTag(term=term, count=count) for term, count in keyword_counter.most_common(8)]

    counter: Counter[str] = Counter()
    for text in texts:
        for token in re.findall(r"[\u4e00-\u9fff]{2,6}", text):
            if token in CHINESE_DRIVER_STOPWORDS:
                continue
            if token.endswith(("公司", "公告", "摘要", "说明", "說明")):
                continue
            if any(noise in token for noise in {"下载", "股份分類", "法定", "限公司", "相关法", "黔茅策"}):
                continue
            counter[token] += 1
    return [DriverTag(term=term, count=count) for term, count in counter.most_common(8)]


def _build_submission_news_dates_payload(
    ticker: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> NewsDatesPayload:
    df = _load_submission_events()
    if df.empty:
        return NewsDatesPayload(dates=[], range_start=start_date, range_end=end_date, latest_anchor_in_range=None)
    stock_code = _normalize_submission_stock_code(ticker)
    subset = df[df["stock_code"] == stock_code].copy()
    if subset.empty:
        return NewsDatesPayload(dates=[], range_start=start_date, range_end=end_date, latest_anchor_in_range=None)
    subset["date"] = subset["timestamp"].dt.strftime("%Y-%m-%d")
    if start_date:
        subset = subset[subset["date"] >= start_date]
    if end_date:
        subset = subset[subset["date"] <= end_date]
    dates = sorted(subset["date"].dropna().unique().tolist(), reverse=True)
    return NewsDatesPayload(
        dates=dates,
        range_start=start_date,
        range_end=end_date,
        latest_anchor_in_range=dates[0] if dates else None,
    )


def _build_submission_news_drilldown_payload(
    ticker: str,
    alert_date: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> NewsDrilldownPayload | None:
    df = _load_submission_events()
    if df.empty:
        return None
    stock_code = _normalize_submission_stock_code(ticker)
    subset = df[df["stock_code"] == stock_code].copy()
    if subset.empty:
        return None
    subset["date"] = subset["timestamp"].dt.strftime("%Y-%m-%d")
    day_news = subset[subset["date"] == alert_date].copy()
    if day_news.empty:
        return NewsDrilldownPayload(
            header=NewsHeader(
                ticker=ticker,
                alert_date=alert_date,
                summary=f"当前展示的是全局范围 {start_date} 至 {end_date} 内，锚定到 {alert_date} 的新闻热度拆解" if start_date and end_date else "当天无可展示新闻事件",
                range_start=start_date,
                range_end=end_date,
            ),
            stats=NewsStats(negative_ratio=0.0, negative_vs_30d=0.0, total_signals=0),
            drivers=[],
            news_items=[],
            anchor=NewsAnchor(
                anchor_date=alert_date,
                note="当天无预警锚点；你当前看到的是所选日期下的新闻查询结果。若结果为空，表示当天暂无可展示新闻。",
                in_range=(not start_date or alert_date >= start_date) and (not end_date or alert_date <= end_date),
            ),
        )

    items: list[NewsItem] = []
    sentiments: list[str] = []
    preferred_driver_texts: list[str] = []
    fallback_driver_texts: list[str] = []
    day_news["source_priority"] = day_news["source"].map(lambda value: SUBMISSION_SOURCE_PRIORITY.get(str(value), 9))
    day_news = day_news.sort_values(["source_priority", "timestamp"], ascending=[True, False])
    for idx, row in enumerate(day_news.head(20).itertuples()):
        text = str(row.text_content)
        sentiment, confidence = _infer_submission_sentiment(text, str(row.source))
        sentiments.append(sentiment)
        tags = []
        if row.source in {"cninfo_announcement", "sse_announcement"}:
            tags.append("公告")
        if row.source == "sina_news":
            tags.append("新闻")
        if row.source == "eastmoney_guba":
            tags.append("讨论")
        items.append(
            NewsItem(
                id=str(row.id),
                title=_extract_submission_title(text, str(row.source)),
                source=_normalize_submission_source(str(row.source)),
                publish_time=pd.to_datetime(row.timestamp).strftime("%H:%M 北京时间"),
                topic_tags=tags,
                sentiment=sentiment,
                confidence=confidence,
                summary=text[:120],
            )
        )
        driver_text = items[-1].title if row.source in {"cninfo_announcement", "sse_announcement", "sina_news"} else f"{items[-1].title} {items[-1].summary}"
        if row.source in {"cninfo_announcement", "sse_announcement", "sina_news"}:
            preferred_driver_texts.append(driver_text)
        else:
            fallback_driver_texts.append(driver_text)
    negative_ratio = (sum(1 for item in sentiments if item == "负面") / len(sentiments)) if sentiments else 0.0
    summary = "多源中文舆情事件按所选日期聚合展示，覆盖公告、媒体新闻与股吧讨论。"
    if start_date and end_date:
        summary = f"当前展示的是全局范围 {start_date} 至 {end_date} 内，锚定到 {alert_date} 的新闻热度拆解"
    return NewsDrilldownPayload(
        header=NewsHeader(
            ticker=ticker,
            alert_date=alert_date,
            summary=summary,
            range_start=start_date,
            range_end=end_date,
        ),
        stats=NewsStats(
            negative_ratio=float(negative_ratio),
            negative_vs_30d=0.0,
            total_signals=len(items),
        ),
        drivers=_extract_submission_drivers(preferred_driver_texts or fallback_driver_texts),
        news_items=items,
        anchor=NewsAnchor(
            anchor_date=alert_date,
            note="该锚点日期用于锁定新闻聚合口径，并与全局筛选日期范围协同工作",
            in_range=(not start_date or alert_date >= start_date) and (not end_date or alert_date <= end_date),
        ),
    )


def build_news_dates_payload(
    ticker: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> NewsDatesPayload:
    if _should_use_submission_window(start_date, end_date):
        submission_payload = _build_submission_news_dates_payload(ticker, start_date=start_date, end_date=end_date)
        if submission_payload.dates:
            return submission_payload
    news = load_news_sentiment()
    subset = news[news["ticker"] == ticker].copy() if not news.empty else pd.DataFrame()
    if subset.empty:
        return NewsDatesPayload(dates=[], range_start=start_date, range_end=end_date, latest_anchor_in_range=None)

    subset["publish_timestamp"] = pd.to_datetime(subset["publish_timestamp"], errors="coerce")
    subset["trading_date_anchor"] = pd.to_datetime(subset.get("trading_date_anchor"), errors="coerce")
    anchor_series = (
        subset["trading_date_anchor"]
        .dropna()
    )
    if start_date:
        anchor_series = anchor_series[anchor_series >= pd.to_datetime(start_date)]
    if end_date:
        anchor_series = anchor_series[anchor_series <= pd.to_datetime(end_date)]
    anchor_dates = anchor_series.dt.strftime("%Y-%m-%d").drop_duplicates().sort_values(ascending=False).tolist()
    if anchor_dates:
        return NewsDatesPayload(
            dates=anchor_dates,
            range_start=start_date,
            range_end=end_date,
            latest_anchor_in_range=anchor_dates[0],
        )

    target_end = end_date or subset["publish_timestamp"].max().strftime("%Y-%m-%d")
    context = build_projection_context(target_end, target_end, subset["publish_timestamp"])
    projected_dates = (
        subset["publish_timestamp"]
        .dropna()
        .map(lambda item: project_timestamp(item, context).strftime("%Y-%m-%d"))
        .drop_duplicates()
        .tolist()
    )
    projected_dates.sort(reverse=True)
    if start_date:
        projected_dates = [date for date in projected_dates if date >= start_date]
    if end_date:
        projected_dates = [date for date in projected_dates if date <= end_date]
    return NewsDatesPayload(
        dates=projected_dates,
        range_start=start_date,
        range_end=end_date,
        latest_anchor_in_range=projected_dates[0] if projected_dates else None,
    )


def build_news_drilldown_payload(
    ticker: str,
    alert_date: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> NewsDrilldownPayload:
    if _should_use_submission_window(start_date, end_date, alert_date=alert_date):
        submission_payload = _build_submission_news_drilldown_payload(
            ticker,
            alert_date,
            start_date=start_date,
            end_date=end_date,
        )
        if submission_payload is not None:
            return submission_payload
    news = load_news_sentiment()
    subset = news[news["ticker"] == ticker].copy() if not news.empty else pd.DataFrame()
    subset["publish_timestamp"] = pd.to_datetime(subset["publish_timestamp"], errors="coerce") if not subset.empty else pd.Series(dtype="datetime64[ns]")
    subset["trading_date_anchor"] = pd.to_datetime(subset.get("trading_date_anchor"), errors="coerce") if not subset.empty else pd.Series(dtype="datetime64[ns]")
    context = build_projection_context(alert_date, alert_date, subset["publish_timestamp"]) if not subset.empty else build_projection_context(alert_date, alert_date, pd.Series(dtype="datetime64[ns]"))

    manual_date_without_anchor = False
    if not subset.empty:
        subset["projected_publish_timestamp"] = subset["publish_timestamp"].map(lambda item: project_timestamp(item, context))
        subset["projected_anchor_date"] = subset["trading_date_anchor"].map(lambda item: project_timestamp(item, context))
        if subset["trading_date_anchor"].notna().any():
            day_news = subset[subset["trading_date_anchor"].dt.strftime("%Y-%m-%d") == alert_date].copy()
        else:
            day_news = subset[subset["projected_publish_timestamp"].dt.strftime("%Y-%m-%d") == alert_date].copy()
    else:
        day_news = pd.DataFrame()

    if day_news.empty:
        manual_date_without_anchor = True

    negative_ratio = float((day_news["sentiment_label"] == "negative").mean()) if len(day_news) else 0.0
    terms = Counter()
    text_series = day_news.get("title", pd.Series(dtype=str)).fillna("") + " " + day_news.get("summary", pd.Series(dtype=str)).fillna("")
    for text in text_series:
        for token in str(text).lower().split():
            token = token.strip(".,:;!?()[]{}\"'")
            if _should_keep_driver_token(token):
                terms[token] += 1
    drivers = [DriverTag(term=localize_term(term), count=count) for term, count in terms.most_common(8)]
    sentiment_map = {
        "negative": "负面",
        "neutral": "中性",
        "positive": "正面",
    }
    items = []
    for idx, row in enumerate(day_news.head(20).itertuples()):
        ts = pd.to_datetime(getattr(row, "projected_publish_timestamp", row.publish_timestamp))
        tags = []
        title_lower = str(row.title).lower()
        summary_lower = str(getattr(row, "summary", "")).lower()
        if any(word in title_lower or word in summary_lower for word in ["antitrust", "fine", "lawsuit", "regulatory"]):
            tags.extend(["法务", "监管"])
        elif "cloud" in title_lower or "gpu" in summary_lower:
            tags.extend(["产品", "市场"])
        items.append(
            NewsItem(
                id=f"news_{idx}",
                title=localize_text(str(row.title)),
                source=str(getattr(row, "source", "未知来源")),
                publish_time=ts.strftime("%H:%M 北京时间") if pd.notna(ts) else "--",
                topic_tags=tags,
                sentiment=sentiment_map.get(str(getattr(row, "sentiment_label", "neutral")), str(getattr(row, "sentiment_label", "neutral"))),
                confidence=float(getattr(row, "negative_prob", 0.0) or 0.0),
                summary=localize_text(str(getattr(row, "summary", ""))),
            )
        )

    summary = "新闻热度激增由当日相关新闻主题集中驱动"
    if start_date and end_date:
        summary = f"当前展示的是全局范围 {start_date} 至 {end_date} 内，锚定到 {alert_date} 的新闻热度拆解"

    in_range = True
    if start_date and alert_date < start_date:
        in_range = False
    if end_date and alert_date > end_date:
        in_range = False

    anchor_note = "该锚点日期用于锁定新闻聚合口径，并与全局筛选日期范围协同工作"
    if not in_range:
        anchor_note = "该锚点日期用于锁定新闻聚合口径，并与全局筛选日期范围协同工作；若结束日期自动更新到今日，锚点可能晚于你此前手动选择的结束日期"
    elif manual_date_without_anchor:
        anchor_note = "当天无预警锚点；你当前看到的是所选日期下的新闻查询结果。若结果为空，表示当天暂无可展示新闻。"

    return NewsDrilldownPayload(
        header=NewsHeader(
            ticker=ticker,
            alert_date=alert_date,
            summary=summary,
            range_start=start_date,
            range_end=end_date,
        ),
        stats=NewsStats(negative_ratio=negative_ratio, negative_vs_30d=0.0, total_signals=len(day_news)),
        drivers=drivers,
        news_items=items,
        anchor=NewsAnchor(
            anchor_date=alert_date,
            note=anchor_note,
            in_range=in_range,
        ),
    )
