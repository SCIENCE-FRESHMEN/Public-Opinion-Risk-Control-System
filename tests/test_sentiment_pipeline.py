import pandas as pd

from src.sentiment.lexicon_sentiment import score_text_by_lexicon
from src.sentiment.sentiment_pipeline import run_sentiment_pipeline


def test_score_text_by_lexicon_detects_chinese_negative_finance_terms() -> None:
    text = "贵州茅台渠道库存承压，机构下调短期增速预测，市场担忧风险继续升温。"

    assert score_text_by_lexicon(text) < 0


def test_run_sentiment_pipeline_marks_chinese_negative_news_as_negative() -> None:
    news_df = pd.DataFrame(
        [
            {
                "news_id": "n1",
                "ticker": "600519.SH",
                "publish_timestamp": "2026-04-10 09:10:00",
                "title": "贵州茅台一季报预期走弱",
                "summary": "多家机构下调短期增速预测，负面情绪升温，市场担忧渠道库存承压。",
                "source": "sample_feed",
            }
        ]
    )

    out = run_sentiment_pipeline(news_df, method="hybrid")

    assert len(out) == 1
    assert float(out.iloc[0]["lexicon_score"]) < 0
    assert str(out.iloc[0]["sentiment_label"]) == "negative"
    assert float(out.iloc[0]["sentiment_score"]) < 0
