# 最终项目完成度审查与四人成果融合报告

更新时间：2026-06-08

项目名称：面向上市公司舆情风控的多源中文大数据分析与研判系统

## 1. 审查结论

对照最初“多源中文舆情数据 + 模型分析 + LLM 研判 + Dashboard 展示”的最终设计，本项目已经从早期半成品演进为一个可答辩、可运行、可解释的课程项目成品。

当前完成度可以概括为：

| 设计模块 | 当前完成度 | 说明 |
| --- | --- | --- |
| 多源数据接入 | 已完成 | 已落地 1000 只股票、多源文本事件、行情报价、来源覆盖报告 |
| 数据清洗与字段对齐 | 已完成 | 已形成统一文本事件表、数据字典、字段映射文档 |
| 轻量持久层 | 已完成 | 已采用 CSV + DuckDB + Parquet 方式支撑后端读取和复查 |
| 情绪分析 | 已完成 | 已有词典法、FinBERT 降级口径、成员 B 情绪结果文件 |
| 主题分析 | 已完成 | 已有 TF-IDF、TextRank、LDA 主题簇结果和主题热力图 |
| 风险识别 | 已完成 | 已有风险规则、风险评分、疑似谣言规则和风险时间线 |
| 回测验证 | 已完成 | 已保留并接入原项目回测验证页和事件驱动指标 |
| LLM 研判摘要 | 基本完成 | 当前采用本地模板化研判生成，具备结构化 JSON/Markdown 输出；真实远程 LLM API 属于后续增强 |
| 前端 Dashboard | 已完成 | React + Vite + Recharts 多页面展示，已接入 A/B/C 成果 |
| PPT 与报告材料 | 已完成 | 已有 10 页 PPT 口播稿、最终报告 LaTeX、截图素材和答辩口径 |

需要如实说明的是：项目最终没有真正接入 THUCNews、NLPCC、独立中文谣言数据集，也没有部署 Spark/Kafka。当前选择的是更贴近股票风控场景的公开财经数据源，并用 Python + Pandas + DuckDB/Parquet 完成多阶段批处理链路。这一取舍是合理的，因为课程项目重点是完整链路、可解释结果和稳定展示，而不是追求不可控的全网实时系统。

## 2. 最终设计逐项对照

### 2.1 数据策略对照

原始建议是“公开数据集为主 + 热搜接口演示为辅”，避免完全依赖微博爬取。当前项目实际采用的是“公开财经数据源 + 离线提交包 + 采集展示站”。

| 原设计想法 | 当前实际落地 | 状态 |
| --- | --- | --- |
| 微博/股吧评论数据 | 东方财富股吧文本 98,893 条 | 已完成，采用更贴近股票场景的数据 |
| 新闻背景数据 | 新浪财经新闻 16,821 条 | 已完成 |
| 公告/官方文本 | 巨潮公告 5,906 条、上交所公告 148 条 | 已完成 |
| 行情时间序列 | 腾讯实时行情 1000 条，历史行情由原项目管道提供 | 已完成 |
| THUCNews | 未接入 | 可扩展项 |
| NLPCC/中文情感数据集 | 未接入 | 可扩展项 |
| Chinese Rumor Dataset | 未接入 | 可扩展项 |
| 热搜接口演示 | 已由数据采集 Web 展示站补充展示 | 已完成展示层利用 |

当前 A 数据包核心规模：

| 指标 | 数量 |
| --- | ---: |
| 股票池 | 1000 只 |
| 统一文本事件 | 121,768 条 |
| 东方财富股吧 | 98,893 条 |
| 新浪财经新闻 | 16,821 条 |
| 巨潮公告 | 5,906 条 |
| 上交所公告 | 148 条 |
| 来源覆盖报告 | 6,000 行 |
| 股票级摘要 | 1,000 行 |

对应文件：

