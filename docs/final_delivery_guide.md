# 交付清单 + 启动说明 + 家人使用流程

## 交付清单
- 正式版前端：`frontend/`
- 正式版后端：`backend/`
- A 股标的主数据：`config/instruments_a_share.yaml`
- 已处理产物目录：`data/processed/`
- 一键全流程脚本：`scripts/run_full_pipeline.py`

核心产物：
- `prices.parquet`
- `news_clean.parquet`
- `news_sentiment.parquet`
- `daily_sentiment_features.parquet`
- `risk_alerts.parquet`
- `backtest_results.parquet`
- `backtest_event_results.parquet`

## 启动说明
### 1. 启动后端
```bash
cd /Users/pipi/Desktop/大数据处理技术/个人项目2/stock-sentiment-alert/.worktrees/formal-ui
python3 -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

### 2. 启动前端
```bash
cd /Users/pipi/Desktop/大数据处理技术/个人项目2/stock-sentiment-alert/.worktrees/formal-ui/frontend
npm run dev -- --host 127.0.0.1
```

### 3. 打开页面
- 浏览器访问：`http://127.0.0.1:5173`

## 家人使用流程
### 第一步：选股票
- 在左侧边栏选择想看的股票
- 也可以通过搜索框输入股票代码、简称或拼音简拼

### 第二步：选日期范围
- 设置开始日期和结束日期
- 点击“应用全局筛选”

### 第三步：按页面阅读
- `全景总览`
  - 看当前价格、情绪、新闻热度、风险状态
- `情绪与价格`
  - 看新闻情绪和价格是否同步变化
- `新闻钻取`
  - 看某个预警日到底发生了哪些新闻
- `回测验证`
  - 看类似信号过去出现后，股价通常怎么走
- `监控终端`
  - 看系统数据是否完整、当前筛选是否正确

## 这个网站能起到的作用
- 帮普通用户快速判断某只股票最近是不是“新闻驱动风险上升”
- 帮用户从新闻、情绪、价格、回测四个角度交叉验证
- 帮用户减少只看单条消息就下判断的误判概率

## 注意事项
- 本系统是辅助研判工具，不替代独立投资判断
- 页面行情可能存在约 15 分钟延迟
- 如果某只股票暂时没有新闻或回测窗口，对应模块会显示较少内容
