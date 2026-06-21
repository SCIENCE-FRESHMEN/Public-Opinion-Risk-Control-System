from fastapi import APIRouter

from backend.schemas.linkage import LinkagePayload
from backend.services.linkage_service import build_linkage_payload
from backend.services.ticker_guard import ensure_active_ticker

router = APIRouter(prefix="/api/linkage", tags=["linkage"])


@router.get("", response_model=LinkagePayload)
def linkage(ticker: str, start_date: str, end_date: str) -> LinkagePayload:
    return build_linkage_payload(ensure_active_ticker(ticker), start_date, end_date)
