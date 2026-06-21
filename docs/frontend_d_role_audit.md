# D 岗前端现状审计

## 1. 审计目标
本文件用于服务成员 D 的前端执行任务，目标不是直接改代码，而是先把当前前端的真实状态盘清楚，明确：

- 当前有哪些核心页面
- 每个页面的数据来源是什么
- 哪些页面已经具备真实 API 接入能力
- 哪些页面仍依赖静态数据
- 后续改造的优先级是什么
- D 岗分别依赖 A、B、C 哪些交付物

这份文档后续会同时服务：

- 前端真实联调
- 答辩截图组织
- PPT 技术口径统一
- “从静态原型到真实联调”演进叙事

## 2. 页面清单

当前 `frontend/src/pages/` 下的核心页面如下：

- `command-center-page.tsx`
  - 指挥总览首页
  - 当前是答辩最核心的视觉展示页
- `stock-insight-page.tsx`
  - 单股详情页
  - 当前用于展示涪陵电力等案例股票
- `overview-page.tsx`
  - 历史回顾 / 总览分析页
- `linkage-page.tsx`
  - 情绪与价格联动页
- `news-page.tsx`
  - 舆情钻取页
- `backtest-page.tsx`
  - 回测验证页
- `vigilance-terminal.tsx`
  - 监控终端页

从 D 岗视角看，最重要的页面是：

- 首页：`command-center-page.tsx`
- 单股详情页：`stock-insight-page.tsx`

因为这两个页面最适合出答辩截图，也最能体现前端展示层的完成度。

## 3. 页面对应数据来源

### 3.1 首页：`command-center-page.tsx`
- 当前默认数据来源：
  - `frontend/src/features/command-center/real-stock-data.ts`
- 当前使用方式：
  - 组件 props 默认值直接取 `realCommandCenterDashboard`
  - 单股联动区默认取 `realStockInsight`
- 结论：
  - 这是一个高保真静态数据首页
  - 视觉完成度较高
  - 但尚未接入真实 query hook

### 3.2 单股详情页：`stock-insight-page.tsx`
- 当前默认数据来源：
  - `frontend/src/features/command-center/real-stock-data.ts`
- 当前使用方式：
  - 组件 props 默认值直接取 `realStockInsight`
- 结论：
  - 也是高保真静态数据详情页
  - 页面结构已经成熟
  - 但仍未接入真实接口

### 3.3 总览页：`overview-page.tsx`
- 使用：
  - `useOverviewQuery()`
- 实际接口：
  - `/api/overview`
- 兜底方式：
  - `fallbackOverviewResponse`
- 结论：
  - 已具备真实接口骨架
  - 页面并非纯静态
  - 可作为首页未来联调的参考样板

### 3.4 联动页：`linkage-page.tsx`
- 使用：
  - `useLinkageQuery()`
- 实际接口：
  - `/api/linkage`
- 兜底方式：
  - `fallbackLinkageResponse`
- 结论：
  - 已具备真实接口骨架
  - 页面联动逻辑已存在
  - 可作为首页联动图模块的真实数据参考

### 3.5 新闻页：`news-page.tsx`
- 使用：
  - `useNewsDatesQuery()`
  - `useNewsDrilldownQuery()`
- 实际接口：
  - `/api/news/dates`
  - `/api/news/drilldown`
- 兜底方式：
  - `fallbackNewsDatesResponse`
  - `fallbackNewsDrilldownResponse`
- 结论：
  - 具备真实钻取接口能力
  - 当前已经是“真实接口优先，fallback 保底”的模式

### 3.6 回测页：`backtest-page.tsx`
- 使用：
  - `useBacktestQuery()`
- 实际接口：
  - `/api/backtest`
- 兜底方式：
  - `fallbackBacktestResponse`
- 结论：
  - 已具备真实接口能力
  - 空结果时会自动回退到演示数据

### 3.7 监控终端页：`vigilance-terminal.tsx`
- 使用：
  - `useFiltersQuery()`
  - `useStatusQuery()`
- 实际接口：
  - `/api/meta/filters`
  - `/api/meta/status`
- 结论：
  - 当前属于真实状态页
  - 能辅助 D 岗查看产物是否已生成

## 4. 静态数据依赖清单

当前前端最核心的静态数据文件是：

- `frontend/src/features/command-center/real-stock-data.ts`

这个文件当前承担了以下职责：

- 首页总览数据
- 单股详情数据
- 热度榜数据
- 风险事件数据
- AI 简报卡文案
- fallback 数据源

这说明它既是演示资产，也是当前最大的“静态喂数入口”。

### 当前仍强依赖静态喂数的页面
- `command-center-page.tsx`
- `stock-insight-page.tsx`

