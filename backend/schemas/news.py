from pydantic import BaseModel


class NewsDatesPayload(BaseModel):
    dates: list[str]
    range_start: str | None = None
    range_end: str | None = None
    latest_anchor_in_range: str | None = None


class NewsHeader(BaseModel):
    ticker: str
    alert_date: str
    summary: str
    range_start: str | None = None
    range_end: str | None = None


class NewsStats(BaseModel):
    negative_ratio: float
    negative_vs_30d: float
    total_signals: int


class DriverTag(BaseModel):
    term: str
    count: int


class NewsItem(BaseModel):
    id: str
    title: str
    source: str
    publish_time: str
    topic_tags: list[str]
    sentiment: str
    confidence: float
    summary: str


class NewsAnchor(BaseModel):
    anchor_date: str
    note: str
    in_range: bool = True


class NewsDrilldownPayload(BaseModel):
    header: NewsHeader
    stats: NewsStats
    drivers: list[DriverTag]
    news_items: list[NewsItem]
    anchor: NewsAnchor
