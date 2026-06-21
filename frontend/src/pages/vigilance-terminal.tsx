import { useEffect, useRef, useState } from 'react';

import { Icon } from '../components/common/icon';
import { useAcquisitionSummaryQuery } from '../features/meta/useAcquisitionSummaryQuery';
import { useFiltersQuery } from '../features/meta/useFiltersQuery';
import { useInstrumentName } from '../features/meta/useInstrumentName';
import { useStatusQuery } from '../features/meta/useStatusQuery';
import { useFiltersStore } from '../store/filters';

const ARTIFACT_LABELS: Record<string, string> = {
  'prices.parquet': '价格行情数据',
  'news_clean.parquet': '新闻清洗结果',
  'news_sentiment.parquet': '新闻情绪结果',
  'daily_sentiment_features.parquet': '日度情绪特征',
  'risk_alerts.parquet': '风险预警结果',
  'backtest_results.parquet': '回测汇总结果',
  'backtest_event_results.parquet': '回测事件明细',
};

function formatArtifact(artifact: { name: string; path: string }) {
  return {
    title: ARTIFACT_LABELS[artifact.name] ?? artifact.name.replace(/\.parquet$/i, ''),
    detail: artifact.path ? '已生成并可用于页面联调' : '尚未生成，请检查数据处理流程',
  };
}

const MEMBER_B_SHARED_CHARTS = [
  {
    src: '/member-b-charts/01_sentiment_trends.png',
    title: '多股票情绪走势对比',
    description: '展示已覆盖样例股在观察窗口内的情绪加权得分变化，用于说明不同股票的舆情波动差异。',
  },
  {
    src: '/member-b-charts/02_sentiment_distribution.png',
    title: '情绪分布结构对比',
    description: '展示正面、中性、负面舆情占比，适合答辩时解释情绪结构而不是只看单一得分。',
  },
  {
    src: '/member-b-charts/04_risk_scores.png',
    title: '综合风险评分对比',
    description: '展示已覆盖样例股的风险评分与等级差异，突出算法对风险分层的解释价值。',
  },
  {
    src: '/member-b-charts/05_topic_heatmap.png',
    title: '主题热力图',
    description: '展示热点主题在不同样例股中的聚集程度，用于辅助说明行业内讨论焦点。',
  },
  {
    src: '/member-b-charts/06_overview_dashboard.png',
    title: '算法结果总览图',
    description: '将情绪、风险、主题等多个维度收敛到一张图内，适合作为算法附录的整屏展示。',
  },
] as const;

const MEMBER_B_RADAR_CHARTS: Record<string, string> = {
  '000539.SZ': '/member-b-charts/03_risk_radar_000539.png',
  '000690.SZ': '/member-b-charts/03_risk_radar_000690.png',
  '000791.SZ': '/member-b-charts/03_risk_radar_000791.png',
  '000875.SZ': '/member-b-charts/03_risk_radar_000875.png',
  '600900.SH': '/member-b-charts/03_risk_radar_600900.png',
};

