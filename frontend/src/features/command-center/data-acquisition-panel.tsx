import type { AcquisitionSummaryResponse, ProjectEvidenceResponse } from '../../lib/api/types';

const SELECTION_MODE_LABELS: Record<string, string> = {
  guba_hot: '股吧热度优先 + 公开股票池补足',
  pct_gain: '涨幅榜优先选取',
  pct_loss: '跌幅榜优先选取',
  turnover: '成交额榜优先选取',
  random: '随机抽样选取',
};

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN');
}

type CompositionSegment = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export function DataAcquisitionPanel({
  evidence,
  acquisition,
}: {
  evidence: ProjectEvidenceResponse | null;
  acquisition: AcquisitionSummaryResponse | null;
}) {
  const totalRecords = evidence?.dataset.total_records ?? 0;
  const commentCount = evidence?.dataset.total_comment_count ?? 0;
  const newsCount = evidence?.dataset.total_news_count ?? 0;
  const announcementCount = Math.max(totalRecords - commentCount - newsCount, 0);
  const compositionBase = Math.max(commentCount + newsCount + announcementCount, 1);

  const rawSegments: Array<Omit<CompositionSegment, 'percent'>> = [
    { label: '股吧讨论', value: commentCount, color: 'var(--color-error)' },
    { label: '媒体新闻', value: newsCount, color: 'var(--color-tertiary)' },
    { label: '官方公告', value: announcementCount, color: 'var(--color-primary)' },
  ];
  const segments: CompositionSegment[] = rawSegments
    .filter((segment) => segment.value > 0)
    .map((segment) => ({ ...segment, percent: (segment.value / compositionBase) * 100 }));

  const poolCount = acquisition?.stock_pool_count ?? evidence?.dataset.unique_stocks ?? 0;
  const selectionLabel = SELECTION_MODE_LABELS[acquisition?.selection_mode ?? ''] ?? acquisition?.selection_mode ?? '--';
  const windowStart = acquisition?.window_start ?? evidence?.dataset.window_start ?? '--';
  const windowEnd = acquisition?.window_end ?? evidence?.dataset.window_end ?? '--';

  return (
    <section className="intel-frame relative overflow-hidden rounded-[24px] border border-[rgba(173,199,255,0.16)] bg-[linear-gradient(160deg,rgba(20,26,38,0.98),rgba(15,20,30,0.96),rgba(28,22,30,0.95))] p-5 md:p-6">
      <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(45,219,222,0.4),transparent)]" />
      <div className="relative grid gap-4 md:grid-cols-3">
        <div className="rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">股票池规模</div>
          <div className="mt-2 font-headline text-[26px] font-extrabold leading-none text-white">{formatNumber(poolCount)}</div>
          <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">支 A 股标的</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(45,219,222,0.18)] bg-[rgba(45,219,222,0.08)] px-4 py-3">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">统一文本事件</div>
          <div className="mt-2 font-headline text-[26px] font-extrabold leading-none text-white">{formatNumber(totalRecords)}</div>
          <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">条多源舆情样本</div>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">采集窗口</div>
          <div className="mt-2 font-headline text-[15px] font-bold leading-tight text-white">{windowStart} 至 {windowEnd}</div>
          <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{selectionLabel}</div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">文本事件来源构成</div>
        {segments.length ? (
          <>
            <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              {segments.map((segment) => (
                <div
                  key={segment.label}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${segment.percent}%`, background: segment.color }}
                  title={`${segment.label} ${formatNumber(segment.value)} 条`}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.color }} />
                  <span className="font-label text-[11px] uppercase tracking-[0.12em] text-[var(--color-on-surface-variant)]">{segment.label}</span>
                  <span className="font-headline text-sm font-bold text-white">{formatNumber(segment.value)}</span>
                  <span className="font-label text-[11px] text-[var(--color-outline)]">{segment.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">当前未读取到来源构成数据，等待数据包接入后自动展示。</p>
        )}
      </div>
    </section>
  );
}
