import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_third_batch_symbols_are_in_pipeline_config() -> None:
    config = yaml.safe_load((ROOT / 'config' / 'config.yaml').read_text(encoding='utf-8'))
    expected = {'600036.SH', '688981.SH', '300760.SZ', '000063.SZ', '300274.SZ'}

    assert expected.issubset(set(config['default_tickers']))


def test_third_batch_symbols_have_keyword_mapping() -> None:
    ticker_map = yaml.safe_load((ROOT / 'config' / 'tickers.yaml').read_text(encoding='utf-8'))

    for symbol in ['600036.SH', '688981.SH', '300760.SZ', '000063.SZ', '300274.SZ']:
        assert symbol in ticker_map
        assert ticker_map[symbol]['keywords']


def test_first_round_expansion_symbols_are_in_pipeline_config() -> None:
    config = yaml.safe_load((ROOT / 'config' / 'config.yaml').read_text(encoding='utf-8'))
    expected = {'600887.SH', '600276.SH', '601318.SH'}

    assert expected.issubset(set(config['default_tickers']))


def test_first_round_expansion_symbols_have_keyword_mapping() -> None:
    ticker_map = yaml.safe_load((ROOT / 'config' / 'tickers.yaml').read_text(encoding='utf-8'))

    for symbol in ['600887.SH', '600276.SH', '601318.SH']:
        assert symbol in ticker_map
        assert ticker_map[symbol]['keywords']


def test_second_round_candidate_symbols_are_in_pipeline_config() -> None:
    config = yaml.safe_load((ROOT / 'config' / 'config.yaml').read_text(encoding='utf-8'))
    expected = {'000568.SZ', '300308.SZ', '002230.SZ', '601012.SH', '002371.SZ'}

    assert expected.issubset(set(config['default_tickers']))


def test_second_round_candidate_symbols_have_keyword_mapping() -> None:
    ticker_map = yaml.safe_load((ROOT / 'config' / 'tickers.yaml').read_text(encoding='utf-8'))

    for symbol in ['000568.SZ', '300308.SZ', '002230.SZ', '601012.SH', '002371.SZ']:
        assert symbol in ticker_map
        assert ticker_map[symbol]['keywords']


def test_third_round_candidate_symbols_are_in_pipeline_config() -> None:
    config = yaml.safe_load((ROOT / 'config' / 'config.yaml').read_text(encoding='utf-8'))
    expected = {'002714.SZ', '603259.SH', '688111.SH', '002475.SZ', '601688.SH', '600030.SH', '603501.SH'}

    assert expected.issubset(set(config['default_tickers']))


def test_third_round_candidate_symbols_have_keyword_mapping() -> None:
    ticker_map = yaml.safe_load((ROOT / 'config' / 'tickers.yaml').read_text(encoding='utf-8'))

    for symbol in ['002714.SZ', '603259.SH', '688111.SH', '002475.SZ', '601688.SH', '600030.SH', '603501.SH']:
        assert symbol in ticker_map
        assert ticker_map[symbol]['keywords']


def test_fourth_round_candidate_symbols_are_in_pipeline_config() -> None:
    config = yaml.safe_load((ROOT / 'config' / 'config.yaml').read_text(encoding='utf-8'))
    expected = {'300498.SZ', '600436.SH', '688223.SH', '300033.SZ', '002241.SZ', '601166.SH', '601398.SH'}

    assert expected.issubset(set(config['default_tickers']))


def test_fourth_round_candidate_symbols_have_keyword_mapping() -> None:
    ticker_map = yaml.safe_load((ROOT / 'config' / 'tickers.yaml').read_text(encoding='utf-8'))

    for symbol in ['300498.SZ', '600436.SH', '688223.SH', '300033.SZ', '002241.SZ', '601166.SH', '601398.SH']:
        assert symbol in ticker_map
        assert ticker_map[symbol]['keywords']