export function VigilanceTerminalPage() {
  const filtersQuery = useFiltersQuery();
  const statusQuery = useStatusQuery();
  const acquisitionSummaryQuery = useAcquisitionSummaryQuery();
  const artifacts = statusQuery.data?.artifacts ?? [];
  const acquisitionSummary = acquisitionSummaryQuery.data ?? null;
  const hydratedRef = useRef(false);
  const { ticker, startDate, endDate, setFilters } = useFiltersStore();
  const [pendingTicker, setPendingTicker] = useState(ticker);
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    setPendingTicker(ticker);
    setPendingStartDate(startDate);
    setPendingEndDate(endDate);
  }, [ticker, startDate, endDate]);

  const defaults = filtersQuery.data?.defaults;
  const minDate = filtersQuery.data?.date_range.start ?? pendingStartDate;
  const maxDate = filtersQuery.data?.date_range.end ?? pendingEndDate;
  const tickers = filtersQuery.data?.tickers ?? [pendingTicker];
  const currentInstrumentName = useInstrumentName(ticker);
  const pendingInstrumentName = useInstrumentName(pendingTicker);
  const currentRadarChart = MEMBER_B_RADAR_CHARTS[ticker];

  const handleApplyFilters = () => {
    setFilters({
      ticker: pendingTicker,
      startDate: pendingStartDate,
      endDate: pendingEndDate,
    });
  };

  return (
    <div className="space-y-7">
      <section className="pb-2">
        <div className="font-headline text-[40px] font-extrabold tracking-[-0.04em] text-white md:text-[50px]">监控终端</div>
        <div className="mt-2 max-w-2xl text-sm text-[var(--color-on-surface-variant)]">用于检查产物可用性、锁定日期上下文与核心系统入口的正式监控面板。</div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">系统状态</div>
          <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">产物健康度</div>
        </div>
        <div className="rounded-xl bg-[var(--color-surface-container)] p-6 ambient-shadow">
          <div className="grid gap-3">
            {artifacts.map((artifact) => (
              <div key={artifact.name} className="flex items-center justify-between rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
                <div>
                  <div className="font-label text-sm text-white">{formatArtifact(artifact).title}</div>
                  <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{formatArtifact(artifact).detail}</div>
                </div>
                <div className={`rounded-full px-3 py-1 font-label text-[11px] uppercase tracking-[0.16em] ${artifact.exists ? 'bg-[rgba(45,219,222,0.16)] text-[var(--color-tertiary)]' : 'bg-[rgba(176,4,30,0.2)] text-[var(--color-error)]'}`}>
                  {artifact.exists ? '就绪' : '缺失'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">采集链路</div>
          <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">A 数据工程展示</div>
        </div>
        <div className="rounded-xl bg-[var(--color-surface-container)] p-6 ambient-shadow">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">股票池规模</div>
              <div className="mt-2 font-headline text-2xl text-white">{acquisitionSummary?.stock_pool_count ?? 0}</div>
              <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">补足策略 {acquisitionSummary?.selection_mode ?? '--'}</div>
            </div>
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">采集窗口</div>
              <div className="mt-2 font-label text-sm text-white">{`${acquisitionSummary?.window_start ?? '--'} → ${acquisitionSummary?.window_end ?? '--'}`}</div>
              <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">统一事件覆盖 {acquisitionSummary?.unified_event_coverage ?? 0} 支股票</div>
            </div>
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">股吧覆盖率</div>
              <div className="mt-2 font-headline text-2xl text-white">
                {Math.round(((acquisitionSummary?.coverage_items.find((item) => item.source === '东方财富股吧')?.coverage_ratio ?? 0) * 100))}%
              </div>
              <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
                {(() => {
                  const item = acquisitionSummary?.coverage_items.find((entry) => entry.source === '东方财富股吧');
                  return item ? `${item.covered}/${item.total}` : '--';
                })()}
              </div>
            </div>
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">新闻覆盖率</div>
              <div className="mt-2 font-headline text-2xl text-white">
                {Math.round(((acquisitionSummary?.coverage_items.find((item) => item.source === '新浪财经新闻')?.coverage_ratio ?? 0) * 100))}%
              </div>
              <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
                {(() => {
                  const item = acquisitionSummary?.coverage_items.find((entry) => entry.source === '新浪财经新闻');
                  return item ? `${item.covered}/${item.total}` : '--';
                })()}
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {(acquisitionSummary?.coverage_items ?? []).map((item) => (
              <div key={item.source} className="rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-label text-sm text-white">{item.source}</div>
                    <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{item.covered} / {item.total} 支股票有有效结果</div>
                  </div>
                  <div className="font-headline text-lg text-white">{Math.round(item.coverage_ratio * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[rgba(45,219,222,0.16)] bg-[rgba(45,219,222,0.08)] px-4 py-4">
            <div>
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">采集过程展示站</div>
              <div className="mt-1 text-sm text-white">用于展示数据采集流程、批次结果与网页化采集侧成果。</div>
              <div className="mt-1 text-xs text-[var(--color-on-surface-variant)]">最近采集时间 {acquisitionSummary?.latest_generated_at ?? '--'}</div>
            </div>
            <a
              href={acquisitionSummary?.external_site_url ?? 'https://tobykskgd.life/stock-opinion-web/'}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-[rgba(173,199,255,0.28)] bg-[var(--color-primary-container)] px-4 py-3 font-body text-sm font-medium text-white"
            >
              打开采集展示站
            </a>
          </div>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">算法图表附录</div>
          <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">B 算法成果展示</div>
        </div>
        <div className="rounded-xl bg-[var(--color-surface-container)] p-6 ambient-shadow">
          <div className="rounded-2xl border border-[rgba(255,180,171,0.14)] bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">当前标的专属图表</div>
                <div className="mt-2 font-headline text-[22px] font-bold text-white">{currentInstrumentName} 风险雷达图</div>
                <div className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
                  使用当前标的的算法信号触发情况绘制风险雷达，适合在答辩时快速展示“当前股的风险结构”。
                </div>
              </div>
              <div className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-outline)]">{ticker}</div>
            </div>
            {currentRadarChart ? (
              <a href={currentRadarChart} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
                <img src={currentRadarChart} alt={`${currentInstrumentName} 风险雷达图`} className="h-auto w-full object-cover" />
              </a>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] px-5 py-8 text-sm leading-7 text-[var(--color-on-surface-variant)]">
                当前标的暂无对应的专属雷达图，可先切换到已覆盖样例股查看。
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {MEMBER_B_SHARED_CHARTS.map((chart) => (
              <article key={chart.src} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 ghost-border">
                <div className="font-headline text-[18px] font-bold text-white">{chart.title}</div>
                <div className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{chart.description}</div>
                <a href={chart.src} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-black/10">
                  <img src={chart.src} alt={chart.title} className="h-auto w-full object-cover" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="mb-4 font-headline text-[20px] font-bold text-white md:text-[22px]">全局筛选</div>
        <div className="rounded-xl bg-[var(--color-surface-container)] p-6 ambient-shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">当前标的</div>
              <div className="mt-2 font-headline text-2xl text-white">{currentInstrumentName || '--'}</div>
            </div>
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-4 py-3 ghost-border">
              <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">当前区间</div>
              <div className="mt-2 font-label text-sm text-white">
                {`${startDate} → ${endDate}`}
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="terminal-ticker" className="mb-2 ml-1 block font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">终端标的</label>
              <div className="ghost-border flex items-center justify-between rounded-sm bg-[var(--color-surface-lowest)] pr-3">
                <select
                  id="terminal-ticker"
                  aria-label="终端标的"
                  value={pendingTicker}
                  onChange={(event) => setPendingTicker(event.target.value)}
                  className="w-full appearance-none bg-transparent px-3 py-2.5 font-label text-sm text-white outline-none"
                >
                  {tickers.map((item) => (
                    <option key={item} value={item} className="bg-[var(--color-surface-lowest)] text-white">{item}</option>
                  ))}
                </select>
                <span className="pointer-events-none mr-2 max-w-[96px] truncate font-label text-sm text-white">{pendingInstrumentName}</span>
                <Icon name="expand_more" className="text-[15px] text-[var(--color-outline)]" />
              </div>
            </div>
            <div>
              <label htmlFor="terminal-start-date" className="mb-2 ml-1 block font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">终端开始日期</label>
              <div className="ghost-border flex items-center gap-2 rounded-sm bg-[var(--color-surface-lowest)] px-3 py-2.5">
                <Icon name="calendar_today" className="text-[15px] text-[var(--color-outline)]" />
                <input
                  id="terminal-start-date"
                  aria-label="终端开始日期"
                  type="date"
                  min={minDate}
                  max={pendingEndDate || maxDate}
                  value={pendingStartDate}
                  onChange={(event) => setPendingStartDate(event.target.value)}
                  className="w-full bg-transparent font-label text-sm text-white outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="terminal-end-date" className="mb-2 ml-1 block font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">终端结束日期</label>
              <div className="ghost-border flex items-center gap-2 rounded-sm bg-[var(--color-surface-lowest)] px-3 py-2.5">
                <Icon name="calendar_today" className="text-[15px] text-[var(--color-outline)]" />
                <input
                  id="terminal-end-date"
                  aria-label="终端结束日期"
                  type="date"
                  min={pendingStartDate || minDate}
                  max={maxDate}
                  value={pendingEndDate}
                  onChange={(event) => setPendingEndDate(event.target.value)}
                  className="w-full bg-transparent font-label text-sm text-white outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
          <button type="button" onClick={handleApplyFilters} className="mt-4 rounded-md border border-[rgba(173,199,255,0.28)] bg-[var(--color-primary-container)] px-4 py-3 font-body text-sm font-medium text-white">应用全局筛选</button>
        </div>
      </section>
    </div>
  );
}
