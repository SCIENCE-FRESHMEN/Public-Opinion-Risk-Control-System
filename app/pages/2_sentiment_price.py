from __future__ import annotations

import pathlib
import sys

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.components.data_access import load_optional_table, load_prices
from app.components.sentinel_theme import apply_sentinel_theme, render_sentinel_brand

apply_sentinel_theme()
render_sentinel_brand()

prices_df = load_prices()
features_df = load_optional_table("daily_sentiment_features", date_columns=["trading_date_anchor"])
alerts_df = load_optional_table("risk_alerts", date_columns=["trade_date"])

if prices_df.empty:
    st.warning("未检测到价格数据，请先运行：python3 scripts/run_data_pipeline.py")
    st.stop()

ticker_options = sorted(prices_df["ticker"].dropna().astype(str).unique().tolist())
ticker = st.selectbox("GLOBAL TICKER", ticker_options, key="sp_ticker_v2")

price_view = prices_df[prices_df["ticker"] == ticker].copy().sort_values("trade_date")
price_view["trade_date"] = pd.to_datetime(price_view["trade_date"], errors="coerce")
feat_view = (
    features_df[features_df["ticker"] == ticker].copy().sort_values("trading_date_anchor")
    if not features_df.empty
    else pd.DataFrame()
)

if feat_view.empty:
    st.info("缺少 daily_sentiment_features.parquet，无法绘制联动图。")
    st.stop()

chart_df = feat_view.merge(
    price_view[["trade_date", "close"]],
    left_on="trading_date_anchor",
    right_on="trade_date",
    how="left",
)

st.markdown(
    f"""
    <div class="panel-low">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="hero-title">Sentiment &amp; Price Linkage</div>
          <div style="color:#c1c6d6;">Synchronized analysis of market price action against entity-specific news sentiment and volume.</div>
        </div>
        <div style="display:flex;gap:8px;">
          <span class="tag tag-muted">TICKER: {ticker}</span>
          <span class="tag tag-ok">SECTOR: TECH</span>
        </div>
      </div>
    </div>
    """,
    unsafe_allow_html=True,
)

s1, s2 = st.columns(2)
with s1:
    avg_sent = float(chart_df["daily_sentiment_score"].tail(10).mean()) if "daily_sentiment_score" in chart_df.columns else 0.0
    st.markdown(
        f"""
        <div class="panel">
          <div class="caption">Avg Sentiment</div>
          <div class="kpi" style="color:#b22222;">{avg_sent:.2f}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with s2:
    neg_ratio = float(chart_df["negative_ratio"].tail(10).mean()) if "negative_ratio" in chart_df.columns else 0.0
    status = "High" if neg_ratio >= 0.6 else ("Medium" if neg_ratio >= 0.45 else "Low")
    color = "#b22222" if status == "High" else ("#ff8c00" if status == "Medium" else "#ffd700")
    st.markdown(
        f"""
        <div class="panel">
          <div class="caption">Risk Status</div>
          <div class="kpi" style="color:{color};">{status}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

fig = make_subplots(
    rows=3,
    cols=1,
    shared_xaxes=True,
    vertical_spacing=0.04,
    row_heights=[0.48, 0.28, 0.24],
)
fig.add_trace(
    go.Scatter(
        x=chart_df["trading_date_anchor"],
        y=chart_df["close"],
        mode="lines",
        name="Price Action",
        line=dict(color="#8d95a8", width=2),
    ),
    row=1,
    col=1,
)
fig.add_trace(
    go.Scatter(
        x=chart_df["trading_date_anchor"],
        y=chart_df["daily_sentiment_score"],
        mode="lines",
        name="Daily Sentiment",
        line=dict(color="#c1c6d6", width=1.8),
        fill="tozeroy",
        fillcolor="rgba(45,219,222,.13)",
    ),
    row=2,
    col=1,
)
fig.add_trace(
    go.Bar(
        x=chart_df["trading_date_anchor"],
        y=chart_df["news_count"],
        name="News Volume Heat",
        marker_color=[
            "#b22222" if x >= chart_df["news_count"].quantile(0.9) else "#fd8b00" if x >= chart_df["news_count"].quantile(0.75) else "#4a5161"
            for x in chart_df["news_count"].fillna(0)
        ],
    ),
    row=3,
    col=1,
)

if not alerts_df.empty:
    av = alerts_df[alerts_df["ticker"] == ticker].copy()
    if not av.empty:
        av["trade_date"] = pd.to_datetime(av["trade_date"], errors="coerce")
        px_map = chart_df.set_index("trading_date_anchor")["close"].to_dict()
        ax = []
        ay = []
        for d in av["trade_date"]:
            y = px_map.get(pd.to_datetime(d), None)
            if y is not None:
                ax.append(d)
                ay.append(y)
        if ax:
            fig.add_trace(
                go.Scatter(
                    x=ax,
                    y=ay,
                    mode="markers",
                    marker=dict(color="#b22222", size=7),
                    name="Alert Spike",
                ),
                row=1,
                col=1,
            )

fig.update_layout(
    template="plotly_dark",
    paper_bgcolor="#1d2026",
    plot_bgcolor="#1d2026",
    height=620,
    margin=dict(l=20, r=20, t=20, b=20),
    legend=dict(orientation="h", yanchor="bottom", y=1.01, x=0.0),
)
fig.update_xaxes(showgrid=True, gridcolor="rgba(65,71,84,.1)")
fig.update_yaxes(showgrid=True, gridcolor="rgba(65,71,84,.1)")
st.plotly_chart(fig, use_container_width=True)

st.markdown(
    """
    <div class="anchor-note">
      <div class="anchor-title">Anchor Date</div>
      <div style="color:#c1c6d6;font-size:.78rem;">Calculations are relative to market close of the specified trading day.</div>
    </div>
    """,
    unsafe_allow_html=True,
)
