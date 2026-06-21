from pathlib import Path

import pytest
import yaml

from backend.services.instrument_service import build_instrument_groups, load_active_instruments

EXPECTED_RELIABLE_SYMBOLS = [
    "600519.SH",
    "000858.SZ",
    "600887.SH",
    "000568.SZ",
    "002714.SZ",
    "300498.SZ",
    "002304.SZ",
    "600809.SH",
    "000596.SZ",
    "600276.SH",
    "300760.SZ",
    "600436.SH",
    "000538.SZ",
    "603259.SH",
    "300122.SZ",
    "300750.SZ",
    "002594.SZ",
    "601012.SH",
    "300274.SZ",
    "688223.SH",
    "600438.SH",
    "603501.SH",
    "002371.SZ",
    "300223.SZ",
    "688008.SH",
    "688981.SH",
    "600584.SH",
    "688111.SH",
    "002230.SZ",
    "600570.SH",
    "300033.SZ",
    "600588.SH",
    "300454.SZ",
    "002027.SZ",
    "002475.SZ",
    "000063.SZ",
    "300308.SZ",
    "300782.SZ",
    "002241.SZ",
    "002938.SZ",
    "002415.SZ",
    "002050.SZ",
    "600050.SH",
    "600036.SH",
    "601318.SH",
    "600030.SH",
    "601688.SH",
    "601166.SH",
    "601398.SH",
    "600999.SH",
    "601601.SH",
    "601211.SH",
    "601899.SH",
    "601088.SH",
    "600028.SH",
    "600938.SH",
    "600111.SH",
    "000807.SZ",
    "600309.SH",
    "601225.SH",
    "601668.SH",
    "600900.SH",
    "600089.SH",
    "601390.SH",
    "600941.SH",
    "001979.SZ",
    "600031.SH",
    "300124.SZ",
    "601877.SH",
    "600760.SH",
    "600893.SH",
    "601111.SH",
    "601021.SH",
    "000768.SZ",
    "601766.SH",
]


def test_load_active_instruments_returns_sorted_a_share_whitelist() -> None:
    instruments = load_active_instruments()

    assert instruments
    assert instruments[0].symbol.endswith((".SH", ".SZ"))
    assert any(item.sector_group == "消费" for item in instruments)
    assert any("贵州茅台" == item.name for item in instruments)
    assert all(item.symbol != "601989.SH" for item in instruments)

    for previous, current in zip(instruments, instruments[1:]):
        assert (previous.sort_order, previous.code) <= (current.sort_order, current.code)


def test_build_instrument_groups_keeps_sector_order_and_aliases() -> None:
    groups = build_instrument_groups()

    assert groups
    assert groups[0].group_name == "消费"
    assert any("茅台" in instrument.aliases for instrument in groups[0].instruments)


def test_load_active_instruments_raises_clear_error_for_invalid_yaml_shape(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    config_path = tmp_path / "instruments_a_share.yaml"
    config_path.write_text(
        yaml.safe_dump({"instruments": []}, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )

    monkeypatch.setattr("backend.services.instrument_service.A_SHARE_INSTRUMENTS_PATH", config_path)

    with pytest.raises(ValueError, match="顶层列表"):
        load_active_instruments()


def test_build_instrument_groups_rejects_unknown_sector_group(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    config_path = tmp_path / "instruments_a_share.yaml"
    config_path.write_text(
        yaml.safe_dump(
            [
                {
                    "symbol": "600000.SH",
                    "code": "600000",
                    "name": "浦发银行",
                    "full_name": "上海浦东发展银行股份有限公司",
                    "market": "SSE",
                    "board": "main_board",
                    "sector_group": "未知分组",
                    "industry": "银行",
                    "aliases": ["浦发", "浦发银行"],
                    "is_featured": True,
                    "sort_order": 1,
                    "is_active": True,
                }
            ],
            allow_unicode=True,
            sort_keys=False,
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr("backend.services.instrument_service.A_SHARE_INSTRUMENTS_PATH", config_path)

    with pytest.raises(ValueError, match="未知的 A 股一级分组"):
        build_instrument_groups()


def test_load_reliable_instruments_only_returns_fully_backed_symbols() -> None:
    from backend.services.instrument_service import load_reliable_instruments

    instruments = load_reliable_instruments()

    symbols = [item.symbol for item in instruments]
    assert symbols == EXPECTED_RELIABLE_SYMBOLS


def test_build_reliable_instrument_groups_only_exposes_backed_symbols() -> None:
    from backend.services.instrument_service import build_reliable_instrument_groups

    groups = build_reliable_instrument_groups()

    assert [group.group_name for group in groups] == [
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
    assert [group.instruments[0].symbol for group in groups] == [
        "600519.SH",
        "600276.SH",
        "300750.SZ",
        "603501.SH",
        "688111.SH",
        "002475.SZ",
        "600036.SH",
        "601899.SH",
        "601668.SH",
        "600760.SH",
    ]


def test_load_reliable_instruments_recomputes_after_cache_clear() -> None:
    from backend.services import instrument_service

    instrument_service._load_reliable_symbols.cache_clear()
    symbols = [item.symbol for item in instrument_service.load_reliable_instruments()]

    assert symbols == EXPECTED_RELIABLE_SYMBOLS
