# Formal Frontend

正式版前端基于 `React + TypeScript + Vite`，优先按设计稿进行桌面端高保真复刻，并通过 `FastAPI` 读取真实数据。

## 启动
```bash
npm install
npm run dev
```

默认接口地址：`http://127.0.0.1:8000`

如需覆盖，设置环境变量：
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## 验证
```bash
npm run test
npm run build
```
