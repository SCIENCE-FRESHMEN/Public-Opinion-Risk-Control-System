from __future__ import annotations

import streamlit as st


def apply_sentinel_theme() -> None:
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&family=Space+Grotesk:wght@400;500;700&display=swap');

        :root{
          --bg:#10131a; --surface-low:#191c22; --surface:#1d2026; --surface-high:#272a31; --surface-top:#32353c;
          --text:#e1e2eb; --muted:#c1c6d6; --primary:#adc7ff; --primary-deep:#1a73e8;
          --error:#ffb4ab; --error-deep:#b22222; --neg:#8b0000; --warning:#ff8c00; --low:#ffd700; --success:#00ced1;
          --outline:rgba(65,71,84,.35);
        }
        .stApp { background: var(--bg); color: var(--text); font-family: "Inter", sans-serif; }
        .main .block-container { max-width: 1250px; padding-top: 1.5rem; padding-bottom: 2rem; }
        h1,h2,h3,h4,h5 { font-family: "Manrope", sans-serif; color: var(--text); letter-spacing: -0.02em; }
        p,span,div,label { font-family: "Inter", sans-serif; color: var(--text); }
        .mono, code, pre, .label-tech { font-family: "Space Grotesk", sans-serif !important; }
        section[data-testid="stSidebar"] { background: #071333; border-right: 1px solid rgba(65,71,84,.25); }
        section[data-testid="stSidebar"] > div { background: linear-gradient(180deg, #071333 0%, #08183d 100%); }
        section[data-testid="stSidebar"] .stMarkdown h3 { font-family:"Manrope",sans-serif; font-size:1.05rem; font-weight:700; color:#e1e2eb; }
        .sidebar-block { background: rgba(6,13,34,.45); border: 1px solid rgba(65,71,84,.22); border-radius: 12px; padding: .8rem; margin-bottom: .7rem; }
        .sidebar-title { color:#aeb8d2; font-family:"Space Grotesk",sans-serif; font-size:.64rem; text-transform:uppercase; letter-spacing:.10em; font-weight:700; margin-bottom:.5rem; }
        section[data-testid="stSidebar"] .stSelectbox label,
        section[data-testid="stSidebar"] .stTextInput label {
          color: #9aa4c3 !important; font-size: .68rem; text-transform: uppercase; letter-spacing: .09em; font-weight: 700;
          font-family: "Space Grotesk", sans-serif;
        }
        .stSelectbox > div > div,
        .stTextInput > div > div > input {
          background: rgba(5,11,28,.9); color: var(--text); border: 1px solid rgba(65,71,84,.28); font-family: "Space Grotesk", sans-serif;
          border-radius: 8px;
        }
        section[data-testid="stSidebar"] .stSelectbox > div > div:focus-within,
        section[data-testid="stSidebar"] .stTextInput > div > div:focus-within {
          border-color: rgba(173,199,255,.55);
          box-shadow: 0 0 0 1px rgba(173,199,255,.30), 0 0 18px rgba(26,115,232,.22);
          border-radius: 8px;
        }
        section[data-testid="stSidebar"] .stButton > button {
          width:100%;
          background: linear-gradient(135deg, #2a80ff 0%, #1a73e8 100%);
          color:#ffffff;
          border:1px solid rgba(173,199,255,.28);
          border-radius:10px;
          font-family:"Inter",sans-serif;
          font-weight:600;
          font-size:.87rem;
          padding:.5rem .75rem;
          transition: all .18s ease;
        }
        section[data-testid="stSidebar"] .stButton > button:hover {
          filter: brightness(1.07);
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(26,115,232,.30);
        }
        section[data-testid="stSidebar"] .stButton > button:active {
          transform: translateY(0);
        }
        section[data-testid="stSidebar"] [data-testid="stNav"] > ul {
          gap: 4px;
        }
        section[data-testid="stSidebar"] [data-testid="stNav"] a {
          border-radius: 10px;
          padding: .48rem .62rem;
          color: #b4bed8;
          font-family:"Inter",sans-serif;
          font-size:.89rem;
          border: 1px solid transparent;
          transition: background .14s ease, border-color .14s ease, color .14s ease;
        }
        section[data-testid="stSidebar"] [data-testid="stNav"] a:hover {
          background: rgba(173,199,255,.10);
          border-color: rgba(173,199,255,.16);
          color: #d9e1f7;
        }
        section[data-testid="stSidebar"] [data-testid="stNav"] a[aria-current="page"] {
          background: linear-gradient(90deg, rgba(26,115,232,.22), rgba(26,115,232,.12));
          border-color: rgba(173,199,255,.26);
          color: #eaf0ff;
          box-shadow: inset 3px 0 0 #4f8fff;
        }
        .stMetric { background: var(--surface-high); border-radius: 10px; padding: .8rem .9rem; border: none; }
        .stMetric [data-testid="stMetricLabel"] { color: var(--muted); text-transform: uppercase; letter-spacing: .07em; font-size: .62rem; font-weight: 700; font-family:"Space Grotesk",sans-serif; }
        .stMetric [data-testid="stMetricValue"] { font-family: "Manrope", sans-serif; font-weight: 700; letter-spacing: -0.02em; }
        .stDataFrame, [data-testid="stDataFrame"] { border: 1px solid rgba(65,71,84,.16); border-radius: 10px; overflow: hidden; }
        .panel { background: var(--surface); border-radius: 10px; padding: 1rem 1.1rem; border: 1px solid rgba(65,71,84,.15); }
        .panel-low { background: var(--surface-low); border-radius: 10px; padding: 1rem 1.1rem; border: 1px solid rgba(65,71,84,.15); }
        .glass { background: rgba(54,57,64,.6); backdrop-filter: blur(16px); border: 1px solid rgba(65,71,84,.3); border-radius: 10px; padding: 1rem; }
        .caption { color: var(--muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; font-family:"Space Grotesk",sans-serif; }
        .hero-title { font-size: 2.05rem; font-weight: 800; letter-spacing: -0.03em; margin: .25rem 0; font-family:"Manrope",sans-serif; }
        .risk-hero { background: linear-gradient(135deg, rgba(178,34,34,.25), rgba(29,32,38,.9)); border-radius: 10px; padding: 1.2rem; border-left: 4px solid var(--error-deep); position: relative; overflow: hidden; }
        .risk-hero:after { content:""; width: 190px; height: 190px; border-radius:999px; background: rgba(255,180,171,.10); position:absolute; right:-70px; bottom:-70px; filter: blur(24px); }
        .kpi { font-family:"Manrope",sans-serif; font-size:2rem; font-weight:800; line-height:1.05; }
        .tag { display:inline-block; padding:.18rem .55rem; border-radius:999px; font-size:.66rem; letter-spacing:.06em; font-weight:700; }
        .tag-danger { background: rgba(147,0,10,.35); color: var(--error); }
        .tag-muted { background: rgba(50,53,60,.9); color: var(--muted); }
        .tag-ok { background: rgba(45,219,222,.16); color: var(--success); }
        .tag-warn { background: rgba(253,139,0,.18); color: var(--warning); }
        .sentinel-title { font-size: 1.95rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: .1rem; font-family:"Manrope",sans-serif; }
        .sentinel-subtitle { font-size: .68rem; color: #8b909f; text-transform: uppercase; letter-spacing: .16em; font-weight: 700; margin-bottom: .75rem; font-family:"Space Grotesk",sans-serif; }
        .asset-title { font-size: 2.1rem; font-weight: 900; letter-spacing: -0.03em; }
        .asset-price { font-family: "Manrope", sans-serif; font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; }
        .evidence-row { background: var(--surface); border-radius: 10px; padding: .95rem; border: 1px solid rgba(65,71,84,.15); margin-bottom: .55rem; }
        .evidence-meta { font-family: "Space Grotesk", sans-serif; color: var(--muted); font-size: .68rem; text-transform: uppercase; letter-spacing: .04em; }
        .anchor-note { background: rgba(50,53,60,.45); border: 1px solid rgba(173,199,255,.12); border-radius: 4px; padding: .75rem .9rem; }
        .anchor-title { color: var(--success); font-family:"Space Grotesk",sans-serif; font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
        .stTabs [data-baseweb="tab-list"] button [data-testid="stMarkdownContainer"] p { text-transform: uppercase; letter-spacing: .06em; font-size: .68rem; font-weight: 700; font-family:"Space Grotesk",sans-serif; }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_sentinel_brand() -> None:
    st.markdown(
        """
        <div>
          <div class="sentinel-title">SentimentRisk</div>
          <div class="sentinel-subtitle">Risk Management System</div>
        </div>
        """,
        unsafe_allow_html=True,
    )
