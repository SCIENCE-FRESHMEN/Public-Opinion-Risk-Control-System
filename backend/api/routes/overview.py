from fastapi import APIRouter

from backend.schemas.overview import OverviewPayload
from backend.services.overview_service import build_overview_payload
from backend.services.ticker_guard import ensure_active_ticker

router = APIRouter(prefix="/api/overview", tags=["overview"])


@router.get("", response_model=OverviewPayload)
def overview(ticker: str, start_date: str, end_date: str) -> OverviewPayload:
    return build_overview_payload(ensure_active_ticker(ticker), start_date, end_date)
