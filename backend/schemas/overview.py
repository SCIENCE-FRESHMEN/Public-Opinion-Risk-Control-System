from pydantic import BaseModel

from backend.schemas.common import SeriesPoint


class OverviewHeader(BaseModel):
    ticker: str
    as_of: str


class MetricValue(BaseModel):
    value: float | int | str
    delta: float | None = None
    label: str | None = None


class RiskMetric(BaseModel):
    level: str
    label: str


class OverviewKpis(BaseModel):
    price: MetricValue
    sentiment: MetricValue
    news_heat: MetricValue
    risk: RiskMetric


class OverviewAlertRow(BaseModel):
    trade_date: str
    timestamp: str
    alert_type: str
    severity: str
    description: str


class OverviewPayload(BaseModel):
    header: OverviewHeader
    kpis: OverviewKpis
    price_context: list[SeriesPoint]
    alerts: list[OverviewAlertRow]
