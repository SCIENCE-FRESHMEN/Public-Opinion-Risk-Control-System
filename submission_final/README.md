# 提交包说明

## 目录

```text
submission_final/
├── README.md
├── data_package/
│   ├── run_summary.md
│   ├── input_config.json
│   ├── selected_stocks.csv
│   ├── unified_text_events.csv
│   ├── tencent_realtime_quote.csv
│   ├── source_coverage_report.csv
│   └── stock_source_overview.csv
├── docs/
│   ├── data_dictionary.md
│   ├── data_mapping.md
│   ├── downstream_usage.md
│   └── submission_notes.md
└── full_data_package/
    └── 20260602_142834_129787.zip
```

## 主要文件

| 文件 | 用途 |
| --- | --- |
| `data_package/unified_text_events.csv` | 多源文本事件主表 |
| `data_package/selected_stocks.csv` | 本批次 1000 支股票池 |
| `data_package/tencent_realtime_quote.csv` | 行情主参考 |
| `data_package/source_coverage_report.csv` | 各股票、各来源的覆盖情况 |
| `data_package/stock_source_overview.csv` | 股票级摘要表 |
| `data_package/run_summary.md` | 本批次数据说明 |
| `docs/data_dictionary.md` | 数据字典 |
| `docs/data_mapping.md` | 字段映射说明 |
| `docs/downstream_usage.md` | 给算法和前端联调的读取说明 |
| `docs/submission_notes.md` | 提交口径和注意事项 |

## 本批次规模

采集批次：`20260602_142834_129787`

| 指标 | 数量 |
| --- | ---: |
| 股票数量 | 1000 |
| 统一文本事件 | 121,768 |
| 东方财富股吧 | 98,893 |
| 新浪财经新闻 | 16,821 |
| 巨潮公告 | 5,906 |
| 上交所公告 | 148 |
| 腾讯实时行情 | 1000 |

## 备注

- 选股方式是“股吧热度优先 + 公开股票池补足”，不是全市场严格股吧热度 Top1000。
- 行情主参考用腾讯实时行情。东方财富实时行情在本机网络下部分失败，没有放入小包。
- 上交所公告只覆盖沪市股票，深市股票跳过是正常情况。
- `full_data_package/20260602_142834_129787.zip` 是完整结果包。优先 `data_package/` 和 `docs/`。
- 如需把本批次 CSV 快速转成可查询的数据底座，可执行：`python3 scripts/export_submission_batch_to_duckdb.py`
