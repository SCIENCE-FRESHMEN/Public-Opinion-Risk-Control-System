"""词典法情绪分析占位模块。"""

from __future__ import annotations

import re


POSITIVE_WORDS = {
    "gain",
    "growth",
    "beat",
    "surge",
    "record",
    "strong",
    "up",
    "bullish",
    "rebound",
    "upgrade",
    "improve",
    "改善",
    "修复",
    "提升",
    "增长",
    "回暖",
    "向好",
    "利好",
    "超预期",
}
NEGATIVE_WORDS = {
    "drop",
    "fall",
    "miss",
    "weak",
    "down",
    "bearish",
    "pressure",
    "risk",
    "decline",
    "cut",
    "downgrade",
    "loss",
    "承压",
    "下调",
    "走弱",
    "担忧",
    "风险",
    "波动",
    "压力",
    "价格战",
    "库存",
    "敞口",
    "负面",
}


def score_text_by_lexicon(text: str) -> float:
    """返回简单词典法情绪分数（[-1,1]）。"""
    raw_text = str(text).lower()
    words = raw_text.replace("/", " ").replace("-", " ").split()
    chinese_chunks = re.findall(r"[\u4e00-\u9fff]+", raw_text)
    tokens = words + chinese_chunks
    if not tokens:
        return 0.0

    pos = sum(1 for token in tokens if any(word in token for word in POSITIVE_WORDS))
    neg = sum(1 for token in tokens if any(word in token for word in NEGATIVE_WORDS))
    total = pos + neg
    if total == 0:
        return 0.0
    raw = (pos - neg) / total
    return float(max(-1.0, min(1.0, raw)))
