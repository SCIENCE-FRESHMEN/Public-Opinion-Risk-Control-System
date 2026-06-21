from __future__ import annotations

import pathlib
import sys

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.components.data_access import load_optional_table, load_prices
from app.components.sentinel_theme import apply_sentinel_theme, render_sentinel_brand


def _badge(level: str) -> str:
    lv = str(level).strip().lower()
    if lv in {"high", "h"}:
        return '<span style="display:inline-block;background:#b00020;color:#fff;padding:2px 7px;border-radius:2px;font-size:.64rem;font-weight:700;">HIGH</span>'
    if lv in {"medium", "m"}:
        return '<span style="display:inline-block;background:#9f6a1b;color:#fff;padding:2px 7px;border-radius:2px;font-size:.64rem;font-weight:700;">MEDIUM</span>'
    return '<span style="display:inline-block;background:#3d4658;color:#d6dcf0;padding:2px 7px;border-radius:2px;font-size:.64rem;font-weight:700;">LOW</span>'


apply_sentinel_theme()
render_sentinel_brand()

st.markdown(
    """
    <style>
    .overview-shell { margin-top: .1rem; margin-bottom: .35rem; }
    .ov-title { font-family:Manrope,sans-serif; font-size:52px; line-height:.98; font-weight:800; letter-spacing:-0.036em; margin:0; color:#d8deef; }
    .ov-sub { margin-top:.34rem; font-family:Space Grotesk,sans-serif; font-size:12px; text-transform:uppercase; letter-spacing:.1em; color:#8b95ac; }
    .kpi-card { min-height:126px; background:linear-gradient(180deg, #2a2f3a 0%, #242a33 100%); border:1px solid rgba(65,71,84,.23); border-radius:8px; padding:15px 16px 14px; }
    .kpi-card.warn { border-left:3px solid #ffae2f; padding-left:13px; }
    .kpi-card.risk { background:linear-gradient(135deg, rgba(121,49,60,.48), rgba(48,37,45,.96)); border:1px solid rgba(255,180,171,.36); }
    .kpi-label { font-family:Space Grotesk,sans-serif; text-transform:uppercase; letter-spacing:.085em; font-size:11px; color:#94a0ba; margin-bottom:11px; }
    .kpi-value { font-family:Manrope,sans-serif; font-size:47px; line-height:.94; font-weight:800; color:#f3f6ff; letter-spacing:-0.026em; }
    .kpi-mini { font-family:Space Grotesk,sans-serif; font-size:14px; font-weight:700; color:#11c8c6; margin-left:7px; padding-bottom:7px; }
    .kpi-note { font-family:Space Grotesk,sans-serif; font-size:15px; font-weight:700; color:#ffae2f; line-height:1.15; padding-bottom:4px; }
    .kpi-meta { font-family:Space Grotesk,sans-serif; font-size:13px; color:#9ba5bf; line-height:1.05; padding-bottom:3px; }
    .risk-pill { display:inline-flex; align-items:center; gap:8px; background:#b0041e; color:#fff; font-family:Manrope,sans-serif; font-weight:800; font-size:36px; line-height:1; padding:8px 14px 10px; border-radius:2px; letter-spacing:-0.01em; }
    .risk-icon { font-size:22px; line-height:1; transform:translateY(-1px); opacity:.98; }
    .ctx-wrap { margin-top:10px; background:linear-gradient(90deg, #232935 0%, #1f2530 100%); border:1px solid rgba(65,71,84,.19); border-radius:8px; padding:14px 16px 8px; }
    .ctx-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .ctx-title { font-family:Manrope,sans-serif; font-size:35px; font-weight:700; color:#d5dbec; letter-spacing:-0.022em; }
    .ctx-right { font-family:Space Grotesk,sans-serif; font-size:11px; color:#8a94ae; text-transform:uppercase; letter-spacing:.09em; }
    .alerts-wrap { margin-top:12px; background:linear-gradient(90deg, #202734 0%, #1c232f 100%); border:1px solid rgba(65,71,84,.19); border-radius:8px; overflow:hidden; }
    .alerts-head { display:flex;justify-content:space-between;align-items:center;padding:15px 16px;background:rgba(38,44,56,.38); }
    .alerts-title { font-family:Manrope,sans-serif; font-size:35px; font-weight:700; color:#d5dbec; letter-spacing:-0.022em; }
    .alerts-link { font-family:Space Grotesk,sans-serif; font-size:11px; text-transform:uppercase; color:#8ca0d3; letter-spacing:.09em; }
    table.ov-table { width:100%; border-collapse:collapse; }
    table.ov-table thead th { text-align:left; font-family:Space Grotesk,sans-serif; font-size:11px; color:#5e6983; text-transform:uppercase; letter-spacing:.08em; font-weight:700; padding:13px 16px; }
    table.ov-table tbody td { padding:14px 16px; border-top:1px solid rgba(65,71,84,.12); color:#cad1e5; font-size:14px; line-height:1.36; vertical-align:top; }
    table.ov-table tbody tr:hover { background:rgba(89,103,136,.075); }
    .ts { color:#8a94ad; font-family:Space Grotesk,sans-serif; font-size:13px; line-height:1.35; }
    .anchor-strip { margin-top:10px; border-top:1px solid rgba(65,71,84,.2); padding-top:8px; display:flex; justify-content:space-between; align-items:center; color:#68728d; font-family:Space Grotesk,sans-serif; font-size:12px; }
    .anchor-links { display:flex; gap:14px; }
    </style>
    """,
    unsafe_allow_html=True,
)

