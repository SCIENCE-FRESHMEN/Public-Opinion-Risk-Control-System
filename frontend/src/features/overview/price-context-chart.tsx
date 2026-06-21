import { useMemo, useState } from 'react';

import type { SeriesPoint } from '../../lib/api/types';

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const cx = (current.x + next.x) / 2;
    path += ` Q ${cx} ${current.y} ${next.x} ${next.y}`;
  }
  return path;
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baseline: number) {
  if (points.length === 0) return '';
  return `${buildSmoothPath(points)} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
}

function describeVolatility(values: number[]) {
  if (values.length < 2) {
    return '偏低';
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const amplitude = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;
  if (amplitude >= 0.05) return '偏高';
  if (amplitude >= 0.02) return '中等';
  return '偏低';
}

const windows = [
  { key: '30', label: '前 30 日', size: 30 },
  { key: '15', label: '前 15 日', size: 15 },
  { key: '1', label: '今日', size: 1 },
] as const;

export function PriceContextChart({
  data,
  title = '30 日价格走势上下文',
  emptyMessage = '暂无法形成有效的价格走势上下文。你可以切换股票，或调整日期范围后重试。',
}: {
  data: SeriesPoint[];
  title?: string;
  emptyMessage?: string;
}) {
  const [activeWindow, setActiveWindow] = useState<(typeof windows)[number]['key']>('30');
  const windowSize = windows.find((item) => item.key === activeWindow)?.size ?? 30;
  const windowed = useMemo(() => data.slice(-windowSize), [data, windowSize]);

  if (data.length === 0) {
    return (
      <section className="ambient-shadow ghost-border rounded-xl bg-[var(--color-surface-container)] p-6">
        <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">{title}</div>
        <div className="mt-4 rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] px-5 py-8">
          <div className="font-headline text-[22px] font-bold text-white">当前窗口样本不足</div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">{emptyMessage}</p>
        </div>
      </section>
    );
  }
  const values = windowed.map((item) => item.value);
  const maxValue = values.length ? Math.max(...values) : 1;
  const minValue = values.length ? Math.min(...values) : 0;
  const midValue = (maxValue + minValue) / 2;
  const chartHeight = 120;
  const chartWidth = 640;
  const range = maxValue - minValue || 1;
  const points = windowed.map((item, index) => ({
    x: (index / Math.max(windowed.length - 1, 1)) * chartWidth,
    y: chartHeight - ((item.value - minValue) / range) * chartHeight,
  }));
  const path = buildSmoothPath(points);
  const areaPath = buildAreaPath(points, chartHeight);
  const latestPoint = points[points.length - 1] ?? points[0];
  const latestValue = windowed[windowed.length - 1]?.value ?? maxValue;
  const firstValue = windowed[0]?.value ?? latestValue;
  const changePct = firstValue !== 0 ? ((latestValue - firstValue) / Math.abs(firstValue)) * 100 : 0;
  const isUp = changePct >= 0;
  const volatilityLabel = describeVolatility(values);

  return (
    <section className="ambient-shadow ghost-border rounded-xl bg-[var(--color-surface-container)] p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">价格走势上下文</div>
          <h3 className="mt-2 font-headline text-[20px] font-bold text-white md:text-[22px]">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 font-label text-[11px] ${isUp ? 'bg-[rgba(45,219,222,0.12)] text-[var(--color-tertiary)]' : 'bg-[rgba(255,180,171,0.12)] text-[var(--color-error)]'}`}>
            {`${isUp ? '+' : ''}${changePct.toFixed(2)}%`}
          </span>
          <span className="rounded-full border border-[rgba(173,199,255,0.12)] bg-[var(--color-surface-lowest)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">
            波动 {volatilityLabel}
          </span>
        </div>
      </div>
      <div
        className="relative h-[230px] overflow-hidden rounded-[24px] border border-[rgba(173,199,255,0.10)] bg-[radial-gradient(circle_at_top,rgba(173,199,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 pb-12 pt-6"
        data-window-size={String(windowSize)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
        <div className="absolute left-3 top-6 space-y-[44px] font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">
          <div>{maxValue.toFixed(2)}</div>
          <div>{midValue.toFixed(2)}</div>
          <div>{minValue.toFixed(2)}</div>
        </div>
        <div className="absolute inset-x-12 top-[18px] h-[140px]">
          <svg className="h-full w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="priceContextLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(173,199,255,0.55)" />
                <stop offset="100%" stopColor="rgba(173,199,255,0.98)" />
              </linearGradient>
              <linearGradient id="priceContextArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(173,199,255,0.24)" />
                <stop offset="100%" stopColor="rgba(173,199,255,0.01)" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#priceContextArea)" />
            <path d={path} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" strokeLinecap="round" />
            <path d={path} fill="none" stroke="url(#priceContextLine)" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        </div>
        {latestPoint ? (
          <div
            className="absolute h-2.5 w-2.5 rounded-full bg-[rgba(173,199,255,0.95)] shadow-[0_0_0_4px_rgba(173,199,255,0.12)]"
            style={{
              left: `calc(48px + (${latestPoint.x / chartWidth}) * (100% - 96px) - 5px)`,
              top: `calc(18px + (${latestPoint.y / chartHeight}) * 140px - 5px)`,
            }}
          />
        ) : null}
        <div className="absolute inset-x-6 bottom-4 flex justify-center gap-2 font-label text-[9px] uppercase tracking-[0.18em] text-[var(--color-outline-variant)]">
          {windows.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={activeWindow === item.key}
              onClick={() => setActiveWindow(item.key)}
              className={`rounded-sm px-2.5 py-1 transition-colors ${activeWindow === item.key ? 'bg-white/[0.10] text-white' : 'text-[var(--color-outline-variant)] hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
