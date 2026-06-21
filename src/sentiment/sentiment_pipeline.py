"""情绪分析流程串联模块。"""

from __future__ import annotations

import pandas as pd

from src.sentiment.finbert_sentiment import predict_sentiment
from src.sentiment.lexicon_sentiment import score_text_by_lexicon


def run_sentiment_pipeline(news_df: pd.DataFrame, method: str = "hybrid") -> pd.DataFrame:
    """对新闻逐条打分，输出新闻级情绪结果。"""
    if news_df.empty:
        return pd.DataFrame(
            columns=[
                "news_id",
                "ticker",
                "publish_timestamp",
                "title",
                "summary",
                "source",
                "lexicon_score",
                "positive_prob",
                "neutral_prob",
                "negative_prob",
                "sentiment_label",
                "sentiment_score",
                "sentiment_model_source",
            ]
        )

    df = news_df.copy()
    df["publish_timestamp"] = pd.to_datetime(df["publish_timestamp"], errors="coerce")
    df["text_for_sentiment"] = (
        df["title"].fillna("").astype(str) + " " + df["summary"].fillna("").astype(str)
    ).str.strip()
    df["lexicon_score"] = df["text_for_sentiment"].apply(score_text_by_lexicon)

    finbert_like = predict_sentiment(df["text_for_sentiment"].tolist())
    finbert_df = pd.DataFrame(finbert_like)
    out = pd.concat([df.reset_index(drop=True), finbert_df], axis=1)

    if method == "hybrid":
        # 对中文财经文本，词典法往往比英文 FinBERT 的零样本推断更可靠。
        strong_negative = out["lexicon_score"] <= -0.12
        strong_positive = out["lexicon_score"] >= 0.12

        out.loc[strong_negative, "sentiment_label"] = "negative"
        out.loc[strong_negative, "sentiment_score"] = out.loc[strong_negative, "lexicon_score"].clip(upper=-0.12)
        out.loc[strong_negative, "negative_prob"] = out.loc[strong_negative, "negative_prob"].clip(lower=0.70)
        out.loc[strong_negative, "positive_prob"] = out.loc[strong_negative, "positive_prob"].clip(upper=0.10)
        out.loc[strong_negative, "neutral_prob"] = 1.0 - out.loc[strong_negative, "positive_prob"] - out.loc[strong_negative, "negative_prob"]

        out.loc[strong_positive, "sentiment_label"] = "positive"
        out.loc[strong_positive, "sentiment_score"] = out.loc[strong_positive, "lexicon_score"].clip(lower=0.12)
        out.loc[strong_positive, "positive_prob"] = out.loc[strong_positive, "positive_prob"].clip(lower=0.70)
        out.loc[strong_positive, "negative_prob"] = out.loc[strong_positive, "negative_prob"].clip(upper=0.10)
        out.loc[strong_positive, "neutral_prob"] = 1.0 - out.loc[strong_positive, "positive_prob"] - out.loc[strong_positive, "negative_prob"]

        out["neutral_prob"] = out["neutral_prob"].clip(lower=0.0, upper=1.0)
        out["sentiment_model_source"] = out["sentiment_model_source"].where(~(strong_negative | strong_positive), "hybrid_cn_lexicon")

    if method == "lexicon":
        out["sentiment_score"] = out["lexicon_score"]
        out["sentiment_label"] = out["sentiment_score"].apply(
            lambda x: "positive" if x > 0.05 else ("negative" if x < -0.05 else "neutral")
        )
        out["positive_prob"] = out["sentiment_score"].apply(lambda x: max(0.0, x))
        out["negative_prob"] = out["sentiment_score"].apply(lambda x: max(0.0, -x))
        out["neutral_prob"] = 1.0 - out["positive_prob"] - out["negative_prob"]

    cols = [
        "news_id",
        "ticker",
        "publish_timestamp",
        "title",
        "summary",
        "source",
        "lexicon_score",
        "positive_prob",
        "neutral_prob",
        "negative_prob",
        "sentiment_label",
        "sentiment_score",
        "sentiment_model_source",
    ]
    return out[cols].copy()
