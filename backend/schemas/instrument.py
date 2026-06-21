from pydantic import BaseModel


class InstrumentPayload(BaseModel):
    symbol: str
    code: str
    name: str
    full_name: str
    market: str
    board: str
    sector_group: str
    industry: str
    aliases: list[str]
    is_featured: bool
    sort_order: int
    is_active: bool


class InstrumentGroupPayload(BaseModel):
    group_name: str
    instruments: list[InstrumentPayload]
