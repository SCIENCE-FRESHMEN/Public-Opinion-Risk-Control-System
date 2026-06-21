from __future__ import annotations

import pathlib
import sys

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.components.data_access import load_optional_table
from app.components.sentinel_theme import apply_sentinel_theme, render_sentinel_brand

apply_sentinel_theme()
render_sentinel_brand()

backtest_df = load_optional_table("backtest_results", date_columns=["trade_date"])
event_df = load_optional_table("backtest_event_results", date_columns=["trade_date"])

if backtest_df.empty:
    st.warning("未检测到 backtest_results.parquet，请先运行：python3 scripts/run_backtest_pipeline.py")
    st.stop()

alert_options = ["全部"] + sorted(backtest_df["alert_type"].dropna().astype(str).unique().tolist())
horizon_options = sorted(backtest_df["horizon"].dropna().astype(int).unique().tolist())

c1, c2 = st.columns([2, 2])
with c1:
    alert_type = st.selectbox("SIGNAL VECTOR", alert_options)
with c2:
    horizon = st.selectbox("EVALUATION HORIZON", horizon_options, index=min(1, len(horizon_options) - 1))

view = backtest_df.copy()
if alert_type != "全部":
    view = view[view["alert_type"] == alert_type]
view_h = view[view["horizon"] == horizon]

if view_h.empty:
    st.info("当前筛选条件无回测记录。")
    st.stop()

total_triggers = int(view_h["event_count"].sum()) if "event_count" in view_h.columns else len(view_h)
avg_return = float(view_h["avg_return"].mean()) if "avg_return" in view_h.columns else 0.0
max_drawdown = float(view_h["max_drawdown"].mean()) if "max_drawdown" in view_h.columns else 0.0
neg_ratio = float(view_h["negative_ratio"].mean()) if "negative_ratio" in view_h.columns else 0.0

st.markdown(
    """
    <div class="panel-low">
      <div class="hero-title">Signal Validation Engine</div>
      <div style="color:#c1c6d6;">Historical performance evaluation of triggered risk alerts. This module quantifies signal reliability.</div>
    </div>
    """,
    unsafe_allow_html=True,
)

k1, k2, k3, k4 = st.columns(4)
with k1:
    st.markdown(
        f"""
        <div class="panel" style="border-left:4px solid #2ddbde;">
          <div class="caption">Historical Triggers</div>
          <div class="kpi">{total_triggers:,}</div>
          <div class="label-tech" style="font-size:.68rem;">Events</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with k2:
    st.markdown(
        f"""
        <div class="panel" style="border-left:4px solid #adc7ff;">
          <div class="caption">Mean Forward Return</div>
          <div class="kpi" style="color:#adc7ff;">{avg_return:.2%}</div>
          <div class="label-tech" style="font-size:.68rem;">At T+{horizon}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with k3:
    st.markdown(
        f"""
        <div class="panel" style="border-left:4px solid #ffb4ab;">
          <div class="caption">Maximum Drawdown</div>
          <div class="kpi" style="color:#ffb4ab;">{max_drawdown:.2%}</div>
          <div class="label-tech" style="font-size:.68rem;">Worst Case</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
with k4:
    st.markdown(
        f"""
        <div class="panel" style="border-left:4px solid #ff8c00;">
          <div class="caption">Hit Rate (Negative)</div>
          <div class="kpi" style="color:#ffd700;">{neg_ratio:.1%}</div>
          <div class="label-tech" style="font-size:.68rem;">Downside Ratio</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

g1, g2 = st.columns([3, 2])
with g1:
    st.markdown("### Mean Return Trajectory")
    traj = view.groupby("horizon", as_index=False)["avg_return"].mean().sort_values("horizon")
    fig_bar = px.bar(
        traj,
        x="horizon",
        y="avg_return",
        labels={"horizon": "", "avg_return": ""},
        color="avg_return",
        color_continuous_scale=["#ffb4ab", "#32353c", "#adc7ff"],
    )
    fig_bar.update_layout(
        template="plotly_dark",
        paper_bgcolor="#1d2026",
        plot_bgcolor="#1d2026",
        height=320,
        margin=dict(l=20, r=20, t=10, b=20),
        coloraxis_showscale=False,
    )
    fig_bar.update_xaxes(showgrid=False)
    fig_bar.update_yaxes(showgrid=True, gridcolor="rgba(65,71,84,.1)")
    st.plotly_chart(fig_bar, use_container_width=True)

with g2:
    st.markdown(f"### Return Distribution (T+{horizon})")
    if event_df.empty:
        st.info("缺少事件级回测明细。")
    else:
        e = event_df.copy()
        if alert_type != "全部":
            e = e[e["alert_type"] == alert_type]
        e = e[e["horizon"] == horizon]
        if e.empty or "forward_return" not in e.columns:
            st.info("无可用分布数据。")
        else:
            fig_box = go.Figure()
            fig_box.add_trace(
                go.Box(
                    y=e["forward_return"],
                    boxmean=True,
                    marker_color="#6f7788",
                    line_color="#adc7ff",
                    fillcolor="rgba(50,53,60,.8)",
                    name=f"T+{horizon}",
                )
            )
            fig_box.update_layout(
                template="plotly_dark",
                paper_bgcolor="#1d2026",
                plot_bgcolor="#1d2026",
                height=320,
                margin=dict(l=20, r=20, t=10, b=20),
                showlegend=False,
            )
            fig_box.update_yaxes(showgrid=True, gridcolor="rgba(65,71,84,.1)")
            st.plotly_chart(fig_box, use_container_width=True)

st.markdown(
    """
    <div class="anchor-note">
      <div class="anchor-title">Anchor Date: Current Trading Calendar</div>
      <div style="color:#c1c6d6;font-size:.78rem;">
        Calculations are relative to market close of the specified trading day. This module is event-driven and does not constitute automated trading advice.
      </div>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.expander("查看回测明细表"):
    st.dataframe(view_h, use_container_width=True)
