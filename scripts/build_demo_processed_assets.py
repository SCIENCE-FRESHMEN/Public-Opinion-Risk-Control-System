"""生成课程项目默认可运行的最小标准工件。"""

from __future__ import annotations

import pathlib
import sys

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.components.data_access import TABLE_SCHEMAS
from backend.services.instrument_service import load_active_instruments
from src.features.sentiment_features import build_daily_sentiment_features

PROCESSED_DIR = ROOT / "data" / "processed"
ARTIFACT_NAMES = [
    "prices.parquet",
    "news_clean.parquet",
    "news_sentiment.parquet",
    "daily_sentiment_features.parquet",
    "risk_alerts.parquet",
    "backtest_results.parquet",
    "backtest_event_results.parquet",
]


def _business_dates() -> pd.DatetimeIndex:
    return pd.date_range("2026-04-01", "2026-04-30", freq="B")


def _build_price_path(symbol: str, dates: pd.DatetimeIndex) -> list[float]:
    if symbol == "600519.SH":
        start = 1685.0
        steps = [8.2, -12.4, -16.8, -10.5, -6.3, 5.8, 7.4, 9.6, 6.2, 11.5]
    elif symbol == "300750.SZ":
        start = 202.0
        steps = [-3.6, -5.4, -2.1, 4.8, 5.2, 3.9, -1.6, 2.8, 4.6, 3.4]
    elif symbol == "600887.SH":
        start = 28.6
        steps = [0.4, -0.1, 0.3, 0.5, 0.2, 0.1, 0.4, -0.2, 0.6, 0.3]
    elif symbol == "002594.SZ":
        start = 276.0
        steps = [-2.8, -3.2, 1.6, 2.4, 3.8, 2.1, 1.7, 2.6, 3.2, 2.5]
    else:
        start = 30.0 + (sum(ord(ch) for ch in symbol) % 90)
        steps = [((index % 5) - 2) * 0.6 + 1.0 for index in range(len(dates))]

    values: list[float] = []
    close = start
    for index, _ in enumerate(dates):
        step = steps[index] if index < len(steps) else steps[-1]
        close = round(close + step, 2)
        values.append(close)
    return values


def _build_prices(instruments: list) -> pd.DataFrame:
    dates = _business_dates()
    rows: list[dict[str, object]] = []
    for instrument in instruments:
        closes = _build_price_path(instrument.symbol, dates)
        for index, trade_date in enumerate(dates):
            close = closes[index]
            open_price = round(close - (1.2 if index % 2 == 0 else -0.8), 2)
            rows.append(
                {
                    "ticker": instrument.symbol,
                    "trade_date": trade_date,
                    "open": open_price,
                    "high": round(max(open_price, close) + max(0.8, close * 0.008), 2),
                    "low": round(min(open_price, close) - max(0.9, close * 0.009), 2),
                    "close": round(close, 2),
                    "volume": int(8_000_000 + index * 280_000 + (sum(ord(ch) for ch in instrument.symbol) % 2_500_000)),
                }
            )
    prices = pd.DataFrame(rows).sort_values(["ticker", "trade_date"]).reset_index(drop=True)
    prices["return_1d"] = prices.groupby("ticker")["close"].pct_change()
    return prices[TABLE_SCHEMAS["prices"]].copy()


def _base_news_rows(instruments: list) -> list[dict[str, object]]:
    base_dates = [
        pd.Timestamp("2026-04-08 09:20:00"),
        pd.Timestamp("2026-04-16 10:15:00"),
        pd.Timestamp("2026-04-24 14:10:00"),
    ]
    rows: list[dict[str, object]] = []
    for index, instrument in enumerate(instruments):
        for date_index, publish_timestamp in enumerate(base_dates):
            sentiment_seed = ((index + date_index) % 3) - 1
            sentiment_score = round(sentiment_seed * 0.18, 2)
            sentiment_label = "negative" if sentiment_score < -0.05 else "positive" if sentiment_score > 0.05 else "neutral"
            rows.append(
                {
                    "news_id": f"{instrument.code}_{publish_timestamp.strftime('%Y%m%d')}_{date_index}",
                    "ticker": instrument.symbol,
                    "publish_timestamp": publish_timestamp,
                    "trading_date_anchor": publish_timestamp.normalize(),
                    "title": f"{instrument.name}舆情跟踪样例 {date_index + 1}",
                    "summary": f"{instrument.name}在样例窗口内的市场讨论热度出现阶段性变化，适合作为课程项目演示数据。",
                    "source": "demo_feed",
                    "lexicon_score": sentiment_score,
                    "positive_prob": 0.55 if sentiment_label == "positive" else 0.18,
                    "neutral_prob": 0.60 if sentiment_label == "neutral" else 0.25,
                    "negative_prob": 0.62 if sentiment_label == "negative" else 0.17,
                    "sentiment_label": sentiment_label,
                    "sentiment_score": sentiment_score,
                    "sentiment_model_source": "demo_seed",
                }
            )
    return rows


