import { useNavigate } from 'react-router-dom';

import type { CommandCenterDashboardData } from '../../lib/api/types';
import { riskChipClass } from '../../lib/risk-level';
import { useFiltersStore } from '../../store/filters';

export function RiskEventList({
  events,
}: {
  events: CommandCenterDashboardData['risk_events'];
}) {
  const navigate = useNavigate();
  const { startDate, endDate, setFilters } = useFiltersStore();

  return (
    <section className="intel-frame intel-grid ambient-shadow-strong rounded-[26px] border border-[rgba(255,180,171,0.16)] bg-[linear-gradient(160deg,rgba(28,23,27,0.98),rgba(21,20,28,0.96),rgba(33,24,29,0.94))] p-5 md:p-6">
      <div className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,180,171,0.42),transparent)]" />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="intel-kicker">风险快线</div>
          <h3 className="font-headline text-[20px] font-bold text-white md:text-[22px]">风险事件快线</h3>
          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">聚焦传播速度快、容易触发交易席位关注的事件片段。</p>
        </div>
        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">事件流</div>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <button
            key={`${event.time}-${event.title}`}
            type="button"
            aria-label={`查看${event.stock_name}风险事件详情`}
            onClick={() => {
              setFilters({
                ticker: event.ticker,
                startDate,
                endDate,
              });
              navigate(`/news?alertDate=${event.time.slice(0, 10)}`);
            }}
            className="intel-frame w-full rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-4 text-left transition-colors hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] focus:outline-none focus:ring-2 focus:ring-[rgba(255,180,171,0.28)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-outline)]">{event.time}</div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[rgba(45,219,222,0.1)] px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-tertiary)]">{event.stock_name}</span>
                <span className="rounded-full bg-[rgba(173,199,255,0.12)] px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.14em] text-white">{event.source}</span>
                <span className={`rounded-full px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.14em] ${riskChipClass(event.severity)}`}>{event.severity}风险</span>
              </div>
            </div>
            <div className="mt-3 font-headline text-lg font-bold text-white">{event.title}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
