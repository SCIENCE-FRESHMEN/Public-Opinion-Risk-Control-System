import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CommandCenterDashboardData, RiskLevel } from '../../lib/api/types';
import { riskDotColor } from '../../lib/risk-level';

type ChartRow = {
  date: string;
  price: number;
  sentiment: number;
  heat: number;
};

type LaneMetric = 'price' | 'sentiment' | 'heat';
const MAX_VISIBLE_ROWS = 45;

function formatMetricValue(metric: LaneMetric, value: number) {
  if (metric === 'price') {
    return `¥${value.toFixed(2)}`;
  }

  if (metric === 'sentiment') {
    return value.toFixed(2);
  }

  return value.toFixed(0);
}

function buildDomain(values: number[]): [number, number] {
  if (values.length === 0) {
    return [0, 1];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    const padding = Math.max(Math.abs(min) * 0.08, metricFallbackPadding(min), 0.2);
    return [min - padding, max + padding];
  }

  const padding = Math.max(range * 0.18, 0.08);
  return [min - padding, max + padding];
}

function metricFallbackPadding(value: number) {
  if (Math.abs(value) >= 100) return 5;
  if (Math.abs(value) >= 10) return 0.8;
  return 0.15;
}

export function buildChartRows(series: CommandCenterDashboardData['linkage_series']): ChartRow[] {
  const rowsByDate = new Map<string, Partial<ChartRow> & { date: string }>();

  for (const item of series.price) {
    rowsByDate.set(item.date, { ...(rowsByDate.get(item.date) ?? { date: item.date.slice(5) }), price: item.value, date: item.date.slice(5) });
  }

  for (const item of series.sentiment) {
    rowsByDate.set(item.date, { ...(rowsByDate.get(item.date) ?? { date: item.date.slice(5) }), sentiment: item.value, date: item.date.slice(5) });
  }

  for (const item of series.heat) {
    rowsByDate.set(item.date, { ...(rowsByDate.get(item.date) ?? { date: item.date.slice(5) }), heat: item.value, date: item.date.slice(5) });
  }

  const mergedRows = [...rowsByDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, row]) => ({
      date: row.date,
      price: row.price ?? 0,
      sentiment: row.sentiment ?? 0,
      heat: row.heat ?? 0,
    }));

  if (mergedRows.length <= MAX_VISIBLE_ROWS) {
    return mergedRows;
  }

  const lastActiveIndex = [...mergedRows]
    .reverse()
    .findIndex((row) => row.price !== 0 || row.sentiment !== 0 || row.heat !== 0);
  const endIndex = lastActiveIndex === -1 ? mergedRows.length - 1 : mergedRows.length - lastActiveIndex - 1;
  const startIndex = Math.max(0, endIndex - MAX_VISIBLE_ROWS + 1);
  return mergedRows.slice(startIndex, endIndex + 1);
}

