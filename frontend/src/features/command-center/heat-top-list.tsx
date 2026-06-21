import { useNavigate } from 'react-router-dom';

import type { CommandCenterDashboardData } from '../../lib/api/types';
import { riskChipClass } from '../../lib/risk-level';
import { useFiltersStore } from '../../store/filters';

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function HeatTopList({
  rows,
}: {
  rows: CommandCenterDashboardData['heat_top10'];
}) {
  const navigate = useNavigate();
  const { startDate, endDate, setFilters } = useFiltersStore();

  return (
    <section className="intel-frame intel-grid ambient-shadow-strong rounded-[26px] border border-[rgba(173,199,255,0.14)] bg-[linear-gradient(160deg,rgba(23,28,39,0.98),rgba(16,21,31,0.96),rgba(20,28,40,0.94))] p-5 md:p-6">
      <div className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(173,199,255,0.4),transparent)]" />
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="intel-kicker">重点观察名单</div>
          <h3 className="font-headline text-[20px] font-bold text-white md:text-[22px]">实时舆情热度榜前十</h3>
          <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">面向券商风控席位的重点观察名单，按热度与风险优先排序。</p>
        </div>
        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">热度排序</div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <button
            key={row.ticker}
            type="button"
            aria-label={`查看${row.stock_name}单股详情`}
            onClick={() => {
              setFilters({
                ticker: row.ticker,
                startDate,
                endDate,
              });
              navigate('/stock');
            }}
            className="intel-frame grid w-full grid-cols-[44px,minmax(0,1fr),84px] items-center gap-3 rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3 py-3 text-left transition-colors hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] focus:outline-none focus:ring-2 focus:ring-[rgba(45,219,222,0.28)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(173,199,255,0.16)] bg-[linear-gradient(135deg,rgba(173,199,255,0.18),rgba(94,113,148,0.08))] font-headline text-lg font-extrabold text-white">
              {row.rank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-headline text-lg font-bold text-white">{row.stock_name}</span>
                <span className="font-label text-[11px] uppercase tracking-[0.14em] text-[var(--color-outline)]">{row.ticker}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                <span>热度 {row.heat_score}</span>
                <span>情绪 {row.sentiment_score.toFixed(2)}</span>
                <span className={`rounded-full px-2 py-1 font-label text-[10px] uppercase tracking-[0.14em] ${riskChipClass(row.risk_level)}`}>{row.risk_level}风险</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-headline text-xl font-bold text-white">{row.heat_score}</div>
              <div className={`mt-1 font-label text-xs ${row.change_pct >= 0 ? 'text-[var(--color-secondary-container)]' : 'text-[var(--color-error)]'}`}>
                {formatPercent(row.change_pct)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
