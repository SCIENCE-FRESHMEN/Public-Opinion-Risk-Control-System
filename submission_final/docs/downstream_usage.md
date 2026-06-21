# 下游联调使用说明

本文档面向成员 B、成员 D，以及最终答辩前的联调阶段，说明如何使用成员 A 交付的 `submission_final` 数据包。

## 1. 推荐读取顺序

建议按以下顺序理解和使用数据：

1. `selected_stocks.csv`
2. `source_coverage_report.csv`
3. `stock_source_overview.csv`
4. `unified_text_events.csv`
5. `tencent_realtime_quote.csv`

含义如下：

- `selected_stocks.csv`：本批次 1000 支股票池与基础属性。
- `source_coverage_report.csv`：每只股票在每个来源上的覆盖情况。
- `stock_source_overview.csv`：股票级摘要，适合做热度榜、覆盖榜、答辩摘要表。
- `unified_text_events.csv`：最核心的下游分析主表，供情绪、主题、风险识别使用。
- `tencent_realtime_quote.csv`：行情主参考，供前端展示和联动分析使用。

## 2. 推荐主表

对成员 B 和成员 D 来说，最重要的是：

```text
submission_final/data_package/unified_text_events.csv
```

核心字段：

```text
id, timestamp, stock_code, stock_name, text_content, source, url,
event_type, read_count, comment_count, text_length, crawl_time, created_at
```

当前主表来源：

```text
eastmoney_guba
sina_news
cninfo_announcement
sse_announcement
```

## 3. 一键导入 DuckDB

如果需要给算法脚本或前端联调提供更稳定的查询入口，执行：

```bash
python3 scripts/export_submission_batch_to_duckdb.py
```

默认会生成：

```text
submission_final/data_package/submission_batch.duckdb
```

导入后包含以下表：

- `selected_stocks`
- `unified_text_events`
- `source_coverage_report`
- `stock_source_overview`
- `tencent_realtime_quote`

## 4. 成员 B 使用建议

### 情绪分析

建议直接读取：

```sql
SELECT id, timestamp, stock_code, stock_name, text_content, source
FROM unified_text_events
```

说明：

- `eastmoney_guba` 更适合做股民讨论情绪分析。
- `sina_news`、`cninfo_announcement`、`sse_announcement` 更适合做事件级文本判断。

### 主题提取

建议先筛特定股票，再按时间窗口取文本：

```sql
SELECT timestamp, stock_code, stock_name, text_content, source
FROM unified_text_events
WHERE stock_code = '000089'
ORDER BY timestamp DESC
```

### 风险识别

可优先筛选官方事件：

```sql
SELECT timestamp, stock_code, stock_name, text_content, source, event_type
FROM unified_text_events
WHERE source IN ('cninfo_announcement', 'sse_announcement')
ORDER BY timestamp DESC
```

## 5. 成员 D 使用建议

### 首页热度榜候选来源

优先读取：

```text
stock_source_overview.csv
```

可直接利用字段：

- `rank`
- `stock_code`
- `stock_name`
- `official_count`
- `news_count`
- `guba_count`
- `quote`

这张表适合做：

- 热度榜 Top10
- 多源覆盖榜
- 首页“焦点标的”候选列表

### 风险事件和新闻卡片候选来源

优先读取：

```text
unified_text_events.csv
```

前端如果暂时不接实时 API，可以先按股票筛选和时间倒序展示：

- 官方事件：`source in ('cninfo_announcement', 'sse_announcement')`
- 媒体新闻：`source = 'sina_news'`
- 股吧评论：`source = 'eastmoney_guba'`

### 行情卡片候选来源

优先读取：

```text
tencent_realtime_quote.csv
```

适合映射字段：

- `stock_code`
- `stock_name`
- `current_price`
- `change`
- `change_percent`
- `quote_time`

## 6. 答辩时的统一说法

建议统一表述为：

- 数据层采用“多源公开数据集与公开接口结合”的策略。
- 成员 A 已完成多源文本统一和股票实体绑定，形成 `unified_text_events.csv` 主表。
- 后续情绪分析、主题建模、风险识别和前端展示，都围绕统一主表与行情表展开。
- 为了联调和复现，额外提供 DuckDB 导入脚本，保证结果可查询、可追溯、可复用。

## 7. 当前边界说明

这份小包更适合：

- 课程答辩
- 算法原型联调
- 前端展示对接
- 结果复现

它不是完整的数据仓库系统，也不等价于生产级实时采集平台。

当前最核心的价值是：

- 数据口径统一
- 来源可追溯
- 下游接口清晰
- 足够支撑课程项目完整链路展示
