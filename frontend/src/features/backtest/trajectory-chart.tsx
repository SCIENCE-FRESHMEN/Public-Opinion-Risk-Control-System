import type { BacktestResponse } from '../../lib/api/types';

function buildPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    path += ` L ${points[index].x} ${points[index].y}`;
  }
  return path;
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baseline: number) {
  if (points.length === 0) return '';
  return `${buildPath(points)} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function TrajectoryChart({ points }: { points: BacktestResponse['trajectory'] }) {
  if (points.length === 0) {
    return (
      <div className="ambient-shadow rounded-xl bg-[var(--color-surface-container)] p-6 ghost-border">
        <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">平均收益轨迹</div>
        <div className="mt-4 rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] px-5 py-8">
          <div className="font-headline text-[22px] font-bold text-white">当前窗口样本不足</div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
            暂无法形成有效的平均收益轨迹。你可以切换股票、扩大日期范围，或等待更多事件样本接入后再查看。
          </p>
        </div>
      </div>
    );
  }
  const chartWidth = 520;
  const chartHeight = 150;
  const maxAbsReturn = points.length ? Math.max(...points.map((point) => Math.abs(point.avg_return))) : 0;
  const maxAbs = Math.max(maxAbsReturn, 0.005);
  const chartPoints = points.map((point, index) => ({
    x: (index / Math.max(points.length - 1, 1)) * chartWidth,
    y: chartHeight / 2 - (point.avg_return / maxAbs) * (chartHeight / 2 - 12),
  }));
  const selectedIndex = points.findIndex((point) => point.horizon === 4);
  const focusIndex = selectedIndex >= 0 ? selectedIndex : Math.max(points.length - 1, 0);
  const focusPoint = points[focusIndex];
  const focusChartPoint = chartPoints[focusIndex];
  const axisMaxPercent = maxAbs * 100;
  const axisHalfPercent = axisMaxPercent / 2;
  const positivePoints = points.filter((point) => point.avg_return >= 0).length;
  const negativePoints = points.length - positivePoints;
  const firstNegative = points.find((point) => point.avg_return < 0);
  const worstPoint = points.reduce((lowest, point) => (point.avg_return < lowest.avg_return ? point : lowest), points[0]);
  const trajectoryDiagnosis = worstPoint.avg_return < 0
    ? `轨迹在后 ${worstPoint.horizon} 日附近进入最深回撤区，说明该类信号触发后，风险释放通常在中短期内更明显。`
    : '轨迹整体维持在零轴上方，说明该类信号对应的后续收益表现相对稳定。';
  const observationWindowLabel = focusPoint ? `后 ${focusPoint.horizon} 日` : '--';
  const regimeLabel = worstPoint.avg_return < 0 ? '下行确认段' : '正收益延展段';
  const firstNegativeLabel = firstNegative ? `后 ${firstNegative.horizon} 日` : '未转负';
  const worstLabel = `后 ${worstPoint.horizon} 日 ${formatPercent(worstPoint.avg_return * 100)}`;
  const areaPath = buildAreaPath(chartPoints, chartHeight - 2);

  return (
    <div className="ambient-shadow rounded-xl bg-[var(--color-surface-container)] p-6 ghost-border">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">回测轨迹诊断</div>
          <div className="mt-2 font-headline text-[20px] font-bold text-white md:text-[22px]">平均收益轨迹</div>
        </div>
        <div className="rounded-full border border-[rgba(173,199,255,0.12)] bg-[var(--color-surface-lowest)] px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">后 1 日到后 10 日</div>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[20px] border border-[rgba(173,199,255,0.12)] bg-[rgba(173,199,255,0.06)] px-4 py-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">关键观察窗</div>
          <div className="mt-2 font-headline text-[24px] font-extrabold text-white">{observationWindowLabel}</div>
        </div>
        <div className="rounded-[20px] border border-[rgba(255,180,171,0.12)] bg-[rgba(255,180,171,0.06)] px-4 py-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">阶段判定</div>
          <div className="mt-2 font-headline text-[24px] font-extrabold text-white">{regimeLabel}</div>
        </div>
        <div className="rounded-[20px] border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.06)] px-4 py-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">正负样本结构</div>
          <div className="mt-2 font-headline text-[24px] font-extrabold text-white">{`${positivePoints} / ${negativePoints}`}</div>
        </div>
      </div>
      <div className="relative h-[320px] overflow-hidden rounded-[24px] border border-[rgba(173,199,255,0.10)] bg-[radial-gradient(circle_at_top,rgba(173,199,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-6">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
        <div className="absolute inset-x-6 top-10 h-px bg-white/5" />
        <div className="absolute inset-x-6 top-[82px] h-px bg-white/5" />
        <div className="absolute inset-x-6 top-[146px] h-px bg-white/[0.06]" />
        <div className="absolute inset-x-6 top-[210px] h-px bg-white/5" />
        <div className="absolute right-6 top-6 max-w-[260px] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(12,18,28,0.76)] px-4 py-3 backdrop-blur-md">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">轨迹结论</div>
          <div className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{trajectoryDiagnosis}</div>
        </div>
        <div className="absolute inset-x-6 bottom-12 flex justify-between font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">
          {points.map((point) => <span key={point.horizon}>{`后 ${point.horizon} 日`}</span>)}
        </div>
        <div className="absolute left-2 top-6 space-y-[22px] font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">
          <div>{formatPercent(axisMaxPercent)}</div>
          <div>{formatPercent(axisHalfPercent)}</div>
          <div>0%</div>
          <div>{formatPercent(-axisHalfPercent)}</div>
          <div>{formatPercent(-axisMaxPercent)}</div>
        </div>
        <div className="absolute inset-x-10 top-10 h-[150px]">
          <svg className="h-full w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="trajectoryLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(45,219,222,0.84)" />
                <stop offset="100%" stopColor="rgba(255,180,171,0.96)" />
              </linearGradient>
              <linearGradient id="trajectoryArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(173,199,255,0.26)" />
                <stop offset="100%" stopColor="rgba(173,199,255,0.02)" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#trajectoryArea)" />
            <path d={buildPath(chartPoints)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" strokeLinecap="round" />
            <path d={buildPath(chartPoints)} fill="none" stroke="url(#trajectoryLine)" strokeWidth="2.8" strokeLinecap="round" />
            {chartPoints.map((point, index) => (
              <circle key={`${point.x}-${points[index]?.horizon}`} cx={point.x} cy={point.y} r={selectedIndex === index ? 4 : 2.5} fill={selectedIndex === index ? 'rgba(255,255,255,0.92)' : 'rgba(173,199,255,0.6)'} />
            ))}
          </svg>
        </div>
        <div className="absolute left-[108px] top-[218px] rounded-2xl border border-[rgba(255,180,171,0.12)] bg-[rgba(32,16,18,0.84)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] shadow-[0_0_24px_rgba(0,0,0,0.22)]">
          <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]">收益转负</div>
          <div className="mt-1 text-white">{firstNegativeLabel}</div>
        </div>
        <div className="absolute left-[284px] top-[236px] rounded-2xl border border-[rgba(255,180,171,0.12)] bg-[rgba(41,18,20,0.86)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] shadow-[0_0_24px_rgba(0,0,0,0.22)]">
          <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]">平均回撤加深</div>
          <div className="mt-1 text-white">{worstLabel}</div>
        </div>
        {focusChartPoint ? (
          <>
            <div className="absolute bottom-[74px] top-10 w-px bg-[linear-gradient(180deg,rgba(255,180,171,0.02),rgba(255,180,171,0.56),rgba(255,180,171,0.02))]" style={{ left: `${40 + focusChartPoint.x}px` }} />
            <div className="absolute border-t border-dashed border-[rgba(255,180,171,0.34)]" style={{ left: '176px', top: '232px', width: `${Math.max(40 + focusChartPoint.x - 84, 18)}px` }} />
          </>
        ) : null}
      </div>
    </div>
  );
}
