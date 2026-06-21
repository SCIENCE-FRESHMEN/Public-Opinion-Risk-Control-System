# 数据字典

更新时间：2026-06-02

本文档说明当前推荐使用的数据表、字段含义、数据粒度和下游用途。当前最终数据包以 `stock_data/` 为准。

## 数据表总览

| 数据表 | 路径 | 粒度 | 主要用途 |
| --- | --- | --- | --- |
| raw 股吧帖子 | `stock_data/opinion_data/large_eastmoney_guba_posts.csv` | 一行一条原始帖子列表记录 | 保留采集原貌，便于追溯 |
| processed 舆情文本 | `stock_data/opinion_data/large_stock_opinion_crawled_data.csv` | 一行一条清洗后的舆情文本 | 情绪、主题、风险、关键词分析 |
| 股票日行情 | `stock_data/market_data/stock_price_daily.csv` | 一行一只股票一个交易日 | 时序行情分析、舆情联动 |
| 股票基础信息 | `stock_data/market_data/stock_basic_info.csv` | 一行一个股票属性项 | 股票实体补充、筛选、展示 |
| 市场指数行情 | `stock_data/market_data/market_index_daily.csv` | 一行一个指数一个交易日 | 市场背景对照 |
| 舆情-行情融合样例 | `stock_data/fusion_data/opinion_price_daily_merged_sample.csv` | 一行一只股票一个交易日 | 热度与行情联动分析 |

## `large_eastmoney_guba_posts.csv`

来源：东方财富股吧公开帖子列表页。

粒度：一行代表一条原始帖子列表记录。

| 字段 | 含义 | 说明 |
| --- | --- | --- |
| `run_id` | 本次采集批次 ID | 用于追溯采集批次 |
| `task_id` | 采集任务 ID | 对应任务表 |
| `post_id` | 帖子 ID | 若页面提供则保留 |
| `stock_code` | 股票代码 | 6 位 A 股代码 |
| `stock_name` | 股票名称 | 来自股票池或页面 |
| `title` | 帖子标题 | raw 文本字段 |
| `content_preview` | 内容摘要 | 列表页可见摘要 |
| `publish_time` | 发布时间 | 后续统一为 `timestamp` |
| `author` | 作者显示名 | 公开列表页字段，仅作原始保留 |
| `read_count` | 阅读数 | 热度指标 |
| `comment_count` | 评论数 | 互动指标 |
| `url` | 帖子链接 | 用于去重和追溯 |
| `source` | 数据来源 | 当前为 `eastmoney_guba` |
| `page` | 采集页码 | 便于排查 |
| `activity_level` | 活跃度层级 | `high_active` 或 `middle_active` |
| `crawl_time` | 采集时间 | 爬虫落库时间 |

## `large_stock_opinion_crawled_data.csv`

来源：由 raw 股吧帖子经过字段统一、文本清洗和去重得到。

粒度：一行代表一条可用于下游分析的舆情文本。

清洗规则：

- 拼接 `title + content_preview` 为 `text_content`。
- 删除空文本。
- 删除 `text_length < 5` 的短文本。
- 按 `id` 和 `url + text_content` 去重。

| 字段 | 含义 | 说明 |
| --- | --- | --- |
| `id` | 舆情记录唯一 ID | 由来源、股票代码、URL、文本、时间生成 |
| `run_id` | 采集批次 ID | 对应大规模采集批次 |
| `timestamp` | 舆情发布时间 | 用于时序聚合 |
| `stock_code` | 股票代码 | 核心实体键 |
| `stock_name` | 股票名称 | 展示和实体识别辅助 |
| `text_content` | 统一文本内容 | 后续 NLP 主输入 |
| `source` | 数据来源 | 当前为 `eastmoney_guba` |
| `url` | 来源链接 | 追溯和去重 |
| `read_count` | 阅读数 | 热度指标 |
| `comment_count` | 评论数 | 互动指标 |
| `text_length` | 文本长度 | 质量检查和特征工程 |
| `activity_level` | 股票活跃度层级 | 说明任务采集深度 |
| `crawl_time` | 采集时间 | 数据工程追溯 |
| `created_at` | processed 生成时间 | 清洗处理时间 |

下游建议：

