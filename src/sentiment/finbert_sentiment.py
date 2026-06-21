"""FinBERT 情绪分析占位模块。"""

from __future__ import annotations

import os
from typing import Iterable

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from src.sentiment.lexicon_sentiment import score_text_by_lexicon

_MODEL = None
_TOKENIZER = None
_MODEL_NAME = None

os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")
os.environ.setdefault("DISABLE_TELEMETRY", "1")


def load_finbert_model(model_name: str = "ProsusAI/finbert"):
    """加载 FinBERT 模型；失败时返回 None（由上层触发降级）。"""
    global _MODEL, _TOKENIZER, _MODEL_NAME
    if _MODEL is not None and _TOKENIZER is not None and _MODEL_NAME == model_name:
        return _TOKENIZER, _MODEL
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
        model = AutoModelForSequenceClassification.from_pretrained(model_name, local_files_only=True)
        model.eval()
        _TOKENIZER, _MODEL, _MODEL_NAME = tokenizer, model, model_name
        return tokenizer, model
    except Exception:
        return None


def _predict_with_lexicon_fallback(texts: Iterable[str]):
    """词典法降级：输出与 FinBERT 对齐的概率字段。"""
    outputs = []
    for text in texts:
        score = score_text_by_lexicon(text)
        if score > 0:
            pos = 0.55 + 0.35 * min(score, 1.0)
            neg = 0.15 - 0.10 * min(score, 1.0)
        elif score < 0:
            neg = 0.55 + 0.35 * min(abs(score), 1.0)
            pos = 0.15 - 0.10 * min(abs(score), 1.0)
        else:
            pos = 0.20
            neg = 0.20
        neu = max(0.0, 1.0 - pos - neg)
        label = "neutral"
        if pos > max(neu, neg):
            label = "positive"
        elif neg > max(pos, neu):
            label = "negative"
        outputs.append(
            {
                "positive_prob": float(pos),
                "neutral_prob": float(neu),
                "negative_prob": float(neg),
                "sentiment_label": label,
                "sentiment_score": float(pos - neg),
                "sentiment_model_source": "lexicon_fallback",
            }
        )
    return outputs


def _predict_with_real_finbert(texts: list[str], batch_size: int = 16):
    """真实 FinBERT 推理。"""
    loaded = load_finbert_model()
    if loaded is None:
        raise RuntimeError("FinBERT model load failed")

    tokenizer, model = loaded
    labels = ["positive", "negative", "neutral"]
    outputs = []

    with torch.no_grad():
        for i in range(0, len(texts), max(1, batch_size)):
            batch_texts = texts[i : i + max(1, batch_size)]
            inputs = tokenizer(
                batch_texts,
                padding=True,
                truncation=True,
                max_length=256,
                return_tensors="pt",
            )
            logits = model(**inputs).logits
            probs = torch.softmax(logits, dim=-1).cpu().numpy()
            for prob in probs:
                p_pos, p_neg, p_neu = float(prob[0]), float(prob[1]), float(prob[2])
                label = labels[int(prob.argmax())]
                outputs.append(
                    {
                        "positive_prob": p_pos,
                        "neutral_prob": p_neu,
                        "negative_prob": p_neg,
                        "sentiment_label": label,
                        "sentiment_score": p_pos - p_neg,
                        "sentiment_model_source": "finbert",
                    }
                )
    return outputs


def predict_sentiment(texts: Iterable[str], batch_size: int = 16):
    """优先 FinBERT 推理，失败自动降级到词典法。"""
    text_list = [str(t) for t in texts]
    if not text_list:
        return []
    try:
        return _predict_with_real_finbert(text_list, batch_size=batch_size)
    except Exception:
        return _predict_with_lexicon_fallback(text_list)
