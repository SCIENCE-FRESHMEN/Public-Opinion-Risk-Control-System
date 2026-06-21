import type { NewsDrilldownResponse } from '../../lib/api/types';

const sourceLabels: Record<string, string> = {
  reuters: '路透',
  bloomberg: '彭博',
  sample_feed: '外部信源',
  sample: '外部信源',
};

const topicLabels: Record<string, string> = {
  legal: '法务',
  regulatory: '监管',
  earnings: '财报',
  product: '产品',
  macro: '宏观',
  market: '市场',
};

function localizeSource(source: string) {
  return sourceLabels[source.trim().toLowerCase()] ?? source;
}

function localizeTopic(tag: string) {
  return topicLabels[tag.trim().toLowerCase()] ?? tag;
}

export function NewsFeed({ items }: { items: NewsDrilldownResponse['news_items'] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="intel-kicker">信号流</div>
          <div className="mt-2 font-headline text-[20px] font-bold text-white md:text-[24px]">核心新闻流</div>
        </div>
        <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[var(--color-surface-container)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">{items.length} 条结果</div>
      </div>
      <div className="intel-frame overflow-hidden rounded-[26px] bg-[linear-gradient(160deg,rgba(25,29,39,0.98),rgba(15,18,25,0.96))] ring-1 ring-white/5 ambient-shadow-strong">
        {items.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="font-body text-[18px] font-semibold text-white">当天暂无可展示新闻</div>
            <div className="mt-2 text-sm leading-6 text-[var(--color-on-surface-variant)]">
              你可以切换预警日期，或调整全局时间范围后重新查看。
            </div>
          </div>
        ) : null}
        {items.map((item, index) => (
          <div key={item.id} className="border-b border-white/5 px-6 py-5 transition-colors hover:bg-[rgba(255,255,255,0.015)] last:border-b-0">
            {(() => {
              const localizedTopics = item.topic_tags.map(localizeTopic).filter(Boolean);

              return (
                <>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(173,199,255,0.12)] bg-[rgba(173,199,255,0.08)] font-label text-[11px] text-[var(--color-secondary-container)]">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0">
                  <div className="max-w-[600px] font-body text-[18px] font-semibold leading-[1.34] text-white">{item.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {localizedTopics.map((topic) => (
                      <span key={`${item.id}-${topic}`} className="rounded-full bg-[rgba(45,219,222,0.1)] px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-tertiary)]">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 font-label text-[11px] uppercase tracking-[0.14em] ${item.sentiment === '负面' ? 'bg-[var(--color-error-container)] text-white' : item.sentiment === '正面' ? 'bg-[rgba(45,219,222,0.2)] text-[var(--color-tertiary)]' : 'bg-[rgba(255,255,255,0.08)] text-[var(--color-on-surface-variant)]'}`}>{item.sentiment}</span>
                <div className="text-right">
                  <div className="font-headline text-lg font-bold text-[var(--color-error)]">{`${Math.round(item.confidence * 100)}%`}</div>
                  <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">置信度</div>
                </div>
              </div>
            </div>
            <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">
              {localizeSource(item.source)} &nbsp;&nbsp; {item.publish_time}
            </div>
            <div className="mt-3 max-w-[680px] text-sm leading-6 text-[var(--color-on-surface-variant)]">{item.summary}</div>
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </section>
  );
}
