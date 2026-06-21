"""成员 C：LLM 研判简报生成入口。

默认使用本地模板生成结构化研判简报，保证离线答辩现场可运行。
若后续接入真实大模型 API，可在 `generate_with_remote_llm` 中扩展。

示例：
python3 llm_analyst_client.py --ticker 600900.SH
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
MEMBER_B_DIR = ROOT / "member_B"
SUBMISSION_DATA_PACKAGE = ROOT / "submission_final" / "data_package"
OUTPUT_JSON = ROOT / "ai_brief_sample.json"
OUTPUT_MD = ROOT / "ai_brief_sample.md"


def normalize_code(ticker: str) -> str:
    return str(ticker).strip().split(".")[0].zfill(6)


def normalize_ticker(code: str) -> str:
    code = str(code).zfill(6)
    if code.startswith(("600", "601", "603", "605", "688", "900")):
        return f"{code}.SH"
    return f"{code}.SZ"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def find_member_b_dir(stock_code: str) -> Path | None:
    matches = sorted(MEMBER_B_DIR.glob(f"*_senti_{stock_code}"))
    return matches[0] if matches else None


def load_submission_coverage(stock_code: str) -> dict[str, Any]:
    overview_path = SUBMISSION_DATA_PACKAGE / "stock_source_overview.csv"
    if not overview_path.exists():
        return {}
    for row in read_csv_rows(overview_path):
        if str(row.get("stock_code", "")).zfill(6) == stock_code:
            return row
    return {}


def load_member_b_context(stock_code: str) -> dict[str, Any]:
    stock_dir = find_member_b_dir(stock_code)
    if stock_dir is None:
        raise FileNotFoundError(f"未找到成员 B 对 {stock_code} 的算法结果。")

    sentiment = read_json(stock_dir / "sentiment_scores_summary.json")
    emotion = read_json(stock_dir / "emotion_distribution.json")
    risk = read_json(stock_dir / "risk_summary.json")
    topics = read_csv_rows(stock_dir / "topics" / "topic_results.csv")[:8]
    return {
        "stock_dir": str(stock_dir),
        "sentiment": sentiment,
        "emotion": emotion,
        "risk": risk,
        "topics": topics,
    }


def build_context(ticker: str) -> dict[str, Any]:
    stock_code = normalize_code(ticker)
    member_b = load_member_b_context(stock_code)
    coverage = load_submission_coverage(stock_code)
    sentiment_summary = member_b["sentiment"].get("summary", {})
    emotion = member_b["emotion"]
    risk = member_b["risk"]

    return {
        "ticker": normalize_ticker(stock_code),
        "stock_code": stock_code,
        "stock_name": member_b["sentiment"].get("stock_name") or risk.get("stock_name") or coverage.get("stock_name", ""),
        "quote": float(coverage.get("quote") or 0),
        "active_source_count": sum(
            1
            for key in ["official_count", "news_count", "guba_count"]
            if int(float(coverage.get(key) or 0)) > 0
        ),
        "official_count": int(float(coverage.get("official_count") or 0)),
        "news_count": int(float(coverage.get("news_count") or 0)),
        "guba_count": int(float(coverage.get("guba_count") or 0)),
        "latest_capture_time": coverage.get("generated_at") or risk.get("generated_at") or "--",
        "mean_sentiment": float(sentiment_summary.get("mean_sentiment") or 0),
        "positive_ratio": float(emotion.get("positive", {}).get("ratio") or 0),
        "negative_ratio": float(emotion.get("negative", {}).get("ratio") or 0),
        "neutral_ratio": float(emotion.get("neutral", {}).get("ratio") or 0),
        "total_opinions": int(sentiment_summary.get("total_opinions_analyzed") or risk.get("total_opinions") or 0),
        "risk_score": float(risk.get("risk_score") or 0),
        "risk_label": risk.get("risk_label") or "未知",
        "rumor_count": int(risk.get("rumor_count") or 0),
        "triggered_rules": risk.get("triggered_rules", []),
        "risk_factors": risk.get("risk_factors", []),
        "top_topics": [
            {
                "keyword": row.get("keyword", ""),
                "score": float(row.get("combined_score") or 0),
                "frequency": int(float(row.get("frequency") or 0)),
            }
            for row in member_b["topics"]
        ],
    }


def sentiment_sentence(context: dict[str, Any]) -> str:
    score = context["mean_sentiment"]
    if score >= 0.6:
        tone = "整体偏正面"
    elif score <= 0.4:
        tone = "整体偏负面"
    else:
        tone = "整体处于中性震荡区间"
    return (
        f"平均情绪得分为 {score:.4f}，{tone}；"
        f"正面占比 {context['positive_ratio']:.1%}，负面占比 {context['negative_ratio']:.1%}。"
    )


def risk_sentence(context: dict[str, Any]) -> str:
    factors = context["risk_factors"] or ["未发现明显异常风险因素"]
    rules = context["triggered_rules"] or ["无强预警规则"]
    return (
        f"综合风险评分为 {context['risk_score']:.1f}，等级为{context['risk_label']}；"
        f"触发规则包括 {'、'.join(rules)}，主要风险因素为{factors[0]}。"
    )


def generate_local_brief(context: dict[str, Any]) -> dict[str, str]:
    topics = [item["keyword"] for item in context["top_topics"][:5] if item["keyword"]]
    source_text = (
        f"样本覆盖官方公告 {context['official_count']} 条、新闻 {context['news_count']} 条、"
        f"股吧讨论 {context['guba_count']} 条，共 {context['total_opinions']} 条算法样本。"
    )
    rumor_text = (
        f"当前检测到 {context['rumor_count']} 条疑似谣言样本。"
        if context["rumor_count"] > 0
        else "当前未发现明显谣言样本集中扩散。"
    )
    topic_text = f"核心讨论主题集中在 {'、'.join(topics)}。" if topics else "当前主题词较分散。"
    return {
        "headline": f"{context['stock_name']}舆情风险研判简报",
        "summary": f"{source_text}{topic_text}",
        "sentiment_view": sentiment_sentence(context),
        "risk_view": f"{risk_sentence(context)}{rumor_text}",
        "action_view": "后续建议重点跟踪舆情量是否继续放大、风险规则是否连续触发，以及公告/新闻侧是否出现新的实质性事件。不构成投资建议，仅用于课程项目中的风险辅助研判展示。",
    }


def write_outputs(context: dict[str, Any], brief: dict[str, str], json_path: Path, md_path: Path) -> None:
    payload = {
        "input_context": context,
        "brief": brief,
        "generation_mode": "local_template",
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(
        "\n".join(
            [
                f"# {brief['headline']}",
                "",
                f"## 样本摘要\n{brief['summary']}",
                "",
                f"## 情绪判断\n{brief['sentiment_view']}",
                "",
                f"## 风险提示\n{brief['risk_view']}",
                "",
                f"## 跟踪建议\n{brief['action_view']}",
                "",
            ]
        ),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="生成结构化个股舆情研判简报。")
    parser.add_argument("--ticker", default="600900.SH", help="股票代码，例如 600900.SH 或 000539.SZ。")
    parser.add_argument("--json-output", default=str(OUTPUT_JSON), help="JSON 输出路径。")
    parser.add_argument("--md-output", default=str(OUTPUT_MD), help="Markdown 输出路径。")
    args = parser.parse_args()

    context = build_context(args.ticker)
    brief = generate_local_brief(context)
    write_outputs(context, brief, Path(args.json_output), Path(args.md_output))

    print(json.dumps(brief, ensure_ascii=False, indent=2))
    print(f"JSON 简报已写入: {args.json_output}")
    print(f"Markdown 简报已写入: {args.md_output}")


if __name__ == "__main__":
    main()
