from pydantic import BaseModel


class SeriesPoint(BaseModel):
    date: str
    value: float
