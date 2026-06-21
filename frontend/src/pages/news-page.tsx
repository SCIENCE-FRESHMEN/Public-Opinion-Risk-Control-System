import { useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Icon } from '../components/common/icon';
import { useNewsDatesQuery } from '../features/news/useNewsDatesQuery';
import { useNewsDrilldownQuery } from '../features/news/useNewsDrilldownQuery';
import { useInstrumentName } from '../features/meta/useInstrumentName';
import { useFiltersQuery } from '../features/meta/useFiltersQuery';
import { useSubmissionStockCoverageQuery } from '../features/meta/useSubmissionStockCoverageQuery';
import { DriverTags } from '../features/news/driver-tags';
import { NewsFeed } from '../features/news/news-feed';
import { SourceCoveragePanel } from '../features/news/source-coverage-panel';
import { useFiltersStore } from '../store/filters';

const MEMBER_B_SENTIMENT_DISTRIBUTION_SRC = '/member-b-charts/02_sentiment_distribution.png';

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function localizeDriver(term: string) {
  const normalized = term.trim().toLowerCase();
  const labels: Record<string, string> = {
    antitrust: '反垄断',
    investigation: '调查',
    downgrade: '下调评级',
    fine: '罚款',
    lawsuit: '诉讼',
    regulatory: '监管',
  };
  return labels[normalized] ?? term;
}

