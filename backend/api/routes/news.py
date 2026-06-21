from fastapi import APIRouter

from backend.schemas.news import NewsDatesPayload, NewsDrilldownPayload
from backend.services.news_service import build_news_dates_payload, build_news_drilldown_payload
from backend.services.ticker_guard import ensure_active_ticker

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/dates", response_model=NewsDatesPayload)
def dates(ticker: str, start_date: str | None = None, end_date: str | None = None) -> NewsDatesPayload:
    return build_news_dates_payload(ensure_active_ticker(ticker), start_date=start_date, end_date=end_date)


@router.get("/drilldown", response_model=NewsDrilldownPayload)
def drilldown(
    ticker: str,
    alert_date: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> NewsDrilldownPayload:
    return build_news_drilldown_payload(
        ensure_active_ticker(ticker),
        alert_date,
        start_date=start_date,
        end_date=end_date,
    )
