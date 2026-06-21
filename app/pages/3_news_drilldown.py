from __future__ import annotations

import pathlib
import sys

import pandas as pd
import streamlit as st
from wordcloud import WordCloud

ROOT = pathlib.Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.components.data_access import load_news_sentiment
from app.components.sentinel_theme import apply_sentinel_theme, render_sentinel_brand

apply_sentinel_theme()
render_sentinel_brand()

news_df = load_news_sentiment()
if news_df.empty:
    st.warning("未检测到 news_sentiment.parquet，请先运行：python3 scripts/run_sentiment_pipeline.py")
    st.stop()

ticker_options = sorted(news_df["ticker"].dropna().astype(str).unique().tolist())
ticker = st.selectbox("TARGET ENTITY", ticker_options, key="news_ticker_v2")

subset = news_df[news_df["ticker"] == ticker].copy().sort_values("publish_timestamp", ascending=False)
date_options = sorted(subset["publish_timestamp"].dt.date.dropna().unique().tolist())
if not date_options:
    st.info("当前股票暂无新闻数据。")
    st.stop()
selected_date = st.selectbox("ALERT DATE", date_options, key="news_date_v2")
day_news = subset[subset["publish_timestamp"].dt.date == selected_date].copy()

st.markdown(
    """
    <div class="panel-low">
      <div class="hero-title">Alert Analysis</div>
      <div style="color:#c1c6d6;">Investigating negative sentiment spike driven by legal proceedings.</div>
    </div>
    """,
    unsafe_allow_html=True,
)

left, right = st.columns([8, 4])
with left:
    st.markdown(
        f"""
        <div class="panel-low">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div class="hero-title" style="font-size:1.35rem;">Core News Feed</div>
            <span class="tag tag-muted">{len(day_news)} Items Filtered</span>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if day_news.empty:
        st.info("该日期无新闻记录。")
    else:
        for _, row in day_news.head(12).iterrows():
            label = str(row.get("sentiment_label", "neutral")).lower()
            conf = (
                float(row.get("negative_prob", 0.0))
                if label == "negative"
                else float(row.get("positive_prob", 0.0))
                if label == "positive"
                else float(row.get("neutral_prob", 0.0))
            )
            tag = "tag-danger" if label == "negative" else ("tag-ok" if label == "positive" else "tag-muted")
            ts = pd.to_datetime(row.get("publish_timestamp"), errors="coerce")
            ts_txt = ts.strftime("%H:%M UTC") if pd.notna(ts) else "--"
            src = str(row.get("source", "UNKNOWN")).upper()
            title = str(row.get("title", ""))[:140]
            st.markdown(
                f"""
                <div class="evidence-row">
                  <div style="display:flex;justify-content:space-between;gap:8px;">
                    <div style="font-size:1.02rem;font-weight:600;line-height:1.35;">{title}</div>
                    <div style="text-align:right;min-width:86px;">
                      <span class="tag {tag}">{label.title()}</span>
                      <div class="label-tech" style="font-size:.72rem;margin-top:.25rem;">{conf:.0%} CONFIDENCE</div>
                    </div>
                  </div>
                  <div class="evidence-meta" style="margin-top:.45rem;">{src} · {ts_txt}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

with right:
    neg_ratio = float((day_news["sentiment_label"] == "negative").mean()) if len(day_news) else 0.0
    st.markdown("### ")
    k1, k2 = st.columns(2)
    with k1:
        st.markdown(
            f"""
            <div class="panel" style="border-left:4px solid #b22222;">
              <div class="caption">Negative Volume</div>
              <div class="kpi" style="color:#b22222;">{neg_ratio:.0%}</div>
              <div class="label-tech" style="font-size:.68rem;">vs 30d avg</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with k2:
        st.markdown(
            f"""
            <div class="panel" style="border-left:4px solid #adc7ff;">
              <div class="caption">Total Signals</div>
              <div class="kpi">{len(day_news):,}</div>
              <div class="label-tech" style="font-size:.68rem;">Aggregated sources</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("### Key Negative Drivers")
    corpus = " ".join(day_news["title"].fillna("").astype(str).tolist() + day_news["summary"].fillna("").astype(str).tolist())
    if corpus.strip():
        wc = WordCloud(
            width=900,
            height=360,
            background_color="#191c22",
            colormap="Reds",
            max_words=30,
            collocations=False,
        ).generate(corpus)
        st.image(wc.to_array(), use_container_width=True)
    else:
        st.info("当前新闻文本不足以生成关键词云。")

st.markdown(
    f"""
    <div class="anchor-note">
      <div class="anchor-title">Anchor Date: {selected_date}</div>
      <div style="color:#c1c6d6;font-size:.78rem;">Calculations are relative to market close of the specified trading day. Alert parameters locked.</div>
    </div>
    """,
    unsafe_allow_html=True,
)
