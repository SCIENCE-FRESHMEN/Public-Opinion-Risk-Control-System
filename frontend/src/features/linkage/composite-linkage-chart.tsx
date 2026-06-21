import type { LinkageResponse } from '../../lib/api/types';

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

export function CompositeLinkageChart({ series, spike }: { series: LinkageResponse['series']; spike?: LinkageResponse['alert_spikes'][number] }) {
  const isEmpty =
    series.price.length === 0 &&
    series.sentiment.length === 0 &&
    series.news_volume.length === 0;
  if (isEmpty) {
    return (
      <section className="ambient-shadow rounded-xl bg-[var(--color-surface-container)] p-6">
        <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] px-5 py-8">
          <div className="font-headline text-[22px] font-bold text-white">当前窗口样本不足</div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
            暂无法形成价格、情绪与新闻热度的联动图谱。你可以切换股票，或调整日期范围后重试。
          </p>
        </div>
      </section>
    );
  }
  const priceWindow = series.price.slice(-6);
  const sentimentWindow = series.sentiment.slice(-6);
  const volumeWindow = series.news_volume.slice(-8);
  const maxPrice = priceWindow.length ? Math.max(...priceWindow.map((item) => item.value)) : 1;
  const minPrice = priceWindow.length ? Math.min(...priceWindow.map((item) => item.value)) : 0;
  const maxVolume = volumeWindow.length ? Math.max(...volumeWindow.map((item) => item.value)) : 1;
  const priceWidth = 620;
  const priceHeight = 110;
  const priceRange = maxPrice - minPrice || 1;
  const pricePoints = priceWindow.map((item, index) => ({
    x: (index / Math.max(priceWindow.length - 1, 1)) * priceWidth,
    y: priceHeight - ((item.value - minPrice) / priceRange) * priceHeight,
  }));
  const pricePath = buildSmoothPath(pricePoints);
  const priceAreaPath = buildAreaPath(pricePoints, priceHeight + 6);
  const sentimentWidth = 620;
  const sentimentHeight = 102;
  const sentimentPoints = sentimentWindow.map((item, index) => ({
    x: (index / Math.max(sentimentWindow.length - 1, 1)) * sentimentWidth,
    y: 51 - item.value * 42,
    value: item.value,
  }));
  const positiveArea = sentimentPoints
    .filter((point) => point.value >= 0)
    .map((point) => `${point.x},${point.y}`)
    .join(' ');
  const negativeArea = sentimentPoints
    .filter((point) => point.value < 0)
    .map((point) => `${point.x},${point.y}`)
    .join(' ');
  const spikeIndex = spike ? Math.max(volumeWindow.findIndex((item) => item.date === spike.date), 0) : -1;
  const spikeOffset = spikeIndex >= 0 ? 170 + (spikeIndex / Math.max(volumeWindow.length - 1, 1)) * 620 : 278;
  const priceTicks = [maxPrice, (maxPrice + minPrice) / 2, minPrice];
  const latestPrice = priceWindow[priceWindow.length - 1];
  const latestSentiment = sentimentWindow[sentimentWindow.length - 1];
  const latestVolume = volumeWindow[volumeWindow.length - 1];
  const annotationX = spikeOffset - 170;
  const volumeAnnotationX = Math.max(36, Math.min(annotationX - 12, 520));
  const sentimentFocusIndex = spike ? Math.max(sentimentWindow.findIndex((item) => item.date === spike.date), 0) : sentimentWindow.length - 1;
  const priceFocusIndex = spike ? Math.max(priceWindow.findIndex((item) => item.date === spike.date), 0) : priceWindow.length - 1;
  const priceAnnotation = pricePoints[Math.max(priceFocusIndex, 0)];
  const sentimentAnnotation = sentimentPoints[Math.max(sentimentFocusIndex, 0)];
  const observationWindowLabel = volumeWindow.length
    ? `${volumeWindow[0].date.slice(5)} 至 ${volumeWindow[volumeWindow.length - 1].date.slice(5)}`
    : '--';
  const currentSignalLabel = spike ? '预警已确认' : '观察中';

  return (
    <section className="ambient-shadow rounded-xl bg-[var(--color-surface-container)] p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="rounded-full border border-[rgba(173,199,255,0.12)] bg-[rgba(173,199,255,0.08)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">
          价格主线
        </div>
        <div className="rounded-full border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.08)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">
          情绪对冲带
        </div>
        <div className="rounded-full border border-[rgba(255,180,171,0.12)] bg-[rgba(255,180,171,0.08)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">
          热度触发柱
        </div>
      </div>
      <div className="relative h-[560px] overflow-hidden rounded-[28px] border border-[rgba(173,199,255,0.12)] bg-[radial-gradient(circle_at_top,rgba(173,199,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-6">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
        <div className="absolute left-[170px] right-10 top-4 flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-[rgba(173,199,255,0.12)] bg-[rgba(10,16,26,0.72)] px-4 py-3 backdrop-blur-md">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">观测窗口</div>
            <div className="mt-2 font-headline text-[20px] font-bold text-white">{observationWindowLabel}</div>
          </div>
          <div className="rounded-2xl border border-[rgba(255,180,171,0.12)] bg-[rgba(41,18,20,0.70)] px-4 py-3 backdrop-blur-md">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">锚点诊断线</div>
            <div className="mt-2 font-headline text-[18px] font-bold text-white">{currentSignalLabel}</div>
          </div>
        </div>
        <div className="absolute left-[170px] right-10 top-16 h-px bg-white/[0.04]" />
        <div className="absolute left-[170px] right-10 top-[226px] h-px bg-white/[0.04]" />
        <div className="absolute left-[170px] right-10 top-[392px] h-px bg-white/[0.04]" />
        <div className="absolute bottom-8 left-[170px] right-10 h-px bg-white/[0.04]" />
        <div
          className="absolute right-10 top-20 rounded-2xl border border-white/10 bg-[rgba(54,57,64,0.78)] px-5 py-4 shadow-[0_0_32px_rgba(225,226,235,0.06)] backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between gap-8 border-b border-white/10 pb-2 font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">
            <span>{spike?.date ?? '--'}</span>
            <span className="rounded-sm bg-[rgba(178,34,34,0.2)] px-2 py-1 text-[var(--color-error)]">{spike ? '预警触发' : '预警：--'}</span>
          </div>
          <div className="space-y-2 text-sm text-[var(--color-on-surface-variant)]">
            <div className="flex justify-between gap-8"><span>价格</span><span className="font-headline text-lg text-white">{spike ? `¥${spike.price.toFixed(2)}` : '--'}</span></div>
            <div className="flex justify-between gap-8"><span>情绪</span><span className="font-headline text-lg text-[#8B0000]">{spike ? spike.sentiment.toFixed(2) : '--'}</span></div>
            <div className="flex justify-between gap-8"><span>新闻量</span><span className="font-headline text-lg text-white">{spike ? `${spike.news_volume} 篇` : '--'}</span></div>
          </div>
        </div>
        <div className="absolute left-14 top-14 font-label text-[12px] text-[var(--color-on-surface-variant)]">
          <div className="flex h-[130px] items-start">
            <div className="space-y-5 text-[10px] text-[var(--color-outline)]">
              {priceTicks.map((tick) => (
                <div key={tick}>{tick.toFixed(0)}</div>
              ))}
            </div>
            <div className="ml-7 text-[12px] text-[var(--color-on-surface-variant)]">价格走势</div>
          </div>
          <div className="mt-8 flex h-[128px] items-start">
            <div className="space-y-[34px] text-[10px] text-[var(--color-outline)]">
              <div>+1.0</div>
              <div>0.0</div>
              <div>-1.0</div>
            </div>
            <div className="ml-7 text-[12px] text-[var(--color-on-surface-variant)]">日度情绪</div>
          </div>
          <div className="mt-7 flex h-[108px] items-start">
            <div className="space-y-[42px] text-[10px] text-[var(--color-outline)]">
              <div>{`${(maxVolume / 1000).toFixed(1)} 千`}</div>
              <div>0</div>
            </div>
            <div className="ml-7 text-[12px] text-[var(--color-on-surface-variant)]">新闻热度</div>
          </div>
        </div>
        {spike ? (
          <>
            <div className="absolute bottom-14 top-10 w-px bg-[linear-gradient(180deg,rgba(255,180,171,0.02),rgba(255,180,171,0.65),rgba(255,180,171,0.02))]" style={{ left: `${spikeOffset}px` }} />
            <div className="absolute top-11 h-2 w-2 rounded-full bg-[rgba(255,180,171,0.88)] shadow-[0_0_18px_rgba(255,180,171,0.9)]" style={{ left: `${spikeOffset - 4}px` }} />
          </>
        ) : null}
        <div className="absolute inset-x-[170px] top-24 h-24">
          <svg className="h-full w-full" viewBox={`0 0 ${priceWidth} ${priceHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="linkagePriceGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(173,199,255,0.40)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.92)" />
              </linearGradient>
              <linearGradient id="linkagePriceArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(173,199,255,0.22)" />
                <stop offset="100%" stopColor="rgba(173,199,255,0.01)" />
              </linearGradient>
            </defs>
            <path d={priceAreaPath} fill="url(#linkagePriceArea)" />
            <path d={pricePath} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" strokeLinecap="round" />
            <path d={pricePath} fill="none" stroke="url(#linkagePriceGlow)" strokeWidth="2.8" strokeLinecap="round" />
            {pricePoints.map((point, index) => (
              <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r={priceWindow[index]?.date === spike?.date ? 4.5 : 2.5} fill={priceWindow[index]?.date === spike?.date ? 'rgba(255,180,171,0.9)' : 'rgba(225,226,235,0.45)'} />
            ))}
          </svg>
        </div>
        <div className="absolute inset-x-[170px] top-[246px] flex items-end gap-6">
          <svg className="h-[118px] w-full" viewBox={`0 0 ${sentimentWidth} ${sentimentHeight}`} preserveAspectRatio="none">
            <line x1="0" y1="51" x2={sentimentWidth} y2="51" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            {positiveArea ? <polygon points={`0,51 ${positiveArea} ${sentimentWidth},51`} fill="rgba(45,219,222,0.14)" /> : null}
            {negativeArea ? <polygon points={`0,51 ${negativeArea} ${sentimentWidth},51`} fill="rgba(178,34,34,0.14)" /> : null}
            <path d={buildSmoothPath(sentimentPoints)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="7" strokeLinecap="round" />
            <path d={buildSmoothPath(sentimentPoints)} fill="none" stroke="rgba(178,34,34,0.94)" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute inset-x-[170px] bottom-14 flex items-end justify-between gap-4">
          {volumeWindow.map((item) => (
            <div
              key={item.date}
              className={`flex-1 rounded-t-[12px] shadow-[0_0_16px_rgba(255,255,255,0.04)] ${spike?.date === item.date ? 'bg-[linear-gradient(180deg,rgba(255,180,171,0.96),rgba(178,34,34,0.74))]' : item.value === maxVolume ? 'bg-[linear-gradient(180deg,rgba(253,184,83,0.92),rgba(253,139,0,0.62))]' : 'bg-[linear-gradient(180deg,rgba(120,128,145,0.46),rgba(255,255,255,0.10))]'}`}
              style={{ height: `${Math.max(18, (item.value / maxVolume) * 88)}px` }}
            />
          ))}
        </div>
        <div className="absolute inset-x-[170px] bottom-0 flex justify-between px-1 font-label text-[10px] uppercase tracking-[0.12em] text-[var(--color-outline)]">
          {volumeWindow.map((item) => (
            <span key={item.date}>{item.date.slice(5)}</span>
          ))}
        </div>
        {latestPrice && priceAnnotation ? (
          <div className="absolute left-[206px] top-[94px] rounded-2xl border border-[rgba(173,199,255,0.12)] bg-[rgba(10,16,26,0.86)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] shadow-[0_0_24px_rgba(0,0,0,0.22)]">
            <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-secondary-container)]">价格回撤确认</div>
            <div className="mt-1 text-white">收盘价 ¥{latestPrice.value.toFixed(2)}</div>
          </div>
        ) : null}
        {priceAnnotation ? (
          <div
            className="absolute border-t border-dashed border-[rgba(173,199,255,0.34)]"
            style={{ left: '278px', top: '132px', width: `${Math.max(priceAnnotation.x - 108, 16)}px` }}
          />
        ) : null}
        {latestSentiment && sentimentAnnotation ? (
          <div className="absolute left-[206px] top-[276px] rounded-2xl border border-[rgba(255,180,171,0.12)] bg-[rgba(32,16,18,0.84)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] shadow-[0_0_24px_rgba(0,0,0,0.22)]">
            <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]">情绪转负</div>
            <div className="mt-1 text-white">{latestSentiment.value.toFixed(2)}</div>
          </div>
        ) : null}
        {sentimentAnnotation ? (
          <div
            className="absolute border-t border-dashed border-[rgba(255,180,171,0.34)]"
            style={{ left: '278px', top: '314px', width: `${Math.max(sentimentAnnotation.x - 108, 16)}px` }}
          />
        ) : null}
        {latestVolume ? (
          <div
            className="absolute rounded-2xl border border-[rgba(253,139,0,0.14)] bg-[rgba(49,28,12,0.82)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] shadow-[0_0_24px_rgba(0,0,0,0.22)]"
            style={{ left: `${170 + volumeAnnotationX}px`, bottom: '126px' }}
          >
            <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[#FDB953]">热度先抬升</div>
            <div className="mt-1 text-white">{latestVolume.value} 条</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