| 文件 | 作用 |
| --- | --- |
| `submission_final/data_package/unified_text_events.csv` | 统一多源文本事件主表 |
| `submission_final/data_package/selected_stocks.csv` | 1000 只股票池 |
| `submission_final/data_package/tencent_realtime_quote.csv` | 行情主参考 |
| `submission_final/data_package/source_coverage_report.csv` | 来源覆盖情况 |
| `submission_final/data_package/stock_source_overview.csv` | 股票级摘要 |
| `submission_final/data_package/submission_batch.duckdb` | 轻量持久化查询底座 |
| `submission_final/docs/data_dictionary.md` | 数据字典 |
| `submission_final/docs/data_mapping.md` | 字段映射说明 |

### 2.2 模型与算法对照

原设计建议包含 PySpark、BERT、LDA、LLM。当前实际落地如下：

| 模型/技术 | 当前实际状态 | 说明 |
| --- | --- | --- |
| 分布式统计 / Spark | 未实际接入 Spark | 当前以 Pandas + DuckDB/Parquet 完成可复现批处理，可作为 Spark 扩展前置形态 |
| BERT / FinBERT | 有 FinBERT 口径和降级逻辑 | 当前展示以稳定可复现结果为主 |
| 情绪分析 | 已完成 | 成员 B 已输出 5 只股票情绪结果、情绪分布、情绪趋势图 |
| TF-IDF / TextRank | 已完成 | 用于主题关键词抽取 |
| LDA 主题模型 | 已完成结果化落地 | `topic_clusters.csv` 与 `topic_model_demo.py` 可复查 |
| 风险规则 | 已完成 | 8 类风险规则、风险评分、疑似谣言规则 |
| XGBoost 方向预测 | 已接入增强展示 | 前端单股详情页展示方向、置信度、风险等级、模型来源 |
| LLM 研判 | 基本完成 | 本地模板生成，可替换真实 Qwen/DeepSeek API |

成员 B 核心结果：

| 股票 | 舆情条数 | 平均情绪 | 风险评分 | 风险等级 | 触发规则 |
| --- | ---: | ---: | ---: | --- | --- |
| 吉电股份 | 132 | 0.5046 | 0.0 | 低风险 | 无 |
| 宝新能源 | 120 | 0.5785 | 20.0 | 中等风险 | divergence_expanding、volume_surge |
| 深圳能源 | 123 | 0.5222 | 30.0 | 中等风险 | rumor_risk |
| 甘肃电投 | 124 | 0.6038 | 35.0 | 中等风险 | rumor_risk、volume_surge |
| 长江电力 | 124 | 0.5472 | 5.0 | 低风险 | volume_surge |

对应文件：

| 文件 | 作用 |
| --- | --- |
| `member_B/run_member_B_pipeline.py` | 成员 B 结果一键复查入口 |
| `member_B/stock_analysis_demo.py` | 单股情绪与风险分析 Demo |
| `member_B/topic_model_demo.py` | 主题模型结果 Demo |
| `member_B/member_B_summary.csv` | 5 只股票算法汇总 |
| `member_B/*_senti_*/sentiment_scores_summary.json` | 情绪聚合结果 |
| `member_B/*_senti_*/emotion_distribution.json` | 情绪分布 |
| `member_B/*_senti_*/topics/topic_results.csv` | 主题关键词 |
| `member_B/*_senti_*/topics/topic_clusters.csv` | LDA 主题簇 |
| `member_B/*_senti_*/risk/risk_alerts.json` | 风险规则触发结果 |
| `member_B/charts/*.png` | 可视化图表资产 |
| `member_B/成员B代码/models/xgb_model.pkl` | 增强预测模型文件 |
| `member_B/成员B代码/predict_stock.py` | 独立预测入口 |
| `member_B/成员B代码/generate_report.py` | HTML 报告生成能力 |

### 2.3 LLM 与报告表达对照

成员 C 原计划负责项目报告、LLM 简报、答辩口径。由于最终阶段 C 岗任务被统一补齐，当前状态如下：

