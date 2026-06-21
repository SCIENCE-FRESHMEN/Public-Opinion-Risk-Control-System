from fastapi import APIRouter

from backend.schemas.meta import (
    AcquisitionSummaryPayload,
    FiltersPayload,
    StatusPayload,
    SubmissionStockCoveragePayload,
    MemberBAnalysisPayload,
    MemberBEnhancedPredictionPayload,
    LlmBriefPayload,
    ProjectEvidencePayload,
    SubmissionHeatTopPayload,
    SubmissionRiskEventsPayload,
    SubmissionStockPostsPayload,
    SubmissionStockRiskTimelinePayload,
)
from backend.services.meta_service import (
    build_acquisition_summary_payload,
    build_filters_payload,
    build_llm_brief_payload,
    build_member_b_analysis_payload,
    build_member_b_enhanced_prediction_payload,
    build_project_evidence_payload,
    build_submission_stock_coverage_payload,
    build_submission_risk_events_payload,
    build_submission_stock_posts_payload,
    build_submission_stock_risk_timeline_payload,
    build_status_payload,
    build_submission_heat_top_payload,
)

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/filters", response_model=FiltersPayload)
def filters() -> FiltersPayload:
    return build_filters_payload()


@router.get("/status", response_model=StatusPayload)
def status() -> StatusPayload:
    return build_status_payload()


@router.get("/acquisition-summary", response_model=AcquisitionSummaryPayload)
def acquisition_summary() -> AcquisitionSummaryPayload:
    return build_acquisition_summary_payload()


@router.get("/submission-heat-top", response_model=SubmissionHeatTopPayload)
def submission_heat_top() -> SubmissionHeatTopPayload:
    return build_submission_heat_top_payload()


@router.get("/submission-risk-events", response_model=SubmissionRiskEventsPayload)
def submission_risk_events() -> SubmissionRiskEventsPayload:
    return build_submission_risk_events_payload()


@router.get("/submission-stock-risk-timeline", response_model=SubmissionStockRiskTimelinePayload)
def submission_stock_risk_timeline(ticker: str) -> SubmissionStockRiskTimelinePayload:
    return build_submission_stock_risk_timeline_payload(ticker)


@router.get("/submission-stock-posts", response_model=SubmissionStockPostsPayload)
def submission_stock_posts(ticker: str) -> SubmissionStockPostsPayload:
    return build_submission_stock_posts_payload(ticker)


@router.get("/submission-stock-coverage", response_model=SubmissionStockCoveragePayload)
def submission_stock_coverage(ticker: str) -> SubmissionStockCoveragePayload:
    return build_submission_stock_coverage_payload(ticker)


@router.get("/member-b-analysis", response_model=MemberBAnalysisPayload)
def member_b_analysis(ticker: str) -> MemberBAnalysisPayload:
    return build_member_b_analysis_payload(ticker)


@router.get("/member-b-enhanced-prediction", response_model=MemberBEnhancedPredictionPayload)
def member_b_enhanced_prediction(ticker: str) -> MemberBEnhancedPredictionPayload:
    return build_member_b_enhanced_prediction_payload(ticker)


@router.get("/llm-brief", response_model=LlmBriefPayload)
def llm_brief(ticker: str) -> LlmBriefPayload:
    return build_llm_brief_payload(ticker)


@router.get("/project-evidence", response_model=ProjectEvidencePayload)
def project_evidence() -> ProjectEvidencePayload:
    return build_project_evidence_payload()