### 当前部分依赖 fallback，但已具备接口能力的页面
- `overview-page.tsx`
- `linkage-page.tsx`
- `news-page.tsx`
- `backtest-page.tsx`

## 5. 已有 API / Query Hook 清单

当前前端已有的 query hook 和接口如下：

- `useOverviewQuery()`
  - `/api/overview`
- `useLinkageQuery()`
  - `/api/linkage`
- `useNewsDatesQuery()`
  - `/api/news/dates`
- `useNewsDrilldownQuery()`
  - `/api/news/drilldown`
- `useBacktestQuery()`
  - `/api/backtest`
- `useFiltersQuery()`
  - `/api/meta/filters`
- `useStatusQuery()`
  - `/api/meta/status`

此外，前端还有完整的 API 类型定义：

- `frontend/src/lib/api/types.ts`

以及统一请求入口：

- `frontend/src/lib/api/client.ts`

### 这一点非常关键
项目并不是“前端还没接 API”，而是：

**项目已经有一套真实 API 接入骨架，只是答辩最关键的首页和单股详情页还停留在静态高保真壳阶段。**

## 6. 改造优先级

### 第一优先级：首页和单股详情页

目标页面：

- `command-center-page.tsx`
- `stock-insight-page.tsx`

原因：

- 这是答辩时最显眼的页面
- 当前仍依赖 `real-stock-data.ts`
- 最能体现 D 岗的工作价值
- 最适合承接成员 A/B/C 后续交付的数据和文案

### 第二优先级：总览页和联动页

目标页面：

- `overview-page.tsx`
- `linkage-page.tsx`

原因：

- 已有真实接口骨架
- 可以作为首页/详情页联调时的数据结构参考
- 稳定性较高，适合用来补强整体展示可信度

### 第三优先级：新闻页和回测页

目标页面：

- `news-page.tsx`
- `backtest-page.tsx`

原因：

- 已经具备真实查询能力
- 后续更多是展示增强、标签增强和答辩叙事增强

### 终端页定位

- `vigilance-terminal.tsx`

作用：

- 用于辅助检查产物状态和全局筛选
- 不作为答辩主视觉，但可作为联调和验收辅助页

## 7. 对 A / B / C 的依赖关系

### 对成员 A 的依赖

D 岗需要 A 提供：

- `data_dictionary.md`
- `data_mapping.md`
- 标准字段命名规则
- 数据映射后的字段解释

这些内容会影响：

- 前端页面文案
- 模块命名
- 图表标题
- PPT 和报告中的字段解释

### 对成员 B 的依赖

D 岗需要 B 提供：

- `topic_keywords_report.md` 或 `topic_results.csv`
- `risk_alerts.parquet`
- `backtest_results.parquet`
- `backtest_event_results.parquet`
- 风险标签与主题字段说明

这些内容会影响：

- 首页热度榜和主题标签
- 单股详情页的风险模块
- 联动页与回测页的真实增强

### 对成员 C 的依赖

D 岗需要 C 提供：

- `briefing_template.md`
- `ai_brief_sample.json` 或 `ai_brief_sample.md`
- 报告与 PPT 中的统一技术口径

这些内容会影响：

- AI 简报卡
- 页面叙事文案
- 答辩演示口径

## 8. 答辩展示建议

### 技术栈口径
当前实现必须统一描述为：

- `React + Vite + Recharts + FastAPI`

当前实现描述中禁止写成：

- Vue
- Element Plus
- ECharts

如果提到旧设想，只能明确标注为“早期草案”或“历史设想”，不能说成当前实现。

### 截图优先级
第一批答辩截图建议从以下页面出：

1. `command-center-page.tsx`
2. `stock-insight-page.tsx`
3. `linkage-page.tsx`
4. `news-page.tsx`
5. `backtest-page.tsx`

### 演进叙事建议
答辩中前端部分最有价值的叙事不是“我们做了一个好看的页面”，而是：

- 先有静态高保真原型
- 再有真实 API 骨架
- 再逐步把首页和详情页从静态壳替换为真实数据壳
- 最终形成可答辩、可截图、可联调的券商风控展示系统

## 9. 结论

当前 D 岗的第一步不是直接重写页面，而是先完成前端现状审计。审计结果已经很明确：

- `overview/linkage/news/backtest` 已有真实接口骨架
- `command-center-page` 和 `stock-insight-page` 仍然依赖 `real-stock-data.ts`
- 当前前端最大的问题不是“没有页面”，而是“答辩最关键的两页还没完成真实替换”

因此，D 岗后续最合理的推进顺序应该是：

1. 先替换首页和单股详情页的静态数据入口
2. 再统一总览、联动、新闻、回测几页的叙事口径
3. 最后整理截图、PPT 和答辩演示流程

这份文档就是 D 岗后续所有页面联调和答辩交付的起点。

