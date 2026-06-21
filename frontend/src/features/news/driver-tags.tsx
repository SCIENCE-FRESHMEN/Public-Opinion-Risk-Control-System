const tags: Array<[string, number]> = [
  ['反垄断', 142],
  ['调查', 98],
  ['下调评级', 65],
  ['罚款', 54],
  ['诉讼', 41],
  ['监管', 34],
];

const driverLabels: Record<string, string> = {
  antitrust: '反垄断',
  investigation: '调查',
  downgrade: '下调评级',
  fine: '罚款',
  lawsuit: '诉讼',
  regulatory: '监管',
};

import { Icon } from '../../components/common/icon';
import type { NewsDrilldownResponse } from '../../lib/api/types';

export function DriverTags({
  stats,
  drivers,
}: {
  stats: NewsDrilldownResponse['stats'];
  drivers: NewsDrilldownResponse['drivers'];
}) {
  const tagItems = drivers.length
    ? drivers.map((item) => [driverLabels[item.term.trim().toLowerCase()] ?? item.term, item.count] as [string, number])
    : tags;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="intel-frame ambient-shadow relative rounded-[22px] bg-[var(--color-surface-high)] p-5">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-[var(--color-error)]" />
          <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">负面占比</div>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-headline text-[44px] font-extrabold text-[var(--color-error)]">{Math.round(stats.negative_ratio * 100)}</span>
            <span className="pb-2 font-label text-[22px] text-[var(--color-on-surface)]">%</span>
          </div>
          <div className="text-sm text-[var(--color-on-surface-variant)]">{`${stats.negative_vs_30d >= 0 ? '+' : ''}${Math.round(stats.negative_vs_30d * 100)}% 较 30 日均值`}</div>
        </div>
        <div className="intel-frame ambient-shadow relative rounded-[22px] bg-[var(--color-surface-high)] p-5">
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-[var(--color-primary)]" />
          <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">总信号数</div>
          <div className="mt-4 font-headline text-[44px] font-extrabold text-white">{stats.total_signals.toLocaleString()}</div>
          <div className="text-sm text-[var(--color-on-surface-variant)]">基于当前预警日期下的新闻样本聚合</div>
        </div>
      </div>
      <div className="intel-frame ambient-shadow rounded-[24px] bg-[var(--color-surface-container)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">关键负面驱动词</div>
          <Icon name="remove" className="text-[18px] text-[var(--color-outline)]" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          {tagItems.map(([term, count]) => (
            <div key={String(term)} className={`rounded-xl px-4 py-2.5 font-label text-sm ${count > 90 ? 'bg-[rgba(147,0,10,0.45)] text-white ring-1 ring-[rgba(255,180,171,0.18)]' : 'bg-[rgba(255,255,255,0.05)] text-[var(--color-on-surface-variant)]'}`}>
              {term} <span className="ml-2 text-[var(--color-error)]">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
