from pydantic import BaseModel

from backend.schemas.common import SeriesPoint


class LinkageSummary(BaseModel):
    ticker: str
    sector: str
    avg_sentiment: float
    risk_status: str


class LinkageSeriesGroup(BaseModel):
    price: list[SeriesPoint]
    sentiment: list[SeriesPoint]
    news_volume: list[SeriesPoint]


class AlertSpike(BaseModel):
    date: str
    price: float
    sentiment: float
    news_volume: int
    label: str


class AnchorPayload(BaseModel):
    anchor_date: str
    note: str


class LinkagePayload(BaseModel):
    summary: LinkageSummary
    series: LinkageSeriesGroup
    alert_spikes: list[AlertSpike]
    anchor: AnchorPayload
