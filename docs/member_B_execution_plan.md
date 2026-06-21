# 成员 B 执行计划

## 目标定位
你负责算法分析与风控结果落地，核心任务是让项目从“词云展示”升级为“可以解释的文本分析系统”。你要完成情绪、主题、风险三条线，优先保证结果文件可展示、可复查。

你的工作要服务整条链路：

多源数据 -> 清洗对齐 -> 情绪/主题/风险分析 -> 研判摘要 -> 前端展示

## 总目标
- 完成一条可讲清的数据链路。
- 每周都有可落地文件。
- 每个人都有独立产出。
- 最后能直接用于答辩和提交。

## 你的分工边界
- 只负责分析结果能不能算出来、能不能解释。
- 先保证情绪、主题、风险这三件事成立，再谈高级模型。
- 不负责前端视觉、不负责 PPT 排版。
- 不把时间浪费在无必要的重训练上，优先保证可运行与可展示。
- 技术栈口径硬约束：全组所有涉及前端的文档、报告、PPT、答辩稿，一律禁止把当前实现写成 Vue / Element Plus / ECharts，统一口径为 `React + Vite + Recharts + FastAPI`。

## 四周执行表

### 第 1 周：情绪分析主链路跑通
紧急任务（5月21日-5月24日）：
- 优先配合成员 C，在 5 月 24 日团队作业 1 DDL 前提供“情绪分析与风险规则”说明素材。
- 素材必须能放入阶段性报告，说明当前已有词典法 / FinBERT 降级逻辑、预警规则、后续主题/谣言模块计划。
- 5 月 24 日后，再继续整理脚本与情绪结果样例。

任务：
- 跑通当前情绪分析主链路。
- 确认词典法 / FinBERT 降级逻辑。
- 整理情绪标签字段。
- 输出第一版情绪结果样例。

重点文件：
- `src/sentiment/finbert_sentiment.py`
- `src/sentiment/lexicon_sentiment.py`
- `src/sentiment/sentiment_pipeline.py`
- `data/processed/news_sentiment.parquet`

验收要求：
- 能明确说明情绪分数是怎么来的。
- 能说明 FinBERT 失败时如何降级。
- 能输出可供前端读取的情绪字段。

### 第 2 周：主题抽取补强
任务：
- 加入主题抽取能力。
- 先做可落地的关键词 / TF-IDF / TextRank。
- 再视时间补一个轻量 LDA。
- 输出主题结果文件，明确 `topic_keywords_report.md` 或 `topic_results.csv` 是你的独立产出。
- 第 2 周周五前必须交付给成员 A 和成员 D，用于数据说明与前端联动。

重点文件：
- `src/visualization/wordcloud_utils.py`
- `src/features/sentiment_features.py`
- `topic_keywords_report.md`
- `topic_results.csv`

验收要求：
- 能从文本中提炼出当前讨论焦点。
- 能区分“关键词展示”和“真正主题建模”。
- 结果能供前端联动页展示。

### 第 3 周：风险识别与预警补强
任务：
- 完成风险识别部分。
- 做谣言样本标记、负面舆情占比、异常讨论识别。
- 整理成可展示结果表。

重点文件：
- `src/alerts/alert_engine.py`
- `src/alerts/rules.py`
- `data/processed/risk_alerts.parquet`
- `rumor_sample_mapping.md`

验收要求：
- 能说明哪些规则触发风险。
- 能解释风险标签为什么是这个值。
- 能输出前端可渲染的风险字段。

### 第 4 周：测试、串联与稳定性
任务：
- 核对所有算法输出文件是否能串起来。
- 补测试或演示脚本。
- 保证展示时不空白。

重点文件：
- `tests/test_sentiment_pipeline.py`
- `tests/test_alert_rules.py`
- `tests/test_backtest_metrics.py`
- `tests/test_event_study.py`

验收要求：
- 主流程一键能跑。
- 结果文件命名统一。
- 输出字段稳定，不因小改动导致前端崩溃。

## 每周验收文件

### 第 1 周验收
- 成员 A 负责：`docs/data_dictionary.md`
- 成员 A 负责：`docs/data_mapping.md` 草案
- 成员 A 负责：`data/processed/news_clean.parquet`、`data/processed/prices.parquet` 的样例输出说明
- 成员 B 负责：`data/processed/news_sentiment.parquet` 的样例输出说明
- 成员 C 负责：`reports/project_report.md` 第一版
- 成员 D 负责：`frontend/` 首页和总览页可正常展示，并提供阶段性大屏截图

### 第 2 周验收
- 成员 A 负责：`docs/data_mapping.md` 定稿
- 成员 A 负责：`docs/rumor_sample_mapping.md`
- 成员 B 负责：`topic_keywords_report.md` 或 `topic_results.csv`
- 成员 C 负责：`briefing_template.md` 与 `reports/project_report.md` 中“方法设计”章节
- 成员 D 负责：前端新闻页/联动页能显示主题和风险标签

### 第 3 周验收
- 成员 A 负责：轻量持久层导出或缓存说明文件
- 成员 B 负责：`risk_alerts.parquet`、`backtest_results.parquet`、`backtest_event_results.parquet`
- 成员 C 负责：`llm_analyst_client.py` 或简报模板生成脚本，`ai_brief_sample.json` 或 `ai_brief_sample.md`
- 成员 D 负责：前端大屏可截图，简报卡已出现

### 第 4 周验收
- 成员 A 负责：提交版数据文件清点和数据复现说明
- 成员 B 负责：算法输出文件核对和演示脚本说明
- 成员 C 负责：`README.md` 终稿、`docs/快速启动.md`、`reports/stock_public_opinion_report.tex` 或最终 Word 版报告
- 成员 D 负责：`reports/ppt_outline_10pages.md`、`reports/ppt_speech_10pages.md`、答辩截图与 `submission_final/` 展示材料整理

## 这版计划的底线
- 不强制 MySQL，先把 `Parquet + DuckDB` 做实。
- 不强制真 LDA / 真 LLM / 真谣言分类都上线，但要有对应结果文件。
- 不推翻现有 `frontend/`、`backend/`、`scripts/`。
- 每周必须留下可检查文件，不靠口头完成。
- 全组技术栈口径全量收敛：当前实现统一写为 `React + Vite + Recharts + FastAPI`，禁止在当前实现描述中出现 Vue / Element Plus / ECharts。
