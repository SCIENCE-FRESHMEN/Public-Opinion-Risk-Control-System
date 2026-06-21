from pydantic import BaseModel


class BacktestSummary(BaseModel):
    historical_triggers: int
    mean_forward_return: float
    max_drawdown: float
    negative_hit_rate: float


class TrajectoryPoint(BaseModel):
    horizon: int
    avg_return: float


class DistributionPayload(BaseModel):
    min: float
    q1: float
    median: float
    q3: float
    max: float


class EventRow(BaseModel):
    ticker: str
    trade_date: str
    alert_type: str
    horizon: int
    forward_return: float


class BacktestPayload(BaseModel):
    summary: BacktestSummary
    active_alert_type: str
    trajectory: list[TrajectoryPoint]
    distribution: DistributionPayload
    events: list[EventRow]
