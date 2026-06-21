import type { SubmissionStockCoverageResponse } from '../../lib/api/types';
import { Icon } from '../../components/common/icon';

const sourceLabelMap: Record<string, string> = {
  sina_news: '新浪财经',
  cninfo_announcement: '巨潮公告',
  sse_announcement: '上交所公告',
  eastmoney_guba: '东方财富股吧',
  tencent_quote: '腾讯行情',
};

function statusLabel(value: string) {
  if (value === 'OK') return '正常';
  if (value.startsWith('SKIP')) return '跳过';
  if (value.startsWith('ERROR')) return '异常';
  return value;
}

function sourceLabel(value: string) {
  return sourceLabelMap[value] ?? value;
}

export function SourceCoveragePanel({
  coverage,
}: {
  coverage: SubmissionStockCoverageResponse | null;
}) {
  if (!coverage) {
    return null;
  }

  const topSources = coverage.source_items.slice(0, 6);
  const total = Math.max(coverage.official_count + coverage.news_count + coverage.guba_count, 1);

  return (
    <div className="ambient-shadow relative overflow-hidden rounded-[24px] border border-[rgba(173,199,255,0.12)] bg-[linear-gradient(150deg,rgba(18,24,34,0.98),rgba(24,29,40,0.96),rgba(17,23,31,0.96))] p-5">
      <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-[rgba(173,199,255,0.08)] blur-3xl" />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">来源强度分布</div>
          <div className="mt-2 font-headline text-[20px] font-bold text-white md:text-[22px]">数据覆盖情报</div>
        </div>
        <Icon name="dashboard" className="text-[18px] text-[var(--color-outline)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-[rgba(173,199,255,0.10)] bg-[rgba(173,199,255,0.06)] px-4 py-3">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">活跃来源</div>
          <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{coverage.active_source_count}</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(45,219,222,0.10)] bg-[rgba(45,219,222,0.06)] px-4 py-3">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">行情状态</div>
          <div className="mt-2 font-headline text-[20px] font-bold text-white">{coverage.quote_status === 'OK' ? '正常' : coverage.quote_status}</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(255,180,171,0.10)] bg-[rgba(255,180,171,0.06)] px-4 py-3">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">官方公告</div>
          <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{coverage.official_count}</div>
          <div className="text-xs text-[var(--color-on-surface-variant)]">重点公告 {coverage.important_official_count} 条</div>
        </div>
        <div className="rounded-[18px] border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">媒体 / 讨论</div>
          <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{coverage.news_count + coverage.guba_count}</div>
          <div className="text-xs text-[var(--color-on-surface-variant)]">新闻 {coverage.news_count} / 股吧 {coverage.guba_count}</div>
        </div>
      </div>
      <div className="mt-4 rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">最近采集时间</div>
        <div className="mt-2 text-sm text-white">{coverage.latest_capture_time}</div>
        <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{coverage.stock_name} 当前报价 {coverage.quote.toFixed(2)}</div>
      </div>
      <div className="mt-4 rounded-[20px] border border-[rgba(173,199,255,0.10)] bg-[rgba(173,199,255,0.04)] px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">来源占比快照</div>
          <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">按样本量估计</div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          {topSources.map((item) => {
            const percent = Math.max(6, Math.round((item.record_count / total) * 100));
            const tone = item.source.includes('guba') || item.source.includes('股吧')
              ? 'bg-[var(--color-error)]'
              : item.source.includes('announcement') || item.source.includes('公告')
                ? 'bg-[var(--color-secondary-container)]'
                : 'bg-[var(--color-tertiary)]';
            return <div key={`band-${item.source}`} className={tone} style={{ width: `${percent}%` }} />;
          })}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {topSources.map((item) => {
          const percent = Math.min(100, Math.round((item.record_count / total) * 100));
          return (
            <div key={item.source} className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-white">{sourceLabel(item.source)}</div>
                <div className="text-xs text-[var(--color-on-surface-variant)]">{statusLabel(item.status)} · {item.record_count} 条</div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                <div className="h-full rounded-full bg-[var(--color-tertiary)]" style={{ width: `${Math.max(percent, item.record_count > 0 ? 8 : 0)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