export function NewsPage() {
  const { ticker, startDate, endDate, setFilters } = useFiltersStore();
  const [searchParams] = useSearchParams();
  const filtersQuery = useFiltersQuery();
  const datesQuery = useNewsDatesQuery();
  const datesData = datesQuery.data ?? {
    dates: [],
    range_start: startDate,
    range_end: endDate,
    latest_anchor_in_range: null,
  };
  const availableDates = useMemo(() => datesData.dates ?? [], [datesData.dates]);
  const [selectedDate, setSelectedDate] = useState(endDate || '');
  const queryAlertDate = searchParams.get('alertDate') ?? '';
  const dateInputId = useId();
  const isSelectedDateInGlobalRange =
    Boolean(selectedDate) &&
    (!startDate || selectedDate >= startDate) &&
    (!endDate || selectedDate <= endDate);

  useEffect(() => {
    setSelectedDate('');
  }, [ticker]);

  useEffect(() => {
    if (endDate && !selectedDate) {
      setSelectedDate(endDate);
    }
  }, [endDate, selectedDate]);

  useEffect(() => {
    if (!queryAlertDate) {
      return;
    }

    const isQueryDateInGlobalRange =
      (!startDate || queryAlertDate >= startDate) &&
      (!endDate || queryAlertDate <= endDate);

    if (isQueryDateInGlobalRange) {
      setSelectedDate(queryAlertDate);
    }
  }, [endDate, queryAlertDate, startDate]);

  useEffect(() => {
    if (!availableDates.length) {
      setSelectedDate('');
      return;
    }

    if (!selectedDate || !isSelectedDateInGlobalRange) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, isSelectedDateInGlobalRange, queryAlertDate, selectedDate]);

  useEffect(() => {
    if (!availableDates.length && endDate) {
      setSelectedDate(endDate);
    }
  }, [availableDates.length, endDate]);

  const activeDate = selectedDate || availableDates[0] || endDate || '';
  const drilldownQuery = useNewsDrilldownQuery(ticker, activeDate);
  const coverageQuery = useSubmissionStockCoverageQuery(ticker);
  const drilldownData = drilldownQuery.data ?? {
    header: {
      ticker,
      alert_date: activeDate,
      range_start: startDate,
      range_end: endDate,
      summary: '当前暂无可展示新闻，页面保留结构化占位以便继续切换日期或股票。',
    },
    news_items: [],
    drivers: [],
    stats: {
      negative_ratio: 0,
      negative_vs_30d: 0,
      total_signals: 0,
    },
    anchor: {
      anchor_date: activeDate,
      note: '当前股票或日期范围内暂无可展示新闻，可切换股票或手动调整日期继续查看。',
      in_range: true,
    },
  };
  const data = drilldownData;
  const instrumentName = useInstrumentName(data.header.ticker ?? ticker);
  const coverageData = coverageQuery.data ?? null;
  const dateRangeLabel = `${startDate} 至 ${endDate}`;
  const hasDatesInRange = availableDates.length > 0;
  const hasNewsItems = (data?.news_items?.length ?? 0) > 0;
  const availableInstruments = filtersQuery.data?.instrument_groups?.flatMap((group) => group.instruments) ?? [];
  const topDrivers = (data?.drivers ?? []).slice(0, 3).map((item) => `${localizeDriver(item.term)} ${item.count}`);
  const dominantTheme = topDrivers.length ? topDrivers.join('、') : '当前暂无明确主题';
  const riskSummary = data.stats.negative_ratio >= 0.6
    ? `负面占比 ${formatPct(data.stats.negative_ratio)}，较近 30 日均值变动 ${data.stats.negative_vs_30d >= 0 ? '+' : ''}${formatPct(Math.abs(data.stats.negative_vs_30d))}，风险情绪已进入偏高区间。`
    : `负面占比 ${formatPct(data.stats.negative_ratio)}，整体仍处于可跟踪区间，需继续观察后续新闻扩散。`;
  const leadingNewsTitle = data.news_items[0]?.title ?? '当前暂无代表性新闻标题';
  const conclusionText = hasNewsItems
    ? `当前预警日围绕 ${dominantTheme} 展开，代表性新闻为《${leadingNewsTitle}》。`
    : '当前预警日暂无可用于生成主题结论的新闻样本。';

  return (
    <div className="space-y-6">
      <section className="intel-frame intel-grid relative overflow-hidden rounded-[28px] border border-[rgba(173,199,255,0.18)] bg-[radial-gradient(circle_at_top_left,rgba(173,199,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,180,171,0.12),transparent_28%),linear-gradient(135deg,rgba(15,18,28,0.98),rgba(23,29,43,0.96),rgba(50,31,37,0.94))] px-5 py-6 ambient-shadow-strong md:px-7 md:py-7">
        <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(45,219,222,0.4),transparent)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="intel-kicker">情绪因子证据层 · 原始舆情</div>
            <div className="mt-2 font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-outline)]">预警分析</div>
            <div className="mt-3 font-headline text-[40px] font-extrabold tracking-[-0.04em] text-white md:text-[50px]">舆情证据</div>
            <div className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{data?.header.summary ?? '正在分析由法务进展驱动的负面情绪激增。'}</div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
              <span>全局日期范围：{dateRangeLabel}</span>
              <span>{hasDatesInRange ? `范围内可选预警日：${availableDates.length} 个` : '当前范围内暂无可用预警日'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
          <div>
            <div className="mb-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">目标标的</div>
            <div className="flex items-center gap-2 rounded-2xl bg-[rgba(7,12,20,0.72)] px-4 py-2.5 ghost-border">
              <select
                value={ticker}
                onChange={(event) => setFilters({ ticker: event.target.value, startDate, endDate })}
                className="min-w-[160px] bg-transparent font-label text-sm text-white outline-none"
              >
                {!availableInstruments.length ? (
                  <option value={ticker}>{instrumentName || ticker}</option>
                ) : null}
                {availableInstruments.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.name} / {instrument.symbol}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" className="text-[16px] text-[var(--color-outline)]" />
            </div>
          </div>
          <div>
            <label htmlFor={dateInputId} className="mb-1 flex items-center gap-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">
              <Icon name="warning" className="text-[14px]" />
              预警日期
            </label>
            <div className="flex items-center gap-2 rounded-2xl bg-[rgba(7,12,20,0.72)] px-4 py-2.5 ghost-border">
              <Icon name="calendar_today" className="text-[16px] text-[var(--color-outline)]" />
              <input
                id={dateInputId}
                aria-label="预警日期"
                type="date"
                list="news-alert-dates"
                value={activeDate}
                min={startDate || activeDate}
                max={endDate || activeDate}
                onFocus={() => {
                  if (!selectedDate && activeDate) {
                    setSelectedDate(activeDate);
                  }
                }}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-[148px] bg-transparent font-label text-sm text-white outline-none [color-scheme:dark]"
              />
              <datalist id="news-alert-dates">
                {availableDates.map((date) => (
                  <option key={date} value={date} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.08fr,0.92fr,0.88fr]">
        <article className="rounded-2xl border border-[rgba(45,219,222,0.16)] bg-[rgba(45,219,222,0.08)] p-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">当日主题结论</div>
          <p className="mt-3 text-sm leading-7 text-white">{conclusionText}</p>
        </article>
        <article className="rounded-2xl border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.08)] p-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">风险摘要</div>
          <p className="mt-3 text-sm leading-7 text-white">{riskSummary}</p>
        </article>
        <article className="rounded-2xl border border-[rgba(173,199,255,0.18)] bg-[rgba(173,199,255,0.08)] p-4">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">重点观察主题</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(topDrivers.length ? topDrivers : ['当前暂无主题词']).map((item) => (
              <span key={item} className="rounded-full bg-[rgba(255,255,255,0.1)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-white">
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8"><NewsFeed items={data?.news_items ?? []} /></div>
        <div className="col-span-4 space-y-4">
          <DriverTags stats={data?.stats ?? { negative_ratio: 0, negative_vs_30d: 0, total_signals: 0 }} drivers={data?.drivers ?? []} />
          <SourceCoveragePanel coverage={coverageData} />
          <section className="rounded-[24px] border border-[rgba(255,208,102,0.16)] bg-[linear-gradient(150deg,rgba(34,32,24,0.98),rgba(45,38,31,0.94),rgba(24,28,34,0.96))] p-4 ambient-shadow">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[#ffd36d]">算法证据补强</div>
                <div className="mt-2 font-headline text-[20px] font-bold text-white">算法情绪附证图</div>
              </div>
              <div className="rounded-full bg-[rgba(255,208,102,0.12)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.14em] text-[#ffd36d]">
                负面结构对比
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">
              这张离线情绪分布图用于补充说明当前新闻页里的“负面占比”和“驱动词判断”不是纯文案推断，而是有算法聚合结果支撑。
            </p>
            <a
              href={MEMBER_B_SENTIMENT_DISTRIBUTION_SRC}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]"
            >
              <img src={MEMBER_B_SENTIMENT_DISTRIBUTION_SRC} alt="情绪分布结构对比" className="h-auto w-full object-cover" />
            </a>
          </section>
        </div>
      </div>
      {!hasNewsItems ? (
        <div className="rounded-2xl border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.08)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface)]">
          当前窗口暂无新闻样本，已保留页面结构便于继续切换日期或股票。
        </div>
      ) : null}
      <div className="intel-frame ml-auto flex max-w-[520px] items-start gap-3 rounded-[22px] border border-[rgba(45,219,222,0.16)] bg-[rgba(54,57,64,0.82)] px-4 py-4 shadow-[0_0_28px_rgba(0,0,0,0.18)]">
        <Icon name="anchor" className="pt-1 text-[18px] text-[var(--color-tertiary)]" />
        <div>
          <div className="font-label text-[12px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">锚点日期：{data?.anchor.anchor_date ?? activeDate}</div>
          <div className="mt-1 text-sm leading-6 text-[var(--color-on-surface)]">{data?.anchor.note ?? '所有计算均相对于指定交易日收盘时点，预警参数已锁定。'}</div>
          {!hasDatesInRange ? (
            <div className="mt-2 text-sm leading-6 text-[var(--color-error)]">当前范围内暂无预警锚点，你仍可手动选择任意日期查看当天新闻。</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
