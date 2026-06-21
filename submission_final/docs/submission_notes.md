# 提交说明

更新时间：2026-06-02

## 数据批次

最终批次使用：

```text
data/web_runs/20260602_142834_129787
```

完整压缩包：

```text
data/web_runs/20260602_142834_129787.zip
```

这个批次包含 1000 支股票，日期范围是 2026-05-03 至 2026-06-02。

## 已放入小包的文件

| 文件 | 用途 |
| --- | --- |
| `input_config.json` | 采集参数 |
| `selected_stocks.csv` | 1000 支股票池 |
| `unified_text_events.csv` | 多源文本事件主表 |
| `tencent_realtime_quote.csv` | 行情主参考 |
| `source_coverage_report.csv` | 来源覆盖情况 |
| `stock_source_overview.csv` | 股票级摘要 |
| `run_summary.md` | 本批次说明 |

## 主表字段

`unified_text_events.csv` 是下游分析主表。

核心字段：

```text
id, timestamp, stock_code, stock_name, text_content, source, url,
event_type, read_count, comment_count, text_length, crawl_time, created_at
```

目前进入主表的来源：

```text
eastmoney_guba
sina_news
cninfo_announcement
sse_announcement
```

## 数据规模

| 指标 | 数量 |
| --- | ---: |
| 股票数量 | 1000 |
| 股吧评论 | 98,893 |
| 新浪新闻 | 16,821 |
| 巨潮公告 | 5,906 |
| 上交所公告 | 148 |
| 统一文本事件 | 121,768 |
| 腾讯实时行情 | 1000 |

## 注意事项

1. 本批次选股方式是“股吧热度优先 + 公开股票池补足”。
2. 不要把它写成“全市场股吧热度 Top1000”。
3. 腾讯行情是主行情口径；东方财富行情只作为辅助接口记录。
4. 上交所公告只覆盖沪市股票，深市股票跳过是正常情况。
5. `stock_grouped_result.json` 主要给前端展示用，体积较大，不建议当主数据表。
6. 旧批次和 6 股票 demo 不放进最终小包，避免混淆。

## 推荐读取顺序

内部联调时先看：

```text
selected_stocks.csv
source_coverage_report.csv
stock_source_overview.csv
unified_text_events.csv
```

需要完整追溯时再打开：

```text
full_data_package/20260602_142834_129787.zip
```
