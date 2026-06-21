# Backend API

正式版前端使用 `FastAPI` 作为只读数据接口层，复用现有 `data/processed/` 产物。

## 启动
```bash
uvicorn backend.app:app --reload --port 8000
```

## 接口
- `GET /api/meta/health`
- `GET /api/meta/filters`
- `GET /api/meta/status`
- `GET /api/overview?ticker=...&start_date=...&end_date=...`
- `GET /api/linkage?ticker=...&start_date=...&end_date=...`
- `GET /api/news/dates?ticker=...`
- `GET /api/news/drilldown?ticker=...&alert_date=...`
- `GET /api/backtest?alert_type=...&horizon=...`

## 验证
```bash
pytest tests/backend -v
```
