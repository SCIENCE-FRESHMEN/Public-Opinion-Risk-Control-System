import pathlib
import sys
import streamlit as st
import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP_DIR = ROOT / "app"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from app.components.sentinel_theme import apply_sentinel_theme, render_sentinel_brand

CONFIG_PATH = ROOT / "config" / "config.yaml"
PROCESSED_DIR = ROOT / "data" / "processed"


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def main():
    config = load_config()
    st.set_page_config(page_title="SentimentRisk | 股票舆情风险预警系统", layout="wide")
    apply_sentinel_theme()
    render_sentinel_brand()

    with st.sidebar:
        st.markdown("### 控制台")
        st.markdown('<div class="sidebar-block"><div class="sidebar-title">Global Filters</div>', unsafe_allow_html=True)
        ticker = st.selectbox("股票", config["default_tickers"])
        start_date = st.text_input("开始日期", config["start_date"])
        end_date = st.text_input("结束日期", config["end_date"])
        st.button("Apply Global Filter", use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)
        st.session_state["ticker"] = ticker
        st.session_state["start_date"] = start_date
        st.session_state["end_date"] = end_date
        st.markdown(
            '<div class="sidebar-block"><div class="sidebar-title">System Phase</div><div class="mono" style="color:#d9e1f7;">Week 4 / Final UI</div></div>',
            unsafe_allow_html=True,
        )

    prices_file = PROCESSED_DIR / "prices.parquet"
    news_file = PROCESSED_DIR / "news_clean.parquet"
    db_file = PROCESSED_DIR / "market_data.duckdb"
    sentiment_file = PROCESSED_DIR / "news_sentiment.parquet"
    daily_feature_file = PROCESSED_DIR / "daily_sentiment_features.parquet"

    st.markdown('<div class="panel-low"><div class="caption">System Status</div><div class="hero-title">SentimentRisk Pipeline Ready</div><div style="color:#c1c6d6;">第 4 周完成态：阈值优化、流程固化、偏误检查、前端解释链路均已接入。</div></div>', unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("当前股票", ticker)
    col2.metric("开始日期", start_date)
    col3.metric("结束日期", end_date)
    col4.metric("系统阶段", "Week 4")

    s1, s2, s3, s4, s5 = st.columns(5)
    s1.metric("prices.parquet", "已生成" if prices_file.exists() else "未生成")
    s2.metric("news_clean.parquet", "已生成" if news_file.exists() else "未生成")
    s3.metric("market_data.duckdb", "已生成" if db_file.exists() else "未生成")
    s4.metric("news_sentiment.parquet", "已生成" if sentiment_file.exists() else "未生成")
    s5.metric(
        "daily_sentiment_features.parquet",
        "已生成" if daily_feature_file.exists() else "未生成",
    )

    st.markdown("### 页面导航")
    st.markdown(
        """
        <div class="panel">
        <div class="caption">Dashboard Sections</div>
        1) Overview · 2) Sentiment & Price · 3) News Drill-down · 4) Backtest.
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.caption("注：本系统已启用 Trading Date Anchor，仅使用交易时点前可得信息以降低看前偏误。")


if __name__ == "__main__":
    main()