| 任务 | 当前状态 | 证据文件 |
| --- | --- | --- |
| 项目口径统一 | 已完成 | `README.md`、`docs/快速启动.md` |
| LLM 简报模板 | 已完成 | `briefing_template.md` |
| 简报生成脚本 | 已完成 | `llm_analyst_client.py` |
| 简报样例 | 已完成 | `ai_brief_sample.json`、`ai_brief_sample.md` |
| PPT 口播稿 | 已完成 | `reports/ppt_speech_10pages.md` |
| PPT 大纲 | 已完成 | `reports/ppt_outline_10pages.md` |
| 最终报告 | 已完成 | `reports/stock_public_opinion_report_final.tex`、`reports/stock_public_opinion_report.tex` |

当前 LLM 研判链路的真实口径是：

```text
A 数据覆盖信息 + B 情绪/主题/风险结果
-> C 的研判模板
-> 本地结构化简报 JSON/Markdown
-> 后端 /api/meta/llm-brief
-> 前端 AI 研判简报卡
```

这不是纯静态文案。它已经具备结构化输入、固定输出字段和前端接入链路。真实远程大模型 API 目前没有作为答辩运行依赖，属于后续可替换增强。

### 2.4 前端展示对照

当前正式前端技术栈为：

```text
React + TypeScript + Vite + Recharts + React Query + FastAPI
```

已完成页面：

| 页面 | 路由 | 主要展示内容 | 融合成果 |
| --- | --- | --- | --- |
| 指挥总览 | `/` | 热度榜、焦点股、联动图、风险事件、数据证据、AI 简报 | A 数据包、B 风险结果、C 简报、D 大屏 |
| 单股详情 | `/stock` | 个股画像、风险时间线、代表性舆情、增强预测、主题图谱、AI 简报 | A 单股覆盖、B 情绪主题风险与预测、C 研判、D 页面整合 |
| 历史复盘 | `/overview` | 价格上下文、近期预警、算法视角补充 | 原项目能力 + B 算法补充 |
| 联动验证 | `/linkage` | 价格、情绪、新闻量联动诊断 | 原项目联动能力 + D 图表重构 |
| 舆情钻取 | `/news` | 预警日期、新闻流、驱动词、来源覆盖、情绪附证图 | A 新闻/公告/股吧事件 + B 图表 |
| 回测验证 | `/backtest` | 事件触发、远期收益、最大回撤、分布诊断 | 原项目回测能力 + D 可视化增强 |

前端接入证据：

| 接入点 | 文件 |
| --- | --- |
| A 热度榜与风险事件 | `frontend/src/features/meta/useSubmissionHeatTopQuery.ts`、`useSubmissionRiskEventsQuery.ts` |
| A 单股风险时间线 | `frontend/src/features/meta/useSubmissionStockRiskTimelineQuery.ts` |
| A 代表性舆情 | `frontend/src/features/meta/useSubmissionStockPostsQuery.ts` |
| A 来源覆盖 | `frontend/src/features/meta/useSubmissionStockCoverageQuery.ts` |
| B 算法分析 | `frontend/src/features/meta/useMemberBAnalysisQuery.ts` |
| B 增强预测 | `frontend/src/features/meta/useMemberBEnhancedPredictionQuery.ts` |
| C 研判简报 | `frontend/src/features/meta/useLlmBriefQuery.ts` |
| 项目证据链 | `frontend/src/features/meta/useProjectEvidenceQuery.ts` |
| 首页融合逻辑 | `frontend/src/features/command-center/use-command-center-page-data.ts` |
| 单股页融合逻辑 | `frontend/src/features/command-center/use-stock-insight-page-data.ts` |

## 3. 四位同学成果如何融合

### 3.1 总体融合链路

最终工程的融合方式可以概括为：

```text
张思拓：多源数据采集与字段统一
    -> 统一文本事件表、来源覆盖、行情报价、DuckDB

陈夏泷：情绪、主题、风险与预测分析
    -> 情绪分布、主题结果、风险规则、XGBoost 预测、可视化图表

王岩方：报告、研判模板与答辩口径
    -> LLM 简报模板、项目报告、PPT 口播稿、课程项目叙事

李凯迪：前端展示与系统整合
    -> FastAPI 接口联调、React 大屏、单股页、新闻页、联动页、回测页
```

