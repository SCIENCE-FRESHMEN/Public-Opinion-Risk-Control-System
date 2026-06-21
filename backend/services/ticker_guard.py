from fastapi import HTTPException

from backend.services.instrument_service import load_active_instruments


def ensure_active_ticker(ticker: str) -> str:
    normalized = str(ticker).upper().strip()
    active_symbols = {item.symbol for item in load_active_instruments()}
    if normalized not in active_symbols:
        raise HTTPException(status_code=404, detail=f"未找到可用标的: {normalized}")
    return normalized
