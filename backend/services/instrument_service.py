from functools import lru_cache

import pandas as pd
import yaml

from backend.schemas.instrument import InstrumentGroupPayload, InstrumentPayload
from backend.services.data_loader import A_SHARE_INSTRUMENTS_PATH, PROCESSED_DIR

GROUP_ORDER = [
    "消费",
    "医药",
    "新能源",
    "半导体",
    "人工智能 / 计算机",
    "通信 / 电子制造",
    "金融",
    "周期 / 资源",
    "基建 / 地产 / 央国企",
    "交通 / 军工 / 综合热点",
]


def _load_instrument_rows() -> list[dict]:
    with open(A_SHARE_INSTRUMENTS_PATH, "r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle) or []

    if not isinstance(payload, list):
        raise ValueError("A 股标的主数据配置必须是顶层列表。")

    return payload


@lru_cache(maxsize=1)
def _load_reliable_symbols() -> frozenset[str]:
    required_artifacts = {
        "prices.parquet": lambda frame: frame["ticker"].dropna().astype(str).unique(),
        "news_sentiment.parquet": lambda frame: frame["ticker"].dropna().astype(str).unique(),
        "daily_sentiment_features.parquet": lambda frame: frame.loc[frame["news_count"].fillna(0) > 0, "ticker"].dropna().astype(str).unique(),
        "risk_alerts.parquet": lambda frame: frame["ticker"].dropna().astype(str).unique(),
        "backtest_results.parquet": lambda frame: frame.loc[
            frame["trigger_count"].fillna(0) > 0, "ticker"
        ].dropna().astype(str).unique(),
    }
    symbol_sets: list[set[str]] = []

    for artifact_name, selector in required_artifacts.items():
        artifact_path = PROCESSED_DIR / artifact_name
        if not artifact_path.exists():
            return frozenset()

        frame = pd.read_parquet(artifact_path)
        selected = set(selector(frame))
        if not selected:
            return frozenset()
        symbol_sets.append(selected)

    if not symbol_sets:
        return frozenset()

    return frozenset(set.intersection(*symbol_sets))


def load_active_instruments() -> list[InstrumentPayload]:
    instruments = [
        InstrumentPayload(**row)
        for row in _load_instrument_rows()
        if row.get("is_active", False)
    ]
    return sorted(instruments, key=lambda item: (item.sort_order, item.code))


def load_reliable_instruments() -> list[InstrumentPayload]:
    reliable_symbols = _load_reliable_symbols()
    instruments = [item for item in load_active_instruments() if item.symbol in reliable_symbols]
    return sorted(instruments, key=lambda item: (item.sort_order, item.code))


def build_instrument_groups() -> list[InstrumentGroupPayload]:
    grouped: dict[str, list[InstrumentPayload]] = {group: [] for group in GROUP_ORDER}
    for instrument in load_active_instruments():
        if instrument.sector_group not in grouped:
            raise ValueError(f"未知的 A 股一级分组: {instrument.sector_group}")
        grouped[instrument.sector_group].append(instrument)

    return [
        InstrumentGroupPayload(group_name=group_name, instruments=grouped[group_name])
        for group_name in GROUP_ORDER
        if grouped[group_name]
    ]


def build_reliable_instrument_groups() -> list[InstrumentGroupPayload]:
    grouped: dict[str, list[InstrumentPayload]] = {group: [] for group in GROUP_ORDER}
    for instrument in load_reliable_instruments():
        if instrument.sector_group not in grouped:
            raise ValueError(f"未知的 A 股一级分组: {instrument.sector_group}")
        grouped[instrument.sector_group].append(instrument)

    return [
        InstrumentGroupPayload(group_name=group_name, instruments=grouped[group_name])
        for group_name in GROUP_ORDER
        if grouped[group_name]
    ]