def _override_news_rows() -> list[dict[str, object]]:
    return [
        {
            "news_id": "sample_maotai_0417",
            "ticker": "600519.SH",
            "publish_timestamp": pd.Timestamp("2026-04-17 09:20:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-17"),
            "title": "贵州茅台盘中波动放大",
            "summary": "贵州茅台盘中震荡加剧，资金博弈明显升温。",
            "source": "sample_feed",
            "lexicon_score": -0.08,
            "positive_prob": 0.12,
            "neutral_prob": 0.26,
            "negative_prob": 0.62,
            "sentiment_label": "negative",
            "sentiment_score": -0.24,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0422",
            "ticker": "600519.SH",
            "publish_timestamp": pd.Timestamp("2026-04-22 10:05:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-22"),
            "title": "贵州茅台渠道反馈分化",
            "summary": "贵州茅台渠道动销节奏分化，机构继续跟踪库存变化。",
            "source": "sample_feed",
            "lexicon_score": -0.05,
            "positive_prob": 0.18,
            "neutral_prob": 0.47,
            "negative_prob": 0.35,
            "sentiment_label": "neutral",
            "sentiment_score": -0.04,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0423",
            "ticker": "600519.SH",
            "publish_timestamp": pd.Timestamp("2026-04-23 11:10:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-23"),
            "title": "贵州茅台获机构持续关注",
            "summary": "贵州茅台成交活跃，消费核心资产再度成为市场焦点。",
            "source": "sample_feed",
            "lexicon_score": 0.03,
            "positive_prob": 0.29,
            "neutral_prob": 0.51,
            "negative_prob": 0.20,
            "sentiment_label": "neutral",
            "sentiment_score": 0.02,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0424",
            "ticker": "600519.SH",
            "publish_timestamp": pd.Timestamp("2026-04-24 13:45:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-24"),
            "title": "贵州茅台一季报预期走弱",
            "summary": "贵州茅台短期盈利预期承压，但核心品牌力仍被长期资金看好。",
            "source": "sample_feed",
            "lexicon_score": -0.12,
            "positive_prob": 0.08,
            "neutral_prob": 0.18,
            "negative_prob": 0.74,
            "sentiment_label": "negative",
            "sentiment_score": -0.31,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0427",
            "ticker": "600519.SH",
            "publish_timestamp": pd.Timestamp("2026-04-27 09:35:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-27"),
            "title": "贵州茅台估值修复预期升温",
            "summary": "贵州茅台在消费板块反弹中表现稳健，风险偏好边际改善。",
            "source": "sample_feed",
            "lexicon_score": 0.10,
            "positive_prob": 0.54,
            "neutral_prob": 0.31,
            "negative_prob": 0.15,
            "sentiment_label": "positive",
            "sentiment_score": 0.19,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_maotai_0428",
            "ticker": "600519.SH",
            "publish_timestamp": pd.Timestamp("2026-04-28 14:20:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-28"),
            "title": "贵州茅台延续稳健表现",
            "summary": "贵州茅台交易热度保持高位，市场继续关注基本面验证节奏。",
            "source": "sample_feed",
            "lexicon_score": 0.05,
            "positive_prob": 0.41,
            "neutral_prob": 0.41,
            "negative_prob": 0.18,
            "sentiment_label": "neutral",
            "sentiment_score": 0.04,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_catl_0416",
            "ticker": "300750.SZ",
            "publish_timestamp": pd.Timestamp("2026-04-16 14:18:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-16"),
            "title": "宁德时代电池盈利能力再受讨论",
            "summary": "宁德时代中期盈利预期出现分化，市场同时关注原材料成本与海外订单兑现。",
            "source": "sample_feed",
            "lexicon_score": -0.04,
            "positive_prob": 0.22,
            "neutral_prob": 0.46,
            "negative_prob": 0.32,
            "sentiment_label": "neutral",
            "sentiment_score": -0.02,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_catl_0423",
            "ticker": "300750.SZ",
            "publish_timestamp": pd.Timestamp("2026-04-23 10:30:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-23"),
            "title": "宁德时代海外扩产推进",
            "summary": "宁德时代海外产能布局继续推进，市场关注盈利韧性与订单质量。",
            "source": "sample_feed",
            "lexicon_score": 0.06,
            "positive_prob": 0.45,
            "neutral_prob": 0.38,
            "negative_prob": 0.17,
            "sentiment_label": "positive",
            "sentiment_score": 0.16,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_byd_0428",
            "ticker": "002594.SZ",
            "publish_timestamp": pd.Timestamp("2026-04-28 15:10:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-28"),
            "title": "比亚迪销量与出海进展受关注",
            "summary": "比亚迪销量结构持续优化，市场聚焦新车型交付与海外拓展节奏。",
            "source": "sample_feed",
            "lexicon_score": 0.07,
            "positive_prob": 0.46,
            "neutral_prob": 0.36,
            "negative_prob": 0.18,
            "sentiment_label": "positive",
            "sentiment_score": 0.18,
            "sentiment_model_source": "fallback_sample",
        },
        {
            "news_id": "sample_yili_0422",
            "ticker": "600887.SH",
            "publish_timestamp": pd.Timestamp("2026-04-22 09:42:00"),
            "trading_date_anchor": pd.Timestamp("2026-04-22"),
            "title": "伊利股份渠道动销保持平稳",
            "summary": "伊利股份终端反馈平稳，乳制品消费韧性继续得到验证。",
            "source": "sample_feed",
            "lexicon_score": 0.08,
            "positive_prob": 0.48,
            "neutral_prob": 0.34,
            "negative_prob": 0.18,
            "sentiment_label": "positive",
            "sentiment_score": 0.14,
            "sentiment_model_source": "fallback_sample",
        },
    ]