最终不是四份分散作业，而是一条被前后端串起来的工程链路：

```text
submission_final/data_package
-> backend/services/meta_service.py
-> /api/meta/*
-> frontend/src/features/meta/*
-> command-center / stock / news / backtest 页面
-> PPT、报告、截图素材
```

### 3.2 张思拓成果的融合方式

张思拓的数据成果没有只停留在 PDF 或说明文档，而是进入了后端和前端。

| 张思拓交付 | 融合位置 | 前端呈现 |
| --- | --- | --- |
| `unified_text_events.csv` | 后端读取新闻、公告、股吧事件 | 舆情钻取页、风险事件、代表性舆情 |
| `source_coverage_report.csv` | `/api/meta/submission-stock-coverage` | 新闻页右侧来源覆盖、单股来源构成 |
| `stock_source_overview.csv` | `/api/meta/submission-heat-top` | 首页舆情热度榜前十 |
| `tencent_realtime_quote.csv` | 报价与项目证据接口 | 首页和单股页价格上下文 |
| `submission_batch.duckdb` | 轻量持久层 | 数据可复查、可查询 |
| 数据采集 Web 展示站 | 首页“数据采集网页展示站”入口 | 答辩时展示采集流程和外部工程成果 |

### 3.3 陈夏泷成果的融合方式

陈夏泷的算法成果被分成三类接入：结构化指标、可视化图表、增强预测。

| 陈夏泷交付 | 融合位置 | 前端呈现 |
| --- | --- | --- |
| 情绪结果 JSON | `/api/meta/member-b-analysis` | 单股详情页“算法分析结果” |
| 主题结果 CSV | `/api/meta/member-b-analysis` | 主题关键词前八、主题强度排序 |
| LDA 主题簇 | `topic_model_demo.py` 与报告说明 | 作为主题建模证据 |
| 风险规则 JSON | `/api/meta/member-b-analysis` | 风险评分、触发规则、风险因素 |
| 风险时间线 CSV | `/api/meta/member-b-analysis` | 风险趋势追踪图 |
| 图表资产 PNG | `frontend/public/member-b-charts/` 或静态引用 | 新闻页情绪附证图、单股页主题热力图 |
| XGBoost 模型文件 | `/api/meta/member-b-enhanced-prediction` | 单股详情页“增强研判信号” |
| HTML 报告生成能力 | B 代码说明与前端能力说明 | 作为算法交付边界与加分项 |

### 3.4 王岩方成果的融合方式

王岩方的成果主要解决“项目怎么讲”和“AI 简报怎么生成”。

| 王岩方交付 | 融合位置 | 前端/报告呈现 |
| --- | --- | --- |
| 项目报告 | `reports/stock_public_opinion_report*.tex` | 最终提交材料 |
| PPT 大纲与口播稿 | `reports/ppt_outline_10pages.md`、`reports/ppt_speech_10pages.md` | 10 分钟答辩 |
| LLM 简报模板 | `briefing_template.md` | 简报生成脚本和后端接口口径 |
| 简报生成脚本 | `llm_analyst_client.py` | 可复现生成 JSON/Markdown |
| 简报样例 | `ai_brief_sample.json`、`ai_brief_sample.md` | 前端 AI 研判卡与报告案例 |

当前前端 AI 简报不是孤立展示文案，而是通过：

```text
build_llm_brief_payload()
-> A 来源覆盖信息
-> B 情绪/主题/风险结果
-> C 研判模板
-> 前端 BriefingCard
```

形成了结构化研判闭环。

### 3.5 李凯迪成果的融合方式

李凯迪负责把前三位同学的结果真正变成“看得见、能演示、能截图”的最终产品。

