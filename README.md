# 面向上市公司舆情风控的多源中文大数据分析与研判系统

## 项目简介

本项目面向《大数据处理技术》课程结课答辩，基于原“股票舆情风险预警与回测系统”进行演进式改造，形成一套“多源数据接入 -> 清洗对齐 -> 情绪/主题/风险分析 -> LLM 研判摘要 -> 前端 Dashboard 展示”的完整课程项目链路。

系统目标不是自动荐股，而是把新闻、公告、股吧讨论、行情样例和算法结果转化为可解释的上市公司舆情风险线索，辅助完成热点事件分析、个股风险研判和答辩展示。

## 当前完成状态

当前项目处于“答辩成品收口态”，已经完成：

- 成员 A 数据包接入：统一文本事件、来源覆盖、行情报价、DuckDB 持久化样例。
- 成员 B 算法结果接入：情绪分布、主题关键词、风险评分、谣言规则、单股分析 Demo。
- 成员 C 研判链路补齐：本地 LLM 简报模板、结构化 JSON/Markdown 样例、答辩口径文件。
- 成员 D 前端整合：React 大屏、新闻页、个股详情页、A/B/C 结果融合展示。

## 技术栈口径

当前正式实现统一表述为：

- 前端：`React + TypeScript + Vite + Recharts`
- 后端：`FastAPI`
- 数据处理：`Python + Pandas + DuckDB / Parquet`
- 算法分析：`词典情绪分析 + TF-IDF/TextRank + LDA 主题簇结果 + 风险规则`
- 研判摘要：`本地 LLM Prompt 模板 / 可扩展远程大模型 API`

历史 Streamlit/Plotly 页面仅作为早期原型和数据流程验证，不作为当前正式答辩主入口。

## 快速启动

### 1. 生成默认演示工件

首次运行或发现 `data/processed/` 缺少核心 `parquet` 文件时，先执行：

```bash
python3 scripts/build_demo_processed_assets.py
```

该脚本会自动生成：

- `data/processed/prices.parquet`
- `data/processed/news_clean.parquet`
- `data/processed/news_sentiment.parquet`
- `data/processed/daily_sentiment_features.parquet`
- `data/processed/risk_alerts.parquet`
- `data/processed/backtest_results.parquet`
- `data/processed/backtest_event_results.parquet`

### 2. 启动后端

```bash
cd "/Users/pipi/Desktop/股票分析预测模型/李凯迪_2023111651_股票舆情风险预警与回测系统-提交版"
python3 -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

健康检查：

```bash
curl -s http://127.0.0.1:8000/api/meta/health
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

浏览器访问：

```text
http://127.0.0.1:5173
```

## 推荐演示顺序

1. 首页指挥大屏：展示 A 数据热度榜、焦点股、风险事件和 AI 简报。
2. 新闻页：展示 A 的真实新闻/公告/股吧数据，以及来源覆盖情报。
3. 个股详情页：展示 B 的情绪、主题、风险研判结果。
4. 回测页：展示原项目保留的历史验证能力。
5. 运行 C 的简报脚本，证明结构化研判摘要可复现生成。

## 关键命令

### 默认工件重建

```bash
python3 scripts/build_demo_processed_assets.py
```

### 成员 A 数据包复查

```bash
python3 scripts/export_submission_batch_to_duckdb.py
```

### 成员 B 算法结果复查

```bash
python3 member_B/run_member_B_pipeline.py
python3 member_B/stock_analysis_demo.py --code 600900
python3 member_B/topic_model_demo.py --code 600900
```

### 成员 C 研判简报生成

```bash
python3 llm_analyst_client.py --ticker 600900.SH
```

输出：

- `ai_brief_sample.json`
- `ai_brief_sample.md`

## 关键数据与结果文件

### 成员 A 数据

- `submission_final/data_package/unified_text_events.csv`
- `submission_final/data_package/stock_source_overview.csv`
- `submission_final/data_package/source_coverage_report.csv`
- `submission_final/data_package/tencent_realtime_quote.csv`
- `submission_final/data_package/submission_batch.duckdb`
- `submission_final/docs/data_dictionary.md`
- `submission_final/docs/data_mapping.md`

### 成员 B 算法

- `member_B/*_senti_*/sentiment_scores_summary.json`
- `member_B/*_senti_*/emotion_distribution.json`
- `member_B/*_senti_*/topics/topic_results.csv`
- `member_B/*_senti_*/topics/topic_clusters.csv`
- `member_B/*_senti_*/risk/risk_alerts.json`
- `member_B/member_B_summary.csv`

### 成员 C 文档与简报

- `briefing_template.md`
- `llm_analyst_client.py`
- `ai_brief_sample.json`
- `ai_brief_sample.md`
- `reports/stock_public_opinion_report.tex`
- `reports/ppt_outline_10pages.md`
- `reports/ppt_speech_10pages.md`

## 验证命令

```bash
pytest tests/backend/test_meta_api.py -v
pytest tests/backend/test_news_api.py -v
cd frontend && npm run test
cd frontend && npm run build
```

## 项目边界

- 本项目不追求真实全网实时爬虫，采用公开/离线数据包为主。
- MySQL 属于可选增强项，当前以 CSV + DuckDB + FastAPI 只读接口完成课程项目闭环。
- LLM 默认采用本地模板生成，保证答辩现场可复现；后续可替换为 DeepSeek/Qwen 等真实 API。
- 所有研判结果仅用于课程项目展示，不构成投资建议。