prices_df = load_prices()
feature_df = load_optional_table("daily_sentiment_features", date_columns=["trading_date_anchor"])
alerts_df = load_optional_table("risk_alerts", date_columns=["trade_date"])

if prices_df.empty:
    st.warning("未检测到价格数据，请先运行：python3 scripts/run_data_pipeline.py")
    st.stop()

ticker_options = sorted(prices_df["ticker"].dropna().astype(str).unique().tolist())
default_ticker = st.session_state.get("ticker", ticker_options[0] if ticker_options else "")
ticker = st.selectbox("GLOBAL TICKER", ticker_options, index=ticker_options.index(default_ticker) if default_ticker in ticker_options else 0)

price_view = prices_df[prices_df["ticker"] == ticker].copy().sort_values("trade_date")
feature_view = (
    feature_df[feature_df["ticker"] == ticker].copy().sort_values("trading_date_anchor")
    if not feature_df.empty
    else pd.DataFrame()
)
alerts_view = (
    alerts_df[alerts_df["ticker"] == ticker].copy().sort_values("trade_date", ascending=False)
    if not alerts_df.empty
    else pd.DataFrame()
)

latest_price = float(price_view["close"].iloc[-1]) if not price_view.empty else 0.0
delta = float(price_view["close"].iloc[-1] / price_view["close"].iloc[-2] - 1) if len(price_view) >= 2 else 0.0
latest_feature = feature_view.iloc[-1] if not feature_view.empty else None
sentiment_score = float(latest_feature["daily_sentiment_score"]) if latest_feature is not None else 0.0
news_count = int(latest_feature["news_count"]) if latest_feature is not None else 0
negative_ratio = float(latest_feature["negative_ratio"]) if latest_feature is not None else 0.0

risk_label = "HIGH" if negative_ratio >= 0.6 else "MEDIUM" if negative_ratio >= 0.45 else "LOW"

st.markdown(
    f"""
    <div class="overview-shell">
      <div class="ov-title">{ticker}Analysis</div>
      <div class="ov-sub">◔ &nbsp;Ticker Data Current As Of {pd.Timestamp.now().strftime('%H:%M')} EST</div>
    </div>
    """,
    unsafe_allow_html=True,
)

