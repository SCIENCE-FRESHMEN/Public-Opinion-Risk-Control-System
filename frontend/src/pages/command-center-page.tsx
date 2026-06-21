import { Link } from 'react-router-dom';

import { MetricCard } from '../components/common/metric-card';
import { CommandCenterChart } from '../features/command-center/command-center-chart';
import type { CommandCenterDashboardData } from '../lib/api/types';
import { useCommandCenterPageData } from '../features/command-center/use-command-center-page-data';
import { riskDotColor } from '../lib/risk-level';

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN');
}

function formatPriceChange(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// 概要结论展示的四个研判维度，与 AI 简报字段一一对应。
const CONCLUSION_VIEWS = [
  ['摘要研判', 'summary'],
  ['情绪观察', 'sentiment_view'],
  ['风险提示', 'risk_view'],
  ['席位建议', 'action_view'],
] as const;

type CommandCenterPageProps = {
  dashboard?: CommandCenterDashboardData;
};

export function CommandCenterPage({ dashboard: dashboardProp }: CommandCenterPageProps) {
  const { dashboard: resolvedDashboard } = useCommandCenterPageData();
  const dashboard = dashboardProp ?? resolvedDashboard;
  const featured = dashboard.featured_stock;
  const brief = dashboard.ai_brief;

  return (
    <div className="space-y-6 md:space-y-7">
      {/* 介绍：一句话点题 + 四个关键指标 */}
      <section className="intel-frame intel-grid relative overflow-hidden rounded-[30px] border border-[rgba(173,199,255,0.18)] bg-[radial-gradient(circle_at_top_left,rgba(173,199,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,180,171,0.14),transparent_28%),linear-gradient(135deg,rgba(15,18,28,0.98),rgba(25,31,46,0.95),rgba(48,29,36,0.94))] px-5 py-6 ambient-shadow-strong md:px-7 md:py-7">
        <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(45,219,222,0.4),transparent)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="intel-kicker">情绪因子总览 · 量价之外的增量信号</div>
            <h1 className="mt-3 font-headline text-[34px] font-extrabold leading-tight tracking-[-0.05em] text-white md:text-[48px]">
              {dashboard.header.title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">
              把多源舆情情绪作为量价之外的一类增量因子，补充量化研究的盲区。
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[rgba(45,219,222,0.12)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-tertiary)]">
                {dashboard.header.market_status}
              </span>
              <span className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
                更新时间 {dashboard.header.as_of}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:min-w-[520px]">
            <MetricCard title="覆盖标的">
              <div className="font-headline text-[34px] font-extrabold leading-none text-white">{dashboard.header.monitored_stocks}</div>
            </MetricCard>
            <MetricCard title="舆情样本" accent="var(--color-secondary-container)">
              <div className="font-headline text-[34px] font-extrabold leading-none text-white">{formatNumber(dashboard.header.total_records)}</div>
            </MetricCard>
            <MetricCard title="活跃预警" accent="var(--color-error)">
              <div className="font-headline text-[34px] font-extrabold leading-none text-white">{dashboard.header.active_alerts}</div>
            </MetricCard>
            <MetricCard title="谣言事件" accent="var(--color-tertiary)">
              <div className="font-headline text-[34px] font-extrabold leading-none text-white">{dashboard.header.rumor_events}</div>
            </MetricCard>
          </div>
        </div>
      </section>

      {/* 核心可视化：价格 / 情绪 / 热度联动 */}
      <CommandCenterChart
        series={dashboard.linkage_series}
        topicTags={dashboard.topic_tags}
        title={`${featured.stock_name}焦点区`}
        description={`将情绪因子与价格、热度同屏对照，观察${featured.stock_name}的情绪信号相对量价是否提供了增量拐点提示。`}
        riskLevel={featured.risk_level}
      />

      {/* 概要结论：AI 研判一句话 + 四个维度 */}
      <section className="intel-frame ambient-shadow relative overflow-hidden rounded-[26px] border border-[rgba(255,180,171,0.2)] bg-[linear-gradient(145deg,rgba(34,38,49,0.98),rgba(53,31,38,0.92))] p-5 md:p-6">
        <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,180,171,0.38),transparent)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="intel-kicker">AI 研判概要结论</div>
            <h2 className="mt-3 font-headline text-xl font-bold leading-snug text-white md:text-2xl">{brief.headline}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-label text-[11px] tracking-[0.04em] text-white">
              {featured.stock_name}
              <span className="text-[var(--color-outline)]">{featured.ticker}</span>
            </span>
            <span className={`rounded-full border border-white/8 bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-label text-[11px] tracking-[0.04em] ${featured.price_change_pct >= 0 ? 'text-[var(--color-secondary-container)]' : 'text-[var(--color-error)]'}`}>
              ¥{featured.latest_price.toFixed(2)} · {formatPriceChange(featured.price_change_pct)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-label text-[11px] tracking-[0.04em] text-[var(--color-on-surface-variant)]">
              <span className="h-2 w-2 rounded-full" style={{ background: riskDotColor(featured.risk_level) }} />
              风险 {featured.risk_level}
            </span>
          </div>
        </div>
        <div className="relative mt-5 grid gap-3 md:grid-cols-2">
          {CONCLUSION_VIEWS.map(([label, key]) => (
            <div key={key} className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-tertiary)]" />
                <span className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">{label}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-white">{brief[key]}</p>
            </div>
          ))}
        </div>
        <div className="relative mt-5 flex justify-end">
          <Link
            to="/stock"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(45,219,222,0.18)] bg-[rgba(45,219,222,0.08)] px-4 py-2 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-tertiary)] transition-colors hover:bg-[rgba(45,219,222,0.14)]"
          >
            进入单股详情
          </Link>
        </div>
      </section>
    </div>
  );
}
