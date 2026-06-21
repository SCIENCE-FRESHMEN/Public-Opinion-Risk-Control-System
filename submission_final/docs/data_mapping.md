# 多源数据字段映射说明

更新时间：2026-06-02

本文档定义不同数据源进入统一数据底座时的字段映射口径。目标是让新闻、股吧、公告、监管事件、行情和样例数据都能对齐到稳定输入，供后续情绪分析、主题提取、风险识别和前端展示使用。

## 统一文本表建议字段

后续多源文本数据建议统一到：

```text
id, timestamp, stock_code, stock_name, text_content, source, url,
read_count, comment_count, text_length, event_type, crawl_time, created_at
```

其中：

- `id`：唯一记录 ID。
- `timestamp`：文本发布时间或事件公告时间。
- `stock_code`：股票代码。
- `stock_name`：股票名称。
- `text_content`：统一后的文本内容。
- `source`：数据来源。
- `url`：原始链接。
- `read_count`、`comment_count`：如果来源没有，则填空或 0。
- `event_type`：新闻、公告、监管、股吧、研报样例等来源类型。
- `crawl_time`：采集时间。
- `created_at`：清洗处理时间。

## 当前已落地来源映射

### 东方财富股吧

| 原始字段 | 统一字段 | 说明 |
| --- | --- | --- |
| `publish_time` | `timestamp` | 帖子发布时间 |
| `stock_code` | `stock_code` | 股票代码 |
| `stock_name` | `stock_name` | 股票名称 |
| `title + content_preview` | `text_content` | 拼接为统一文本 |
| `source` | `source` | 当前为 `eastmoney_guba` |
| `url` | `url` | 原始链接 |
| `read_count` | `read_count` | 阅读数 |
| `comment_count` | `comment_count` | 评论数 |
| `activity_level` | 扩展字段 | 活跃度层级 |

### AKShare 股票日行情

行情不是文本，不进入统一文本表，进入日频行情表。

| 原始字段 | 统一字段 | 说明 |
| --- | --- | --- |
| `stock_code` | `stock_code` | 股票代码 |
| `stock_name` | `stock_name` | 股票名称 |
| `trade_date` | `trade_date` | 交易日期 |
| `open` | `open` | 开盘价 |
| `close` | `close` | 收盘价 |
| `high` | `high` | 最高价 |
| `low` | `low` | 最低价 |
| `volume` | `volume` | 成交量 |
| `amount` | `amount` | 成交额 |
| `pct_change` | `pct_change` | 涨跌幅 |
| `turnover_rate` | `turnover_rate` | 换手率 |

与舆情表对齐时：

```text
date(timestamp) == trade_date
stock_code == stock_code
```

## 后续建议接入来源映射

### 新浪财经个股新闻

第一阶段已有 demo 爬虫，可作为后续大规模新闻源扩展的起点。

| 新闻字段 | 统一字段 | 说明 |
| --- | --- | --- |
| 新闻发布时间 | `timestamp` | 新闻列表时间 |
| 股票代码 | `stock_code` | 来自任务表或页面 |
| 股票名称 | `stock_name` | 来自任务表或页面 |
| 新闻标题 | `text_content` | 优先只采标题，避免正文复杂度 |
| 新闻链接 | `url` | 原始新闻链接 |
| 固定值 `sina_news` | `source` | 数据来源 |
| 固定值 `news` | `event_type` | 事件类型 |

### 巨潮资讯公告

推荐作为正式多源扩展的高价值来源。公告更偏官方文本，适合和股吧舆情做交叉验证。

| 公告字段 | 统一字段 | 说明 |
| --- | --- | --- |
| 公告时间 | `timestamp` | 公告发布日期 |
| 股票代码 | `stock_code` | 公告关联证券代码 |
| 股票简称 | `stock_name` | 公告关联证券简称 |
| 公告标题 | `text_content` | 第一阶段先只采标题 |
| 公告链接 | `url` | 公告或 PDF 链接 |
| 固定值 `cninfo_announcement` | `source` | 数据来源 |
| 公告分类 | `event_type` | 如年报、问询、风险提示、权益分派 |

可选增强：

- PDF 正文解析。
- 公告类别标准化。
- 重大事项关键词标记。

### 交易所公告和监管信息

适合补充风险事件和监管事件。

| 监管字段 | 统一字段 | 说明 |
| --- | --- | --- |
| 发布时间 | `timestamp` | 事件时间 |
| 证券代码 | `stock_code` | 若可识别 |
| 证券简称 | `stock_name` | 若可识别 |
| 标题 | `text_content` | 问询、处罚、异常波动等标题 |
| 链接 | `url` | 原始链接 |
| 来源站点 | `source` | 如 `sse_notice`、`szse_notice` |
| 事件类别 | `event_type` | 监管问询、处罚、异常波动 |

### 行业分类和概念板块

此类数据不是舆情文本，建议进入股票维表。

| 原始字段 | 标准字段 | 说明 |
| --- | --- | --- |
| 股票代码 | `stock_code` | 主实体键 |
| 股票名称 | `stock_name` | 展示字段 |
| 行业名称 | `industry_name` | 行业聚合 |
| 板块名称 | `concept_name` | 概念聚合 |
| 来源 | `source` | 数据来源 |
| 更新时间 | `updated_at` | 追溯字段 |

## 多源融合的三种层级

参考课程中“复杂数据结构化转化”和“多源信息交叉验证”的思路，项目可以采用三层融合：

| 层级 | 做法 | 本项目例子 | 难度 |
| --- | --- | --- | --- |
| 表层拼接 | 统一字段后合并文本表 | 股吧 + 新闻 + 公告标题 | 低 |
| 日频聚合 | 按 `stock_code + date` 汇总 | 每日舆情数 + 行情涨跌幅 | 中 |
| 事件图谱 | 抽取实体和关系 | 公司-公告-监管事件-市场反应 | 高 |

当前建议先完成前两层。第三层可作为答辩亮点或后续扩展。

## 新来源进入主链路前的检查

每个新来源至少完成以下小样本验证：

1. 是否公开可访问，不需要登录和验证码。
2. 是否能低频稳定访问。
3. 是否能拿到时间、股票实体、文本、链接四个核心字段。
4. 是否能保存 raw 样本。
5. 是否能映射到统一字段。
6. 是否有重复、空文本、乱码、时间格式混乱等质量问题。
7. 是否会给下游提供新增价值，而不是重复已有股吧信息。