def _build_news_sentiment(instruments: list) -> pd.DataFrame:
    base_rows = _base_news_rows(instruments)
    override_rows = _override_news_rows()
    override_ids = {row["news_id"] for row in override_rows}
    override_tickers = {str(row["ticker"]) for row in override_rows}
    rows = [
        row
        for row in base_rows
        if row["news_id"] not in override_ids and str(row["ticker"]) not in override_tickers
    ]
    rows.extend(override_rows)
    frame = pd.DataFrame(rows).sort_values(["ticker", "publish_timestamp", "news_id"]).reset_index(drop=True)
    return frame[TABLE_SCHEMAS["news_sentiment"]].copy()


def _build_news_clean(news_sentiment: pd.DataFrame) -> pd.DataFrame:
    return news_sentiment[TABLE_SCHEMAS["news_clean"]].copy()


def _build_risk_alerts(instruments: list) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for index, instrument in enumerate(instruments):
        trade_date = pd.Timestamp("2026-04-22") if instrument.symbol != "002594.SZ" else pd.Timestamp("2026-04-28")
        alert_type = "news_heat_spike"
        score = round(0.48 + (index % 4) * 0.08, 2)
        if instrument.symbol == "300750.SZ":
            score = 0.72
        if instrument.symbol == "600887.SH":
            score = 0.58
        if instrument.symbol == "600519.SH":
            score = 0.81
        rows.append(
            {
                "ticker": instrument.symbol,
                "trade_date": trade_date,
                "alert_type": alert_type,
                "alert_level": "High" if score >= 0.75 else "Medium" if score >= 0.45 else "Low",
                "description": f"{instrument.name}在样例窗口内触发新闻热度激增预警。",
                "score": score,
            }
        )
    alerts = pd.DataFrame(rows).sort_values(["ticker", "trade_date"]).reset_index(drop=True)
    return alerts[TABLE_SCHEMAS["risk_alerts"]].copy()


