from pydantic import BaseModel

from backend.schemas.instrument import InstrumentGroupPayload


class DateRangePayload(BaseModel):
    start: str
    end: str


class DefaultsPayload(BaseModel):
    ticker: str
    start_date: str
    end_date: str


class FiltersPayload(BaseModel):
    tickers: list[str]
    instrument_groups: list[InstrumentGroupPayload]
    date_range: DateRangePayload
    defaults: DefaultsPayload


class ArtifactStatusPayload(BaseModel):
    name: str
    exists: bool
    path: str


class StatusPayload(BaseModel):
    artifacts: list[ArtifactStatusPayload]


class SubmissionHeatRowPayload(BaseModel):
    rank: int
    ticker: str
    stock_name: str
    heat_score: int
    sentiment_score: float
    risk_level: str
    change_pct: float


class SubmissionHeatTopPayload(BaseModel):
    rows: list[SubmissionHeatRowPayload]


class SubmissionRiskEventPayload(BaseModel):
    time: str
    ticker: str
    stock_name: str
    title: str
    severity: str
    source: str


class SubmissionRiskEventsPayload(BaseModel):
    events: list[SubmissionRiskEventPayload]


class SubmissionStockRiskTimelineItemPayload(BaseModel):
    time: str
    event_type: str
    title: str
    description: str
    severity: str


class SubmissionStockRiskTimelinePayload(BaseModel):
    events: list[SubmissionStockRiskTimelineItemPayload]


class SubmissionStockPostPayload(BaseModel):
    id: str
    source: str
    publish_time: str
    sentiment: str
    summary: str


class SubmissionStockPostsPayload(BaseModel):
    posts: list[SubmissionStockPostPayload]


class SubmissionStockSourceItemPayload(BaseModel):
    source: str
    record_count: int
    status: str


class SubmissionStockCoveragePayload(BaseModel):
    ticker: str
    stock_name: str
    quote: float
    important_official_count: int
    official_count: int
    news_count: int
    guba_count: int
    active_source_count: int
    latest_capture_time: str
    quote_status: str
    source_items: list[SubmissionStockSourceItemPayload]


class ProjectEvidenceDatasetPayload(BaseModel):
    total_records: int
    unique_stocks: int
    total_news_count: int
    total_comment_count: int
    window_start: str
    window_end: str


class ProjectEvidenceModelPayload(BaseModel):
    trigger_count: int
    mean_forward_return: float
    max_drawdown: float
    negative_return_ratio: float
    volatility: float


class ProjectEvidencePredictionPayload(BaseModel):
    direction: str
    confidence: float
    risk_score: float
    expected_range: str


class ProjectEvidencePayload(BaseModel):
    dataset: ProjectEvidenceDatasetPayload
    model: ProjectEvidenceModelPayload
    featured_prediction: ProjectEvidencePredictionPayload


class AcquisitionCoverageItemPayload(BaseModel):
    source: str
    covered: int
    total: int
    coverage_ratio: float


class AcquisitionSummaryPayload(BaseModel):
    stock_pool_count: int
    selection_mode: str
    window_start: str
    window_end: str
    unified_event_coverage: int
    coverage_items: list[AcquisitionCoverageItemPayload]
    latest_generated_at: str
    external_site_url: str


class MemberBTopicItemPayload(BaseModel):
    keyword: str
    score: float
    frequency: int


class MemberBRiskTimelineItemPayload(BaseModel):
    date: str
    risk_score: float
    sentiment_weighted: float
    negative_ratio: float
    opinion_count: int


class MemberBCoveredStockPayload(BaseModel):
    ticker: str
    stock_name: str
    risk_label: str
    mean_sentiment: float
    total_opinions: int


class MemberBEnhancedPredictionPayload(BaseModel):
    matched: bool
    ticker: str
    stock_name: str
    model_name: str
    model_ready: bool
    scaler_ready: bool
    feature_count: int
    direction: str
    confidence: float
    risk_level: str
    explanation: str
    notes: list[str]
    supported_outputs: list[str]


class MemberBAnalysisPayload(BaseModel):
    matched: bool
    ticker: str
    stock_code: str
    stock_name: str
    generated_at: str
    mean_sentiment: float
    total_opinions: int
    positive_ratio: float
    negative_ratio: float
    neutral_ratio: float
    risk_score: float
    risk_level: str
    risk_label: str
    rumor_count: int
    triggered_rules: list[str]
    risk_factors: list[str]
    top_topics: list[MemberBTopicItemPayload]
    risk_timeline: list[MemberBRiskTimelineItemPayload]
    covered_stocks: list[MemberBCoveredStockPayload]


class LlmBriefContentPayload(BaseModel):
    headline: str
    summary: str
    sentiment_view: str
    risk_view: str
    action_view: str


class LlmBriefPayload(BaseModel):
    ticker: str
    stock_name: str
    generation_mode: str
    data_sources: list[str]
    brief: LlmBriefContentPayload