function Lane({
  title,
  metric,
  color,
  fill,
  rows,
  domain,
  anchorDate,
  showXAxis = false,
}: {
  title: string;
  metric: LaneMetric;
  color: string;
  fill: string;
  rows: ChartRow[];
  domain: [number, number];
  anchorDate?: string;
  showXAxis?: boolean;
}) {
  return (
    <div className="intel-frame relative rounded-[22px] border border-[rgba(173,199,255,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-3">
      <div className="absolute left-3 top-3 h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 14px ${color}` }} />
      <div className="mb-2 flex items-center justify-between pl-5">
        <div className="font-label text-[10px] uppercase tracking-[0.22em] text-[var(--color-outline)]">{title}</div>
        <div className="text-xs text-[var(--color-on-surface-variant)]">{rows.length ? formatMetricValue(metric, rows[rows.length - 1][metric]) : '--'}</div>
      </div>
      <div className="h-[82px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: showXAxis ? 0 : 2 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              hide={!showXAxis}
              tickLine={false}
              axisLine={false}
              stroke="rgba(225,226,235,0.45)"
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              stroke="rgba(225,226,235,0.45)"
              domain={domain}
              tickFormatter={(value) => {
                if (metric === 'price') return Number(value).toFixed(0);
                if (metric === 'sentiment') return Number(value).toFixed(1);
                return Number(value).toFixed(0);
              }}
            />
            <Tooltip
              formatter={(value) => [formatMetricValue(metric, Number(value)), title]}
              labelFormatter={(label) => `日期 ${label}`}
              contentStyle={{
                background: 'rgba(18, 20, 28, 0.96)',
                border: '1px solid rgba(173,199,255,0.18)',
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            {anchorDate ? <ReferenceLine x={anchorDate} stroke="rgba(255,180,171,0.72)" strokeDasharray="4 4" /> : null}
            <Area
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={2.4}
              fill={fill}
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function buildHeadlineDiagnosis(rows: ChartRow[]) {
  if (!rows.length) {
    return '当前窗口暂无足够样本形成首页联动诊断。';
  }

  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];
  const heatPeak = rows.reduce((peak, row) => (row.heat > peak.heat ? row : peak), rows[0]);
  const priceFell = lastRow.price < firstRow.price;
  const sentimentFell = lastRow.sentiment < firstRow.sentiment;

  if (heatPeak.date !== lastRow.date && priceFell) {
    return '热度先抬升后价格承压，情绪同步走弱，首页焦点区已形成较明确的风险共振。';
  }

  if (sentimentFell && priceFell) {
    return '价格与情绪同步回落，说明当前窗口内的舆情分歧正在向市场表现传导。';
  }

  return '热度、情绪与价格仍在拉扯中，当前更适合持续观察而非直接下结论。';
}

export function CommandCenterChart({
  series,
  topicTags,
  title,
  description,
  riskLevel,
  mode = 'overview',
}: {
  series: CommandCenterDashboardData['linkage_series'];
  topicTags: string[];
  title: string;
  description: string;
  riskLevel?: RiskLevel;
  mode?: 'overview' | 'single-stock';
}) {
  const rows = buildChartRows(series);
  const hasRows = rows.length > 0;
  const latestRow = rows[rows.length - 1];
  const firstRow = rows[0];
  const peakHeatRow = rows.reduce<ChartRow | undefined>((peak, row) => (!peak || row.heat > peak.heat ? row : peak), undefined);
  const anchorDate = peakHeatRow?.date ?? latestRow?.date;
  const diagnosis = buildHeadlineDiagnosis(rows);
  const singleStockHasPressure = Boolean(firstRow && latestRow && (latestRow.price < firstRow.price || latestRow.sentiment < firstRow.sentiment));
  const linkageType = mode === 'single-stock'
    ? (rows.length <= 1 || singleStockHasPressure ? '价格情绪共振' : '情绪主导')
    : (peakHeatRow && latestRow && peakHeatRow.date !== latestRow.date ? '热度先行' : '同步扰动');
  const diagnosisLabel = mode === 'single-stock' ? '单股联动诊断' : '联动诊断';
  const conclusionLabel = mode === 'single-stock' ? '个股观察结论' : '当前联动结论';
  const summaryLabel = mode === 'single-stock' ? '关键观察点' : '峰值热度';
  const summaryValue = mode === 'single-stock'
    ? `${latestRow ? formatMetricValue('sentiment', latestRow.sentiment) : '--'} / ${latestRow ? formatMetricValue('heat', latestRow.heat) : '--'}`
    : (peakHeatRow ? peakHeatRow.heat.toFixed(0) : '--');
  const summaryDescription = mode === 'single-stock' ? '情绪 / 热度' : undefined;

  const priceDomain = buildDomain(rows.map((row) => row.price));
  const sentimentDomain = buildDomain(rows.map((row) => row.sentiment));
  const heatDomain = buildDomain(rows.map((row) => row.heat));

  return (
    <section className="intel-frame intel-grid ambient-shadow-strong rounded-[26px] border border-[rgba(173,199,255,0.14)] bg-[linear-gradient(160deg,rgba(23,28,39,0.98),rgba(16,21,31,0.96),rgba(31,24,28,0.95))] p-5 md:p-6">
      <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(45,219,222,0.38),transparent)]" />
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="intel-kicker">联动信号舱</div>
          <h3 className="mt-2 font-headline text-[22px] font-bold text-white md:text-[26px]">{title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-on-surface-variant)]">{description}</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-outline)]">三层共用同一时间轴与预警锚线，分别展示价格、情绪与热度变化</p>
        </div>
        <div className="grid min-w-[220px] grid-cols-3 gap-3">
          <div className="intel-frame rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.04)] px-3 py-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">最新价格</div>
            <div className="mt-2 font-headline text-2xl font-extrabold text-white">{latestRow ? formatMetricValue('price', latestRow.price) : '--'}</div>
          </div>
          <div className="intel-frame rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.04)] px-3 py-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">情绪分数</div>
            <div className="mt-2 font-headline text-2xl font-extrabold text-white">{latestRow ? formatMetricValue('sentiment', latestRow.sentiment) : '--'}</div>
          </div>
          <div className="intel-frame rounded-[18px] border border-white/8 bg-[rgba(255,255,255,0.04)] px-3 py-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">热度指数</div>
            <div className="mt-2 font-headline text-2xl font-extrabold text-white">{latestRow ? formatMetricValue('heat', latestRow.heat) : '--'}</div>
          </div>
        </div>
      </div>
      {riskLevel ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">
          <span className="h-2 w-2 rounded-full" style={{ background: riskDotColor(riskLevel) }} />
          当前风险等级：{riskLevel}
        </div>
      ) : null}
      {hasRows ? (
        <>
          <div className="mb-4 grid gap-3 xl:grid-cols-[1.2fr,0.8fr]">
            <article className="rounded-[22px] border border-[rgba(173,199,255,0.12)] bg-[linear-gradient(145deg,rgba(173,199,255,0.08),rgba(255,255,255,0.02))] px-4 py-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">{diagnosisLabel}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">{conclusionLabel}</div>
                  <div className="mt-2 text-sm leading-7 text-white">{diagnosis}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                  <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-3">
                    <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">联动类型</div>
                    <div className="mt-2 font-headline text-[18px] font-bold text-white">{linkageType}</div>
                  </div>
                  <div className="rounded-[18px] border border-[rgba(255,180,171,0.12)] bg-[rgba(255,180,171,0.06)] px-3 py-3">
                    <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">关键锚点</div>
                    <div className="mt-2 font-headline text-[18px] font-bold text-white">{anchorDate ?? '--'}</div>
                  </div>
                  <div className="rounded-[18px] border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.06)] px-3 py-3">
                    <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">{summaryLabel}</div>
                    <div className="mt-2 font-headline text-[18px] font-bold text-white">{summaryValue}</div>
                    {summaryDescription ? <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{summaryDescription}</div> : null}
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div className="space-y-3 rounded-[22px] border border-[rgba(173,199,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.008))] p-3 md:p-4">
            <Lane title="价格走势" metric="price" color="rgba(173,199,255,0.98)" fill="rgba(173,199,255,0.16)" rows={rows} domain={priceDomain} anchorDate={anchorDate} />
            <Lane title="情绪走势" metric="sentiment" color="rgba(45,219,222,0.98)" fill="rgba(45,219,222,0.14)" rows={rows} domain={sentimentDomain} anchorDate={anchorDate} />
            <Lane title="热度走势" metric="heat" color="rgba(255,180,171,0.96)" fill="rgba(255,180,171,0.16)" rows={rows} domain={heatDomain} anchorDate={anchorDate} showXAxis />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {topicTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(173,199,255,0.16)] bg-[rgba(173,199,255,0.08)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.14em] text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-5 py-8">
          <div className="font-headline text-[22px] font-bold text-white">当前窗口样本不足</div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
            暂无法形成有效的价格、情绪与热度联动走势。请切换股票，或调整日期范围后重试。
          </p>
        </div>
      )}
    </section>
  );
}
