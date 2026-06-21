from __future__ import annotations

import csv
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


ROOT = Path(__file__).resolve().parents[1]
FIG_DIR = ROOT / "reports" / "figures"
DATA_DIR = ROOT / "submission_final" / "data_package"
MEMBER_B_PATH = ROOT / "member_B" / "member_B_summary.csv"


plt.rcParams["font.sans-serif"] = [
    "PingFang SC",
    "Hiragino Sans GB",
    "Heiti SC",
    "SimHei",
    "Arial Unicode MS",
    "DejaVu Sans",
]
plt.rcParams["axes.unicode_minus"] = False


def ensure_dir() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)


def load_unified_events() -> tuple[int, Counter[str], Counter[str]]:
    total = 0
    source_counter: Counter[str] = Counter()
    stock_counter: Counter[str] = Counter()
    with (DATA_DIR / "unified_text_events.csv").open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            source_counter[row["source"]] += 1
            stock_key = f'{row["stock_name"]} ({row["stock_code"]})'
            stock_counter[stock_key] += 1
    return total, source_counter, stock_counter


def plot_source_distribution(source_counter: Counter[str]) -> None:
    labels_map = {
        "eastmoney_guba": "东方财富股吧",
        "sina_news": "新浪财经新闻",
        "cninfo_announcement": "巨潮资讯公告",
        "sse_announcement": "上交所公告",
    }
    labels = [labels_map.get(key, key) for key, _ in source_counter.most_common()]
    values = [value for _, value in source_counter.most_common()]

    fig, ax = plt.subplots(figsize=(8.8, 5.2))
    colors = ["#3ddbd9", "#6ea8fe", "#f7b267", "#f25f5c"]
    wedges, texts, autotexts = ax.pie(
        values,
        labels=labels,
        autopct="%1.1f%%",
        startangle=90,
        colors=colors[: len(values)],
        textprops={"fontsize": 10},
    )
    for autotext in autotexts:
        autotext.set_color("white")
        autotext.set_fontsize(10)
    ax.set_title("多源文本事件来源构成", fontsize=14, pad=14)
    fig.tight_layout()
    fig.savefig(FIG_DIR / "final_source_distribution.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def plot_source_coverage() -> None:
    status_counter: dict[str, Counter[str]] = defaultdict(Counter)
    label_map = {
        "eastmoney_guba": "股吧",
        "sina_news": "新浪新闻",
        "cninfo_announcement": "巨潮公告",
        "sse_announcement": "上交所公告",
        "tencent_realtime_quote": "腾讯行情",
    }
    with (DATA_DIR / "source_coverage_report.csv").open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            source = label_map.get(row["source"], row["source"])
            status_counter[source][row["status"]] += 1

    sources = list(status_counter.keys())
    ok_values = [status_counter[source].get("OK", 0) for source in sources]
    skip_values = [sum(v for k, v in status_counter[source].items() if k.startswith("SKIP")) for source in sources]
    zero_values = [status_counter[source].get("EMPTY", 0) for source in sources]

    fig, ax = plt.subplots(figsize=(9.2, 5.2))
    x = range(len(sources))
    ax.bar(x, ok_values, label="有效覆盖", color="#1f8a70")
    ax.bar(x, zero_values, bottom=ok_values, label="无记录", color="#f2a541")
    ax.bar(
        x,
        skip_values,
        bottom=[a + b for a, b in zip(ok_values, zero_values)],
        label="规则跳过",
        color="#8892b0",
    )
    ax.set_xticks(list(x))
    ax.set_xticklabels(sources, rotation=0)
    ax.set_ylabel("股票数量")
    ax.set_title("多源数据覆盖情况", fontsize=14, pad=14)
    ax.legend(frameon=False)
    ax.grid(axis="y", alpha=0.25, linestyle="--")
    fig.tight_layout()
    fig.savefig(FIG_DIR / "final_source_coverage.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def plot_top_stock_events(stock_counter: Counter[str]) -> None:
    top_items = stock_counter.most_common(10)
    labels = [item[0] for item in top_items][::-1]
    values = [item[1] for item in top_items][::-1]

    fig, ax = plt.subplots(figsize=(9.2, 5.8))
    ax.barh(labels, values, color="#4c78a8")
    ax.set_xlabel("文本事件条数")
    ax.set_title("多源文本事件量 Top 10 股票", fontsize=14, pad=14)
    ax.grid(axis="x", alpha=0.25, linestyle="--")
    for index, value in enumerate(values):
        ax.text(value + max(values) * 0.01, index, str(value), va="center", fontsize=9)
    fig.tight_layout()
    fig.savefig(FIG_DIR / "final_top_stock_events.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def plot_member_b_risk_summary() -> None:
    rows: list[dict[str, str]] = []
    with MEMBER_B_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows.extend(reader)

    rows.sort(key=lambda item: float(item["risk_score"]), reverse=True)
    labels = [row["stock_name"] for row in rows]
    risk_scores = [float(row["risk_score"]) for row in rows]
    sentiments = [float(row["mean_sentiment"]) for row in rows]

    fig, ax1 = plt.subplots(figsize=(8.8, 5.4))
    x = range(len(labels))
    ax1.bar(x, risk_scores, color="#ef476f", alpha=0.82, label="风险评分")
    ax1.set_ylabel("风险评分")
    ax1.set_xticks(list(x))
    ax1.set_xticklabels(labels)
    ax1.set_title("算法样例股票风险评分与平均情绪对比", fontsize=14, pad=14)
    ax1.grid(axis="y", alpha=0.22, linestyle="--")

    ax2 = ax1.twinx()
    ax2.plot(x, sentiments, color="#118ab2", marker="o", linewidth=2.2, label="平均情绪")
    ax2.set_ylabel("平均情绪")
    ax2.set_ylim(0, max(0.8, max(sentiments) + 0.05))

    lines_1, labels_1 = ax1.get_legend_handles_labels()
    lines_2, labels_2 = ax2.get_legend_handles_labels()
    ax1.legend(lines_1 + lines_2, labels_1 + labels_2, frameon=False, loc="upper right")

    fig.tight_layout()
    fig.savefig(FIG_DIR / "final_member_b_risk_summary.png", dpi=220, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    ensure_dir()
    _, source_counter, stock_counter = load_unified_events()
    plot_source_distribution(source_counter)
    plot_source_coverage()
    plot_top_stock_events(stock_counter)
    plot_member_b_risk_summary()
    print("Generated final report figures in", FIG_DIR)


if __name__ == "__main__":
    main()
