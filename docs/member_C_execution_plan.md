# 成员 C 执行计划

## 目标定位
你负责文档、研判简报与结项表达，核心任务是把项目讲清楚、把结果写成可交付材料、把最终口径统一成课程作业可答辩的版本。你要完成的是“项目怎么讲、简报怎么生成、论文怎么定稿”。

你的工作要服务整条链路：

多源数据 -> 清洗对齐 -> 情绪/主题/风险分析 -> 研判摘要 -> 前端展示

## 总目标
- 完成一条可讲清的数据链路。
- 每周都有可落地文件。
- 每个人都有独立产出。
- 最后能直接用于答辩和提交。

## 你的分工边界
- 只负责项目怎么讲、简报怎么生成、论文怎么定稿。
- 不要陷入代码细节。
- 重点是把项目包装成课程作业闭环。
- LLM 可以真接 API，也可以先做固定输入输出格式，保证有研判摘要文件。
- 技术栈口径硬约束：全组所有涉及前端的文档、报告、PPT、答辩稿，一律禁止把当前实现写成 Vue / Element Plus / ECharts，统一口径为 `React + Vite + Recharts + FastAPI`。

## 四周执行表

### 第 1 周：项目口径统一与报告起稿
紧急任务（5月21日-5月24日）：
- 这是当前最高优先级。
- 必须在 5 月 24 日团队作业 1 DDL 前，主笔完成 10 页以上的《基于多源中文舆情数据与大语言模型的上市公司股市舆情态势感知与风控研判系统》阶段性报告大纲与前三章。
- 前三章至少包括：项目背景、数据来源与异构字段对齐、系统架构、功能蓝图细化。
- 必须把成员 A 提供的数据字典草案、成员 B 提供的情绪/规则说明、成员 D 提供的大屏截图统一整合进团队作业 1。
- 与全组手写签字的《原创性承诺书》PDF 统一打包上传。

任务：
- 定稿课程项目名称、技术路线、目录结构。
- 整理 `README.md`、`reports/project_report.md` 的口径。
- 先写“项目背景 / 数据来源 / 系统架构”三章。

重点文件：
- `README.md`
- `reports/project_report.md`
- `reports/stock_public_opinion_report.tex`
- `docs/快速启动.md`

验收要求：
- 项目名称统一。
- 技术栈表述统一。
- 老师看到后能一眼知道你们在做什么。

### 第 2 周：LLM 简报模板与方法章节
任务：
- 起草 LLM 研判简报模板。
- 不要求真 API，也可先用本地模板。
- 输出 `briefing_template.md` 和简报样例。

重点文件：
- `briefing_template.md`
- `ai_brief_sample.md`
- `reports/project_report.md` 中“方法设计”章节

验收要求：
- 能写出“情绪+主题+风险”合成后的研判文字。
- 能说明简报是如何生成的。
- 能给前端 D 组提供可直接展示的文案字段。

### 第 3 周：真实或半真实 LLM 管道
任务：
- 若能接入真实 LLM API 就做 `llm_analyst_client.py`。
- 不能接就固定输入输出格式，保证简报可生成。
- 把报告中“模型方法”章节补完。

重点文件：
- `llm_analyst_client.py`
- `ai_brief_sample.json`
- `reports/project_report.md`

验收要求：
- 至少有一个可复现的研判简报输出。
- 简报字段结构稳定。
- 能接到前端展示卡片。

### 第 4 周：论文定稿与答辩口径收束
任务：
- 完成最终论文 / 报告定稿。
- 统一术语与技术栈表述。
- 整理 PPT 讲稿、答辩口径、局限与展望。

重点文件：
- `reports/ppt_outline_10pages.md`
- `reports/ppt_speech_10pages.md`
- `reports/ppt_script.md`
- `reports/stock_public_opinion_report.tex`

验收要求：
- 论文、PPT、README 之间说法一致。
- 局限和展望写得真实，不夸大。
- 答辩时能把“从原型到成品”的过程说顺。

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