- 情绪分析：读取 `id, timestamp, stock_code, stock_name, text_content, source, url`。
- 热度分析：增加 `read_count, comment_count`。
- 日频聚合：从 `timestamp` 提取日期，与行情 `trade_date` 对齐。

## `stock_price_daily.csv`

来源：AKShare 股票日行情接口。

粒度：一行代表一只股票一个交易日。

| 字段 | 含义 | 说明 |
| --- | --- | --- |
| `stock_code` | 股票代码 | 与舆情表对齐 |
| `stock_name` | 股票名称 | 展示字段 |
| `trade_date` | 交易日期 | 与舆情日频聚合对齐 |
| `open` | 开盘价 | 日行情字段 |
| `close` | 收盘价 | 日行情字段 |
| `high` | 最高价 | 日行情字段 |
| `low` | 最低价 | 日行情字段 |
| `volume` | 成交量 | 市场活跃度指标 |
| `amount` | 成交额 | 市场活跃度指标 |
| `amplitude` | 振幅 | 波动指标 |
| `pct_change` | 涨跌幅 | 舆情联动核心变量 |
| `change_amount` | 涨跌额 | 行情变化 |
| `turnover_rate` | 换手率 | 市场交易活跃度 |
| `source` | 数据来源 | 当前为 AKShare |
| `crawl_time` | 采集时间 | 追溯字段 |

## `stock_basic_info.csv`

来源：AKShare 股票基础信息和项目股票池。

粒度：当前为长表，一只股票可对应多行属性。

| 字段 | 含义 | 说明 |
| --- | --- | --- |
| `stock_code` | 股票代码 | 主实体键 |
| `stock_name` | 股票名称 | 展示字段 |
| `market` | 市场 | 如 SH、SZ |
| `eastmoney_code` | 东方财富代码 | 股吧采集使用 |
| `sina_code` | 新浪代码 | 新闻扩展可使用 |
| 其他属性字段 | 基础信息项 | 以实际 CSV 表头为准 |

说明：该表适合用于实体补全、股票筛选、行业或市场维度聚合。若后续接入行业分类，建议另建宽表或标准维表。

## `market_index_daily.csv`

来源：AKShare 指数行情接口。

粒度：一行代表一个市场指数一个交易日。

当前指数：

- 上证指数。
- 深证成指。
- 创业板指。
- 沪深300。

用途：

- 作为大盘背景变量。
- 判断个股舆情变化是否处于整体市场波动期。
- 前端总览页展示市场环境。

## `opinion_price_daily_merged_sample.csv`

来源：将 processed 舆情按 `stock_code + date` 聚合后，与股票日行情按 `stock_code + trade_date` 合并。

粒度：一行代表一只股票一个交易日的舆情热度和行情表现。

| 字段 | 含义 | 说明 |
| --- | --- | --- |
| `stock_code` | 股票代码 | 主实体键 |
| `stock_name` | 股票名称 | 展示字段 |
| `trade_date` | 交易日期 | 日频时间键 |
| `opinion_count` | 当日舆情记录数 | 热度核心指标 |
| `avg_read_count` | 平均阅读数 | 平均关注度 |
| `sum_read_count` | 阅读数总和 | 总关注度 |
| `avg_comment_count` | 平均评论数 | 平均互动 |
| `sum_comment_count` | 评论数总和 | 总互动 |
| `avg_text_length` | 平均文本长度 | 文本信息量代理指标 |
| `open` | 开盘价 | 行情字段 |
| `close` | 收盘价 | 行情字段 |
| `high` | 最高价 | 行情字段 |
| `low` | 最低价 | 行情字段 |
| `volume` | 成交量 | 行情字段 |
| `amount` | 成交额 | 行情字段 |
| `pct_change` | 涨跌幅 | 联动分析目标字段 |
| `turnover_rate` | 换手率 | 行情活跃度 |

适合的展示和分析：

- 股票每日舆情数量与涨跌幅对比。
- 阅读数、评论数与成交量对比。
- 高热度股票 TopN。
- 异常日期定位。

## 标准实体键

后续所有新数据源建议至少对齐以下字段：

```text
stock_code, stock_name, timestamp, source, text_content, url
```

如数据源不是文本数据，也应尽量提供：

```text
stock_code, trade_date, source, metric_name, metric_value
```

这样可以让前端和算法模块不直接依赖各爬虫原始字段。
