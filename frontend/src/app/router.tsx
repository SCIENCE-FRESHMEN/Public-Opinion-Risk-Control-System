import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '../components/layout/app-shell';
import { BacktestPage } from '../pages/backtest-page';
import { CommandCenterPage } from '../pages/command-center-page';
import { NewsPage } from '../pages/news-page';
import { StockInsightPage } from '../pages/stock-insight-page';
import { RouteErrorBoundary } from './route-error-boundary';

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    element: (
      <AppShell>
        <CommandCenterPage />
      </AppShell>
    )
  },
  {
    path: '/stock',
    errorElement: <RouteErrorBoundary />,
    element: (
      <AppShell>
        <StockInsightPage />
      </AppShell>
    )
  },
  {
    path: '/backtest',
    errorElement: <RouteErrorBoundary />,
    element: (
      <AppShell>
        <BacktestPage />
      </AppShell>
    )
  },
  {
    path: '/news',
    errorElement: <RouteErrorBoundary />,
    element: (
      <AppShell>
        <NewsPage />
      </AppShell>
    )
  },
  // 精简后的旧入口重定向：历史回顾 / 联动验证 已并入「个股因子详情」，监控终端数据已并入「因子总览」。
  { path: '/overview', element: <Navigate to="/stock" replace /> },
  { path: '/linkage', element: <Navigate to="/stock" replace /> },
  { path: '/terminal', element: <Navigate to="/" replace /> }
], {
  future: {
    v7_relativeSplatPath: true,
  },
});
