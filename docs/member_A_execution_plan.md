# 成员 A 执行计划

## 目标定位
你负责数据工程与持久层构建，核心任务是把现有项目的数据资产整理成可复用、可解释、可追溯的标准数据底座。你的工作要服务整条链路：

多源数据 -> 清洗对齐 -> 情绪/主题/风险分析 -> 研判摘要 -> 前端展示

你不负责前端展示、不负责 PPT 视觉、不负责复杂模型训练。你的优先级是把“数据能不能用、字段能不能对上、文件能不能落地”做实。

## 总目标
- 完成一条可讲清的数据链路。
- 每周都有可落地文件。
- 每个人都有独立产出。
- 最后能直接用于答辩和提交。

## 你的分工边界
- 只负责数据能不能用、字段能不能对上、文件能不能落地。
- 不去碰前端和 PPT。
- 不去硬做复杂模型。
- MySQL 作为加分选做，不作为硬门槛；优先保证 `Parquet + DuckDB` 方案稳定。
- 技术栈口径硬约束：全组所有涉及前端的文档、报告、PPT、答辩稿，一律禁止把当前实现写成 Vue / Element Plus / ECharts，统一口径为 `React + Vite + Recharts + FastAPI`。

## 四周执行表

### 第 1 周：数据资产盘点与字段统一
紧急任务（5月21日-5月24日）：
- 优先配合成员 C，在 5 月 24 日团队作业 1 DDL 前提供一份清晰的《多源异构数据字段对齐草案（金融数据字典说明）》。
- 草案必须能直接放进阶段性报告，用来说明新闻文本、股吧/微博评论、谣言样例与标准金融字段之间的映射关系。
- 5 月 24 日后，再继续清点并输出标准样例和 `data/processed/*.parquet` 说明。

任务：
- 整理现有数据资产，统一字段。
- 补一版 `data_dictionary.md`。
- 把 `stock_data/` 和 `data/raw/` 中的数据整理成标准样例。
- 输出 `data/processed/*.parquet` 说明。

重点文件：
- `stock_data/README.md`
- `data/raw/news_sample.csv`
- `data/processed/news_clean.parquet`
- `data/processed/prices.parquet`
- `docs/data_dictionary.md`

验收要求：
- 能说明每类数据的来源、粒度、字段、用途。
- 能明确哪些数据进入主链路，哪些只做样例。
- 能回答“为什么这个字段和股票实体有关”。

### 第 2 周：多源数据映射与样例接入
任务：
- 补齐多源数据接入样例：THUCNews、微博/股吧文本、谣言样例数据的映射表。
- 输出 `data_mapping.md`。
- 完成字段对齐脚本。

重点文件：
- `docs/data_mapping.md`
- 字段对齐脚本
- 样例数据说明

验收要求：
- 能说明新闻、评论、谣言数据各自映射到哪些标准字段。
- 能说明个股实体、时间、文本、来源如何统一。
- 能给前端和算法提供稳定输入。

### 第 3 周：轻量持久层与可追溯输出
任务：
- 若时间允许，补一个轻量持久层导出脚本，如 `scripts/export_to_duckdb.py`。
- 不强求 MySQL，但要保证数据可追溯、可复用。
- 输出用于前端和算法联调的结果文件。

重点文件：
- `scripts/export_to_duckdb.py`
- `data/processed/*.parquet`
- `data_artifacts/*.json`

验收要求：
- 数据文件能稳定被后续脚本读取。
- 输出结果有固定命名和固定字段。
- 任何人重新跑流程都能找到数据来源。

### 第 4 周：提交版整理与复现说明
任务：
- 清点数据文件。
- 整理提交版目录。
- 保证样例数据、图表、结果文件都在。
- 写清楚数据说明和复现步骤。

重点文件：
- `docs/快速启动.md`
- `README.md`
- `submission_final/` 相关说明

验收要求：
- 老师能顺着说明找到数据。
- 同学能按说明复现结果。
- 提交版不缺关键数据文件。

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
