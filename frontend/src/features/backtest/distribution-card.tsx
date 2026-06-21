import type { BacktestResponse } from '../../lib/api/types';

export function DistributionCard({ distribution }: { distribution: BacktestResponse['distribution'] }) {
  const span = distribution.max - distribution.min || 1;
  const left = 32;
  const right = 248;
  const width = right - left;
  const project = (value: number) => left + ((value - distribution.min) / span) * width;
  const q1 = project(distribution.q1);
  const median = project(distribution.median);
  const q3 = project(distribution.q3);
  const max = project(distribution.max);
  const iqr = distribution.q3 - distribution.q1;
  const distributionBias = distribution.median < 0 ? '偏弱分布' : distribution.median > 0 ? '偏强分布' : '中性分布';
  const spreadLabel = `${(distribution.max - distribution.min).toFixed(1)}%`;

  return (
    <div className="ambient-shadow rounded-xl bg-[var(--color-surface-container)] p-6 ghost-border">
      <div className="mb-4">
        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">分布诊断</div>
        <div className="mt-2 font-headline text-[20px] font-bold text-white md:text-[22px]">收益分布（后 5 日）</div>
        <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">信号触发后的收益离散分布。</div>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[20px] border border-[rgba(255,180,171,0.12)] bg-[rgba(255,180,171,0.06)] px-4 py-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">分布状态</div>
          <div className="mt-2 font-headline text-[24px] font-extrabold text-white">{distributionBias}</div>
        </div>
        <div className="rounded-[20px] border border-[rgba(173,199,255,0.12)] bg-[rgba(173,199,255,0.06)] px-4 py-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">中位数位置</div>
          <div className="mt-2 font-headline text-[24px] font-extrabold text-white">{`${distribution.median.toFixed(1)}%`}</div>
        </div>
        <div className="rounded-[20px] border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.06)] px-4 py-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">极值跨度</div>
          <div className="mt-2 font-headline text-[24px] font-extrabold text-white">{spreadLabel}</div>
        </div>
      </div>
      <div className="mt-8 overflow-hidden rounded-[24px] border border-[rgba(173,199,255,0.10)] bg-[radial-gradient(circle_at_top,rgba(173,199,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-5 py-8">
        <div className="mb-6 flex items-center justify-between font-label text-[11px] uppercase tracking-[0.18em]">
          <span className="text-[var(--color-outline)]">{`${distribution.q1.toFixed(1)}%`}</span>
          <span className="text-[var(--color-primary)]">{`${distribution.median.toFixed(1)}%`}</span>
          <span className="text-[var(--color-outline)]">{`${distribution.max.toFixed(1)}%`}</span>
        </div>
        <div className="relative h-32">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px] opacity-35" />
          <div className="absolute left-6 right-6 top-12 h-px bg-white/10" />
          <div className="absolute left-6 top-7 rounded-full bg-[rgba(255,180,171,0.10)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]">
            亏损尾部
          </div>
          <div className="absolute right-6 top-7 rounded-full bg-[rgba(45,219,222,0.10)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-tertiary)]">
            正收益尾部
          </div>
          <div className="absolute top-12 h-px bg-[linear-gradient(90deg,rgba(255,180,171,0.42),rgba(173,199,255,0.32),rgba(45,219,222,0.42))]" style={{ left: `${left}px`, width: `${max - left}px` }} />
          <div className="absolute top-6 h-14 rounded-[16px] border border-[rgba(173,199,255,0.12)] bg-[linear-gradient(180deg,rgba(173,199,255,0.26),rgba(173,199,255,0.10))]" style={{ left: `${q1}px`, width: `${Math.max(q3 - q1, 18)}px` }} />
          <div className="absolute top-3 h-[44px] w-[2px] bg-[var(--color-primary)] shadow-[0_0_12px_rgba(173,199,255,0.6)]" style={{ left: `${median}px` }} />
          <div className="absolute top-[16px] h-[28px] w-px bg-[rgba(255,255,255,0.52)]" style={{ left: `${left}px` }} />
          <div className="absolute top-[16px] h-[28px] w-px bg-[rgba(255,255,255,0.52)]" style={{ left: `${max}px` }} />
          <div className="absolute left-6 top-[86px] rounded-2xl border border-[rgba(255,180,171,0.12)] bg-[rgba(32,16,18,0.84)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] shadow-[0_0_24px_rgba(0,0,0,0.22)]">
            <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]">最差情形</div>
            <div className="mt-1 text-white">{`${distribution.min.toFixed(1)}%`}</div>
          </div>
          <div className="absolute right-6 top-[86px] rounded-2xl border border-[rgba(45,219,222,0.12)] bg-[rgba(11,28,30,0.84)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] shadow-[0_0_24px_rgba(0,0,0,0.22)]">
            <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-tertiary)]">中间 50%</div>
            <div className="mt-1 text-white">{`${iqr.toFixed(1)}%`}</div>
          </div>
          <div className="absolute inset-x-6 bottom-0 flex justify-between font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">
            <span>{`${distribution.min.toFixed(1)}%`}</span>
            <span>{`${distribution.q3.toFixed(1)}%`}</span>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">
          <span>四分位距（中间 50%）</span>
          <span className="text-[var(--color-primary)]">中位数</span>
        </div>
      </div>
    </div>
  );
}