k1, k2, k3, k4 = st.columns(4, gap="small")
with k1:
    st.markdown(
        f"""
        <div class="kpi-card">
          <div class="kpi-label">Today's Price</div>
          <div style="display:flex;align-items:flex-end;">
            <div class="kpi-value">${latest_price:.2f}</div>
            <div class="kpi-mini">{delta:+.2%}</div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with k2:
    sentiment_tag = "NEUTRAL-BEARISH" if sentiment_score < 0 else "NEUTRAL-BULLISH"
    st.markdown(
        f"""
        <div class="kpi-card warn">
          <div class="kpi-label">Daily Sentiment Score</div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:.35rem;min-height:62px;">
            <div class="kpi-value">{sentiment_score:.2f}</div>
            <div class="kpi-note">{sentiment_tag}</div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with k3:
    st.markdown(
        f"""
        <div class="kpi-card">
          <div class="kpi-label">News Heat / Volume</div>
          <div style="display:flex;align-items:flex-end;gap:.55rem;">
            <div class="kpi-value">{news_count:,}</div>
            <div class="kpi-meta">Articles<br/>(24H)</div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with k4:
    st.markdown(
        f"""
        <div class="kpi-card risk">
          <div class="kpi-label">Current Risk Status</div>
          <div style="margin-top:4px;"><span class="risk-pill"><span class="risk-icon">⚠</span>{risk_label}</span></div>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown(
    """
    <div class="ctx-wrap">
      <div class="ctx-head">
        <div class="ctx-title">30-Day Price Action Context</div>
        <div class="ctx-right">Volatility Index: Elevated</div>
      </div>
    </div>
    """,
    unsafe_allow_html=True,
)

if price_view.empty:
    st.info("暂无价格数据。")
else:
    tail = price_view.tail(30).copy()
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=tail["trade_date"],
            y=tail["close"],
            mode="lines",
            line=dict(color="#8f99af", width=2.25, shape="spline", smoothing=1.15),
            hovertemplate="%{x|%Y-%m-%d}<br>$%{y:.2f}<extra></extra>",
            name="Price",
        )
    )
    if not alerts_view.empty:
        av = alerts_view.copy()
        av["trade_date"] = pd.to_datetime(av["trade_date"], errors="coerce")
        y_map = tail.set_index(pd.to_datetime(tail["trade_date"], errors="coerce"))["close"].to_dict()
        ax = []
        ay = []
        for d in av["trade_date"]:
            yv = y_map.get(pd.to_datetime(d), None)
            if yv is not None:
                ax.append(d)
                ay.append(yv)
        if ax:
            fig.add_trace(
                go.Scatter(
                    x=ax,
                    y=ay,
                    mode="markers",
                    marker=dict(color="#b68883", size=7),
                    name="Risk",
                    hovertemplate="%{x|%Y-%m-%d}<br>Risk Spike<extra></extra>",
                )
            )
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#1f2530",
        plot_bgcolor="#1f2530",
        height=262,
        margin=dict(l=14, r=14, t=0, b=16),
        showlegend=False,
        xaxis=dict(showgrid=False, title=None, tickfont=dict(color="#5f6b85", size=9)),
        yaxis=dict(showgrid=True, gridcolor="rgba(65,71,84,.12)", zeroline=False, title=None, tickfont=dict(color="#6b748e", size=9)),
    )
    st.plotly_chart(fig, use_container_width=True)

st.markdown(
    """
    <div class="alerts-wrap">
      <div class="alerts-head">
        <div class="alerts-title">Recent Risk Alerts</div>
        <div class="alerts-link">View All Log</div>
      </div>
    """,
    unsafe_allow_html=True,
)

if alerts_view.empty:
    st.markdown('<div style="padding:1rem 1.1rem;color:#8f98b2;">暂无风险预警记录。</div></div>', unsafe_allow_html=True)
else:
    rows = []
    for _, r in alerts_view.head(8).iterrows():
        dt = pd.to_datetime(r.get("trade_date"), errors="coerce")
        dt_text = dt.strftime("%Y-%m-%d<br/>%H:%M:%S") if pd.notna(dt) else "--"
        a_type = str(r.get("alert_type", "unknown")).replace("_", " ").title()
        level = str(r.get("alert_level", "low"))
        desc = str(r.get("description", r.get("signal_reason", ""))) or "-"
        rows.append(
            f"""
            <tr>
              <td class="ts">{dt_text}</td>
              <td>{a_type}</td>
              <td>{_badge(level)}</td>
              <td>{desc}</td>
            </tr>
            """
        )

    table_html = f"""
    <table class="ov-table">
      <thead>
        <tr>
          <th>TIMESTAMP</th>
          <th>ALERT TYPE</th>
          <th>SEVERITY LEVEL</th>
          <th>DESCRIPTION</th>
        </tr>
      </thead>
      <tbody>
        {''.join(rows)}
      </tbody>
    </table>
    """
    st.markdown(table_html, unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

st.markdown(
    """
    <div class="anchor-strip">
      <div>© 2024 SentimentRisk. Trading Date Anchor disclaimer: Market data delayed by 15 mins.</div>
      <div class="anchor-links"><span>Documentation</span><span>Privacy Policy</span><span>Risk Disclosure</span></div>
    </div>
    """,
    unsafe_allow_html=True,
)