def _build_backtest_results(instruments: list) -> pd.DataFrame:
    horizon_map = [3, 5, 10]
    rows: list[dict[str, object]] = []
    for index, instrument in enumerate(instruments):
        for horizon in horizon_map:
            base_return = 0.004 + (index % 5) * 0.002
            if instrument.symbol == "600887.SH":
                base_return = 0.011 + horizon * 0.0008
            elif instrument.symbol == "300750.SZ":
                base_return = -0.006 + horizon * 0.0005
            elif instrument.symbol == "600519.SH":
                base_return = 0.008 + horizon * 0.0003
            rows.append(
                {
                    "ticker": instrument.symbol,
                    "alert_type": "news_heat_spike",
                    "horizon": horizon,
                    "trigger_count": 1 + (index % 3),
                    "avg_return": round(base_return, 4),
                    "cum_return": round(base_return * horizon * 0.9, 4),
                    "max_drawdown": round(-abs(base_return) * 1.7, 4),
                    "negative_return_ratio": round(0.35 + (index % 4) * 0.08, 4),
                    "volatility": round(0.018 + (index % 3) * 0.004, 4),
                }
            )
    frame = pd.DataFrame(rows).sort_values(["ticker", "horizon"]).reset_index(drop=True)
    return frame[TABLE_SCHEMAS["backtest_results"]].copy()


def _build_backtest_event_results(instruments: list) -> pd.DataFrame:
    horizon_map = [3, 5, 10]
    rows: list[dict[str, object]] = []
    for index, instrument in enumerate(instruments):
        trade_date = pd.Timestamp("2026-04-22") if instrument.symbol != "002594.SZ" else pd.Timestamp("2026-04-28")
        for horizon in horizon_map:
            forward_return = 0.006 + (index % 6) * 0.002
            if instrument.symbol == "600887.SH":
                forward_return = 0.014 + horizon * 0.0009
            elif instrument.symbol == "300750.SZ":
                forward_return = -0.004 + horizon * 0.0004
            elif instrument.symbol == "600519.SH":
                forward_return = 0.009 + horizon * 0.0002
            rows.append(
                {
                    "ticker": instrument.symbol,
                    "trade_date": trade_date,
                    "alert_type": "news_heat_spike",
                    "alert_level": "High" if instrument.symbol == "600519.SH" else "Medium",
                    "horizon": horizon,
                    "avg_return": round(forward_return * 0.92, 4),
                    "cum_return": round(forward_return * horizon, 4),
                    "max_drawdown": round(-abs(forward_return) * 1.8, 4),
                    "negative_return_ratio": round(0.28 + (index % 4) * 0.06, 4),
                    "volatility": round(0.02 + (index % 4) * 0.003, 4),
                    "n_obs": horizon,
                    "forward_return": round(forward_return, 4),
                }
            )
    frame = pd.DataFrame(rows).sort_values(["trade_date", "ticker", "horizon"]).reset_index(drop=True)
    return frame[TABLE_SCHEMAS["backtest_event_results"]].copy()


def build_demo_processed_assets(output_dir: pathlib.Path) -> dict[str, int]:
    output_dir.mkdir(parents=True, exist_ok=True)
    instruments = load_active_instruments()
    prices = _build_prices(instruments)
    news_sentiment = _build_news_sentiment(instruments)
    news_clean = _build_news_clean(news_sentiment)
    daily_features = build_daily_sentiment_features(news_sentiment)
    risk_alerts = _build_risk_alerts(instruments)
    backtest_results = _build_backtest_results(instruments)
    backtest_event_results = _build_backtest_event_results(instruments)

    artifacts = {
        "prices.parquet": prices,
        "news_clean.parquet": news_clean,
        "news_sentiment.parquet": news_sentiment,
        "daily_sentiment_features.parquet": daily_features,
        "risk_alerts.parquet": risk_alerts,
        "backtest_results.parquet": backtest_results,
        "backtest_event_results.parquet": backtest_event_results,
    }
    for artifact_name, frame in artifacts.items():
        frame.to_parquet(output_dir / artifact_name, index=False)
    return {artifact_name: len(frame) for artifact_name, frame in artifacts.items()}


def main() -> None:
    summary = build_demo_processed_assets(PROCESSED_DIR)
    print("已生成默认演示工件：")
    for artifact_name in ARTIFACT_NAMES:
        print(f"- {artifact_name}: {summary.get(artifact_name, 0)} 行")


if __name__ == "__main__":
    main()
