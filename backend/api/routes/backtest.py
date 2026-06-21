from fastapi import APIRouter

from backend.schemas.backtest import BacktestPayload
from backend.services.backtest_service import build_backtest_payload
from backend.services.ticker_guard import ensure_active_ticker

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


@router.get("", response_model=BacktestPayload)
def backtest(alert_type: str, horizon: int, ticker: str | None = None, start_date: str | None = None, end_date: str | None = None) -> BacktestPayload:
    guarded_ticker = ensure_active_ticker(ticker) if ticker else None
    return build_backtest_payload(alert_type, horizon, ticker=guarded_ticker, start_date=start_date, end_date=end_date)
