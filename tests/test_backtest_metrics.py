import pandas as pd

from src.backtest.metrics import max_drawdown


def test_max_drawdown_placeholder():
    assert callable(max_drawdown)


def test_max_drawdown_negative_for_drop_sequence():
    returns = pd.Series([0.05, -0.10, -0.05, 0.02])
    val = max_drawdown(returns)
    assert val < 0
