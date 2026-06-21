# 1000 支股票采集批次说明

批次目录：`data/web_runs/20260602_142834_129787`

生成时间：2026-06-02

## 采集参数

配置文件：`input_config.json`

| 参数 | 值 |
| --- | --- |
| 股票数量 | 1000 |
| 自动补足方式 | `guba_hot` |
| 日期范围 | 2026-05-03 至 2026-06-02 |
| 股吧评论上限 | 未指定 |
| 新浪新闻 | 开启 |
| 巨潮公告 | 开启 |
| 上交所公告 | 开启 |
| 腾讯行情 | 开启 |
| 东方财富行情 | 开启 |

`guba_hot` 在这次批次里的含义是“股吧热度优先 + 公开股票池补足”。前 120 支来自股吧热度探测排序，后 880 支来自公开股票列表补足。不要写成“全市场股吧热度 Top1000”。

## 文件规模

| 文件 | 记录数 | 说明 |
| --- | ---: | --- |
| `data/selected_stocks.csv` | 1000 | 股票池 |
| `data/tencent_realtime_quote.csv` | 1000 | 腾讯实时行情 |
| `data/eastmoney_realtime_quote.csv` | 78 | 东方财富实时行情，部分失败 |
| `data/eastmoney_guba.csv` | 98,893 | 东方财富股吧评论/帖子文本 |
| `data/sina_news.csv` | 16,821 | 新浪财经个股新闻 |
| `data/cninfo_announcement.csv` | 5,906 | 巨潮资讯公告 |
| `data/sse_announcement.csv` | 148 | 上交所公告 |
| `data/unified_text_events.csv` | 121,768 | 统一后的多源文本事件主表 |
| `reports/source_coverage_report.csv` | 6,000 | 1000 支股票 × 6 个来源 |
| `reports/stock_source_overview.csv` | 1000 | 股票级摘要表 |

## 覆盖情况

| 指标 | 结果 |
| --- | ---: |
| 股票池数量 | 1000 |
| 股吧覆盖股票 | 997 |
| 新浪新闻覆盖股票 | 995 |
| 巨潮公告覆盖股票 | 973 |
| 上交所公告覆盖股票 | 19 |
| 统一文本事件覆盖股票 | 997 |

说明：

- 股吧有 3 支股票在日期范围内没有记录。
- 新浪新闻有 5 支股票在日期范围内没有记录。
- 巨潮公告有 26 支股票在日期范围内没有记录。
- 上交所公告只适用于沪市公司，深市股票在覆盖报告里会显示 `SKIP: non-SH stock`。
- 腾讯行情 1000 支全覆盖，是本批次行情主参考。
- 东方财富实时行情受本机网络代理影响，只成功 78 支，只作为辅助接口记录。

## 小包内文件

```text
data_package/
├── run_summary.md
├── input_config.json
├── selected_stocks.csv
├── unified_text_events.csv
├── tencent_realtime_quote.csv
├── source_coverage_report.csv
└── stock_source_overview.csv
```

如果需要追溯各来源原始落地结果，到完整包里取：

```text
data/eastmoney_guba.csv
data/sina_news.csv
data/cninfo_announcement.csv
data/sse_announcement.csv
data/eastmoney_realtime_quote.csv
stock_grouped_result.json
```
