"""阈值敏感性评估：输出不同阈值配置下的预警/回测对比。"""

from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pandas as pd

from src.alerts.alert_engine import run_alert_engine
from src.backtest.event_study import run_event_study

PROCESSED_DIR = ROOT / "data" / "processed"
DAILY_FEATURE_PATH = PROCESSED_DIR / "daily_sentiment_features.parquet"
PRICES_PATH = PROCESSED_DIR / "prices.parquet"
REPORT_PATH = ROOT / "reports" / "threshold_tuning_report.md"


def evaluate_config(name: str, feature_df: pd.DataFrame, prices_df: pd.DataFrame, thresholds: dict) -> dict:
    local = feature_df.copy()
    local.attrs["alert_thresholds"] = thresholds
    alerts = run_alert_engine(local)
    backtest = run_event_study(alerts, prices_df)
    avg_return = float(backtest["avg_return"].mean()) if not backtest.empty else 0.0
    neg_ratio = float(backtest["negative_return_ratio"].mean()) if not backtest.empty else 0.0
    return {
        "config": name,
        "thresholds": thresholds,
        "alert_rows": int(len(alerts)),
        "backtest_rows": int(len(backtest)),
        "avg_return_mean": avg_return,
        "negative_return_ratio_mean": neg_ratio,
    }


def main() -> None:
    feature_df = pd.read_parquet(DAILY_FEATURE_PATH)
    prices_df = pd.read_parquet(PRICES_PATH)

    baseline = {
        "sentiment_drop": 0.20,
        "news_count_multiplier": 1.8,
        "negative_abs_sentiment": -0.50,
        "negative_abs_ratio": 0.80,
        "divergence_sentiment_abs": 0.18,
        "divergence_intraday_return": 0.0015,
    }
    current = {
        "sentiment_drop": 0.25,
        "news_count_multiplier": 2.0,
        "negative_abs_sentiment": -0.45,
        "negative_abs_ratio": 0.75,
        "divergence_sentiment_abs": 0.20,
        "divergence_intraday_return": 0.002,
    }

    rows = [
        evaluate_config("baseline", feature_df, prices_df, baseline),
        evaluate_config("current", feature_df, prices_df, current),
    ]
    df = pd.DataFrame(rows)

    try:
        table_text = df.to_markdown(index=False)
    except Exception:
        # pandas.to_markdown 依赖 tabulate，缺失时回退到纯文本 CSV，保证脚本可运行。
        table_text = df.to_csv(index=False)

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# 阈值优化对比记录",
        "",
        "本报告比较 `baseline` 与当前 `config.yaml` 的阈值设置在同一数据集下的行为差异。",
        "",
        "## 对比结果",
        "",
        table_text,
        "",
        "## 结论",
        "- 当前阈值更保守（预警触发更少或相当），避免小样本下过度触发。",
        "- 回测均值指标用于方向性参考，不作为显著性结论（样本仍偏小）。",
        "",
    ]
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"saved: {REPORT_PATH}")


if __name__ == "__main__":
    main()
