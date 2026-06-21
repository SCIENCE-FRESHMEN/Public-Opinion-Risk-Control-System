import type { OverviewResponse } from '../../lib/api/types';

function localizeAlertType(value: string) {
  const normalized = value.trim().toLowerCase();
  const labels: Record<string, string> = {
    news_heat_spike: '新闻热度激增',
    volume_surge: '舆情量异常激增',
    negative_sentiment_spike: '负面情绪激增',
    rumor_spike: '谣言风险抬升',
    algorithm_watch: '算法监测中',
  };

  return labels[normalized] ?? value;
}

export function RecentAlertsTable({
  rows,
  title = '近期风险预警',
  metaLabel = '查看全部日志',
}: {
  rows: OverviewResponse['alerts'];
  title?: string;
  metaLabel?: string;
}) {
  const getSeverityClassName = (severity: string) => {
    if (severity === 'HIGH' || severity === '高') {
      return 'bg-[var(--color-error-container)] text-white';
    }
    if (severity === 'MEDIUM' || severity === '中') {
      return 'bg-[rgba(253,139,0,0.3)] text-[var(--color-secondary)]';
    }
    return 'bg-[rgba(255,255,255,0.07)] text-[var(--color-on-surface-variant)]';
  };

  return (
    <section className="overflow-hidden rounded-xl bg-[var(--color-surface-container)] ambient-shadow">
      <div className="flex items-center justify-between bg-white/[0.02] px-6 py-5">
        <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">{title}</div>
        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-primary)]">{metaLabel}</div>
      </div>
      <div className="px-6 py-4">
        <div className="grid grid-cols-[126px_138px_92px_1fr] gap-6 border-b border-white/5 pb-3 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">
          <span>时间戳</span>
          <span>预警类型</span>
          <span>严重等级</span>
          <span>说明</span>
        </div>
        <div className="divide-y divide-white/5">
          {rows.length ? rows.map((row) => (
            <div key={`${row.trade_date}-${row.timestamp}-${row.alert_type}`} className="grid grid-cols-[126px_138px_92px_1fr] gap-6 bg-[rgba(255,255,255,0.02)] py-5 text-sm text-[var(--color-on-surface-variant)]">
              <div className="font-label leading-6 text-[var(--color-outline)]">{row.trade_date}<br />{row.timestamp}</div>
              <div className="font-body font-medium text-white">{localizeAlertType(row.alert_type)}</div>
              <div>
                <span className={`rounded-sm px-2 py-1 font-label text-[10px] font-bold uppercase tracking-[0.14em] ${getSeverityClassName(row.severity)}`}>
                  {row.severity}
                </span>
              </div>
              <div className="leading-6">{row.description}</div>
            </div>
          )) : (
            <div className="py-6 text-sm leading-7 text-[var(--color-on-surface-variant)]">
              当前窗口暂无关键预警节点。你可以切换股票、扩大日期范围，或回到单股详情页查看更细的风险时间线。
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
