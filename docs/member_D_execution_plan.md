# 成员 D 执行计划

## 目标定位
你负责前端与答辩交付，核心任务是把现有 React 正式版前端改成一个能稳定展示、能讲清演进逻辑、能在答辩现场直接演示的课程项目大屏。你负责“用户看见什么、答辩怎么展示”。

你的工作要服务整条链路：

多源数据 -> 清洗对齐 -> 情绪/主题/风险分析 -> 研判摘要 -> 前端展示

## 总目标
- 完成一条可讲清的数据链路。
- 每周都有可落地文件。
- 每个人都有独立产出。
- 最后能直接用于答辩和提交。

## 你的分工边界
- 只负责用户看见什么、答辩怎么展示。
- 前端不重构技术栈，只做真实数据接入、视觉统一和演示稳定。
- 你不负责复杂算法训练，也不负责论文主写。
- 你的目标是让 `frontend/` 变成一个稳定的展示载体。
- 技术栈口径硬约束：全组所有涉及前端的文档、报告、PPT、答辩稿，一律禁止把当前实现写成 Vue / Element Plus / ECharts，统一口径为 `React + Vite + Recharts + FastAPI`。

## 四周执行表

### 第 1 周：技术栈口径修正与页面盘点
紧急任务（5月21日-5月24日）：
- 这是当前最高优先级。
- 坚决不推翻现有 React 脚手架。
- 在 5 月 24 日团队作业 1 DDL 前，利用现有 `React + Recharts` 页面快速完成 Mock 个股 K 线、情绪趋势图、风险占比图和 AI 简报卡。
- 全屏截取一张极具视觉冲击力的暗黑券商态势大屏图，作为团队作业 1 PPT 的核心视觉素材。
- 在 5 月 24 日前制作并交付高颜值的团队作业 1 阶段性汇报 PPT 初稿。
- 当前实现描述中禁止出现 ECharts，统一写为 Recharts。

任务：
- 彻底检查前端项目，确保 `package.json` 里的依赖（React、Recharts）在 PPT 首页和技术架构页中得到准确描述。
- 配合成员 C，在 PPT 和 Word 报告中画出“基于 React 组件化大屏的股市风控态势感知数据流转图”。
- 梳理 `frontend/` 现有页面，找出静态假数据位置。
- 列出要替换的数据接口和页面改造点。
- 先保证首页、总览页可稳定展示。

重点文件：
- `frontend/package.json`
- `frontend/src/pages/command-center-page.tsx`
- `frontend/src/pages/stock-insight-page.tsx`
- `frontend/src/features/command-center/real-stock-data.ts`

验收要求：
- 技术栈描述和真实代码一致。
- 首页、总览页不崩。
- 页面中哪些是静态数据、哪些将来要联调，心里有数。

### 第 2 周：局部模块补强与真实数据接口接入
任务：
- 打开现有的 `command-center-page.tsx` 和 `stock-insight-page.tsx`。
- 停止使用假数据，利用 React 的 `useEffect` 和 Axios，把图表组件真正挂接到后端现有的数据管道上。
- 让“上市公司实时舆情热度榜”真正读取 A 组整理好的个股文本数量。
- 让首页和单股详情页改成课程版叙事。
- 完成“有数据就显示、无数据有占位”的交互。

重点文件：
- `frontend/src/pages/command-center-page.tsx`
- `frontend/src/pages/stock-insight-page.tsx`
- `frontend/src/features/command-center/*`
- `frontend/src/features/overview/*`

验收要求：
- 页面能从真实数据或稳定模拟数据中加载。
- 没数据时页面不空白。
- 总览页有课程项目该有的叙事感。

### 第 3 周：大屏联调与高光展示
任务：
- 前端大屏组件全面联调。
- 当 B 组和 C 组的 Pipeline 运行时，确保 Recharts 折线图和 K 线图能够动态随着最新数据变化。
- 录制 3 分钟高光视频。
- 展示特定股票大跌 -> 下方股民情绪雷达变红 -> 弹出谣言风险风控警报 -> 动态渲染大模型生成的研报。

重点文件：
- `frontend/src/features/linkage/*`
- `frontend/src/features/news/*`
- `frontend/src/features/backtest/*`
- 截图与录屏素材

验收要求：
- 联动页、新闻页、回测页都能讲故事。
- 答辩截图能直接使用。
- 演示过程中不出现空白和报错。

### 第 4 周：PPT 终审与展示收口
任务：
- 全面重构终期答辩 PPT。
- 结合前三周的真实落地产物，浓墨重彩地展示“项目演进历程”。
- 强调你们是如何从原型一步步细化数据字典、补强分析模块、打通前端联调，最终演进为完整大屏的。
- 整理页面截图、答辩演示稿、项目介绍顺序。

重点文件：
- `reports/ppt_outline_10pages.md`
- `reports/ppt_speech_10pages.md`
- `reports/ppt_script.md`
- `submission_final/reports_submit/*.png`

验收要求：
- PPT 口径和代码实际一致。
- 能讲清“为什么这是一个完成度高的课程项目”。
- 答辩现场能稳定演示。

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