| 李凯迪工作 | 具体落地 |
| --- | --- |
| 前端总览大屏 | 首页指挥总览、热度榜、焦点股、风险事件、数据证据区 |
| 单股详情真实化 | 股票选择、风险时间线、代表性舆情、增强预测、主题图谱、AI 简报 |
| 新闻页真实化 | 预警日期、新闻流、驱动词、来源覆盖、情绪附证图 |
| 联动验证打磨 | 价格、情绪、新闻量联动诊断图 |
| 回测页打磨 | 回测轨迹诊断图、收益分布诊断卡 |
| 全站中文术语收口 | 去除页面英文小标签，适配答辩口播 |
| 演示材料 | `submission_final/reports_submit/*.png` 截图素材 |

## 4. 当前仍需如实说明的边界

这些不是致命缺陷，但答辩时不能夸大：

| 边界 | 建议答辩口径 |
| --- | --- |
| 没有真正接入 Spark/Kafka | 当前完成可复现批处理链路，后续可自然迁移到 Spark/Kafka |
| 没有真实远程 LLM API 依赖 | 当前采用本地模板保证稳定，可替换 DeepSeek/Qwen API |
| 没有独立 THUCNews/NLPCC/Chinese Rumor Dataset | 当前采用更贴近股票场景的财经新闻、公告、股吧数据，通用公开数据集作为扩展方向 |
| 谣言识别不是深度模型 | 当前是规则识别和关键词样本标记，适合作为课程项目风险识别模块 |
| B 算法完整覆盖股票为 5 只 | 全量数据覆盖 1000 只，深度算法样例覆盖 5 只，用于展示算法链路和可解释结果 |
| 金融预测 AUC 不高 | AUC 0.6014 属于金融预测中偏弱但合理的辅助信号，不能作为交易策略 |

## 5. 最终完成度判断

从“课程项目是否完整”角度看，当前已经完成：

- 有真实数据包：1000 只股票、121,768 条统一文本事件。
- 有字段规范：数据字典、字段映射、来源覆盖说明。
- 有可复查脚本：A 数据 DuckDB 导出、B 一键复查、C 简报生成。
- 有模型结果：情绪、主题、风险、谣言规则、预测信号、回测指标。
- 有后端接口：FastAPI 统一向前端提供只读数据。
- 有前端产品：六个页面形成总览、下钻、验证、钻取、回测闭环。
- 有答辩材料：PPT 口播稿、截图、报告、追问预案。

因此，最终项目不再是“前端展示层基本完成、A/B 关键工程缺失”的状态。现在更准确的结论是：

```text
项目已经达到课程结课成品标准。
A/B/C/D 四类成果已经完成工程融合。
仍需如实说明的是：Spark、真实远程 LLM、通用公开 NLP 数据集属于后续增强项，不是当前实际落地内容。
```

## 6. 推荐答辩表述

可以在答辩中这样说明四人成果融合：

> 我们最终不是把四位同学的内容简单拼在一起，而是形成了一条完整的数据处理链路。张思拓负责的数据包提供 1000 只股票和 12 万级多源文本事件；陈夏泷在这些样本上完成情绪、主题、风险和预测分析；王岩方把结构化结果整理成统一的研判简报和报告口径；我负责把这些结果通过 FastAPI 接口接入 React 前端，最终形成首页总览、单股详情、新闻钻取、联动验证和回测验证这几个可演示页面。这样，数据、算法、研判和展示之间形成了闭环。

## 7. 推荐最终提交材料清单

| 类型 | 文件/目录 |
| --- | --- |
| 前端正式版 | `frontend/` |
| 后端正式版 | `backend/` |
| A 数据包 | `submission_final/data_package/` |
| A 数据说明 | `submission_final/docs/` |
| B 算法结果 | `member_B/` |
| C 简报材料 | `briefing_template.md`、`llm_analyst_client.py`、`ai_brief_sample.*` |
| 报告材料 | `reports/stock_public_opinion_report_final.tex` |
| PPT 口播 | `reports/ppt_speech_10pages.md` |
| 答辩截图 | `submission_final/reports_submit/` |
| 本融合报告 | `docs/final_project_integration_report.md` |

