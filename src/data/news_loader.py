"""新闻数据读取模块。"""

from __future__ import annotations

import json
import re

import pandas as pd
import requests


EM_NEWS_URL = "https://search-api-web.eastmoney.com/search/jsonp"
EM_CALLBACK = "jQuery35101792940631092459_1764599530165"


def _strip_html_tags(value: str) -> str:
    text = re.sub(r"</?em>", "", str(value or ""), flags=re.IGNORECASE)
    text = text.replace("\\u3000", "").replace("\u3000", "")
    text = text.replace("\r\n", " ").replace("\\r\\n", " ")
    return re.sub(r"\s+", " ", text).strip()


def fetch_a_share_news(symbol: str, limit: int = 10) -> pd.DataFrame:
    code = str(symbol).split(".")[0]
    inner_param = {
        "uid": "",
        "keyword": code,
        "type": ["cmsArticleWebOld"],
        "client": "web",
        "clientType": "web",
        "clientVersion": "curr",
        "param": {
            "cmsArticleWebOld": {
                "searchScope": "default",
                "sort": "default",
                "pageIndex": 1,
                "pageSize": limit,
                "preTag": "<em>",
                "postTag": "</em>",
            }
        },
    }
    params = {
        "cb": EM_CALLBACK,
        "param": json.dumps(inner_param, ensure_ascii=False),
        "_": "1764599530176",
    }
    headers = {
        "accept": "*/*",
        "referer": f"https://so.eastmoney.com/news/s?keyword={code}",
        "user-agent": "Mozilla/5.0",
    }
    response = requests.get(EM_NEWS_URL, params=params, headers=headers, timeout=20)
    response.raise_for_status()
    payload = json.loads(response.text.removeprefix(f"{EM_CALLBACK}(").removesuffix(")"))
    rows = payload.get("result", {}).get("cmsArticleWebOld", [])
    if not rows:
        return pd.DataFrame(columns=["publish_timestamp", "title", "summary", "source", "url"])

    frame = pd.DataFrame(rows)
    frame["url"] = "http://finance.eastmoney.com/a/" + frame["code"].astype(str) + ".html"
    frame = frame.rename(
        columns={
            "date": "publish_timestamp",
            "title": "title",
            "content": "summary",
            "mediaName": "source",
        }
    )
    frame["title"] = frame["title"].map(_strip_html_tags)
    frame["summary"] = frame["summary"].map(_strip_html_tags)
    frame["source"] = frame["source"].fillna("东方财富")
    return frame[["publish_timestamp", "title", "summary", "source", "url"]].copy()


def fetch_all_a_share_news(symbols: list[str], limit: int = 10) -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for symbol in symbols:
        frame = fetch_a_share_news(symbol, limit=limit)
        if frame.empty:
            continue
        frame["ticker"] = symbol
        frames.append(frame)

    if not frames:
        return pd.DataFrame(columns=["ticker", "publish_timestamp", "title", "summary", "source", "url"])
    return pd.concat(frames, ignore_index=True)


def load_news_csv(path: str) -> pd.DataFrame:
    """读取本地新闻 CSV。"""
    return pd.read_csv(path)


def match_news_to_tickers(news_df: pd.DataFrame, ticker_keywords: dict) -> pd.DataFrame:
    """根据关键词将新闻映射到股票代码。"""
    if news_df.empty:
        return news_df.copy()

    df = news_df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]

    if "title" not in df.columns:
        raise ValueError("新闻数据缺少 title 字段，无法执行关键词匹配。")

    if "summary" not in df.columns:
        df["summary"] = ""
    if "source" not in df.columns:
        df["source"] = "unknown"
    if "publish_timestamp" not in df.columns:
        if "publish_date" in df.columns:
            df["publish_timestamp"] = df["publish_date"]
        else:
            df["publish_timestamp"] = pd.Timestamp.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    text_series = (
        df["title"].fillna("").astype(str) + " " + df["summary"].fillna("").astype(str)
    ).str.lower()

    matched_tickers: list[str] = []
    for text in text_series:
        mapped = None
        for ticker, meta in ticker_keywords.items():
            keywords = [ticker] + list(meta.get("keywords", []))
            if any(str(k).lower() in text for k in keywords):
                mapped = ticker
                break
        matched_tickers.append(mapped)

    df["ticker"] = matched_tickers
    df = df[df["ticker"].notna()].copy()
    df["ticker"] = df["ticker"].astype(str).str.upper()
    return df
