from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True)
class ProjectedDateContext:
    requested_start: pd.Timestamp
    requested_end: pd.Timestamp
    source_start: pd.Timestamp
    source_end: pd.Timestamp
    offset_days: int


def build_projection_context(requested_start: str, requested_end: str, source_dates: pd.Series) -> ProjectedDateContext:
    normalized = pd.to_datetime(source_dates, errors="coerce").dropna().sort_values()
    requested_start_ts = pd.to_datetime(requested_start)
    requested_end_ts = pd.to_datetime(requested_end)

    if normalized.empty:
        return ProjectedDateContext(
            requested_start=requested_start_ts,
            requested_end=requested_end_ts,
            source_start=requested_start_ts,
            source_end=requested_end_ts,
            offset_days=0,
        )

    source_start = normalized.iloc[0].normalize()
    source_end = normalized.iloc[-1].normalize()
    offset_days = max((requested_end_ts.normalize() - source_end).days, 0)
    return ProjectedDateContext(
        requested_start=requested_start_ts,
        requested_end=requested_end_ts,
        source_start=source_start,
        source_end=source_end,
        offset_days=offset_days,
    )



def project_timestamp(value: pd.Timestamp | str | None, context: ProjectedDateContext) -> pd.Timestamp:
    ts = pd.to_datetime(value, errors="coerce")
    if pd.isna(ts):
        return context.requested_end.normalize()
    return ts + pd.Timedelta(days=context.offset_days)



def clamp_projected_frame(frame: pd.DataFrame, column: str, context: ProjectedDateContext) -> pd.DataFrame:
    if frame.empty:
        return frame.copy()

    result = frame.copy()
    result[column] = pd.to_datetime(result[column], errors="coerce").map(lambda value: project_timestamp(value, context))
    start = context.requested_start.normalize()
    end = context.requested_end.normalize()
    return result[(result[column] >= start) & (result[column] <= end)].copy()


def extend_with_boundary_points(frame: pd.DataFrame, column: str, start_date: str, end_date: str) -> pd.DataFrame:
    if frame.empty:
        return frame.copy()

    result = frame.copy()
    result[column] = pd.to_datetime(result[column], errors="coerce")
    requested_start = pd.to_datetime(start_date).normalize()
    requested_end = pd.to_datetime(end_date).normalize()
    in_window = result[(result[column] >= requested_start) & (result[column] <= requested_end)].copy()
    if in_window.empty:
        return in_window

    previous_point = result[result[column] < requested_start].tail(1)
    next_point = result[result[column] > requested_end].head(1)
    return (
        pd.concat([previous_point, in_window, next_point], ignore_index=True)
        .drop_duplicates(subset=[column], keep="last")
        .sort_values(column)
        .reset_index(drop=True)
    )



def build_daily_window(context: ProjectedDateContext) -> pd.DatetimeIndex:
    return pd.date_range(context.requested_start.normalize(), context.requested_end.normalize(), freq="D")
