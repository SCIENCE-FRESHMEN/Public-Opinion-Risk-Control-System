import type { PropsWithChildren } from 'react';

import { SideNav } from './side-nav';
import { TopNav } from './top-nav';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)]">
      <SideNav />
      <TopNav />
      <main className="ml-64 min-h-screen bg-[radial-gradient(circle_at_top,rgba(53,104,196,0.16),transparent_28%),linear-gradient(180deg,rgba(6,12,24,0.96)_0%,rgba(8,15,30,0.98)_44%,rgba(5,10,20,1)_100%)] px-6 pb-16 pt-20 lg:px-6 xl:px-6">
        {children}
        <footer className="mt-8 flex flex-col gap-3 bg-[var(--footer-bg)] px-4 py-4 text-[11px] text-[var(--color-outline)] lg:flex-row lg:items-center lg:justify-between">
          <div>本系统用于《大数据处理技术》课程答辩展示，舆情与行情样本按交易日批处理更新。</div>
          <div className="flex items-center gap-6">
            <span>数据治理链路</span>
            <span>模型研判方法</span>
            <span>展示使用边界</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
