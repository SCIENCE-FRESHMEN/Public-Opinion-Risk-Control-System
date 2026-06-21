import { MetricCard } from '../components/common/metric-card';
import { Icon } from '../components/common/icon';
import { useMemberBAnalysisQuery } from '../features/meta/useMemberBAnalysisQuery';
import { useSubmissionStockCoverageQuery } from '../features/meta/useSubmissionStockCoverageQuery';
import { useInstrumentName } from '../features/meta/useInstrumentName';
import { PriceContextChart } from '../features/overview/price-context-chart';
import { RecentAlertsTable } from '../features/overview/recent-alerts-table';
import { useOverviewQuery } from '../features/overview/useOverviewQuery';
import { useFiltersStore } from '../store/filters';
import type { OverviewResponse } from '../lib/api/types';

function formatNumber(value: number | string, digits = 0) {
  if (typeof value === 'number') {
    return digits > 0 ? value.toFixed(digits) : value.toLocaleString();
  }
  return value;
}

function formatPct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function localizeRiskLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  const labels: Record<string, string> = {
    news_heat_spike: '新闻热度激增',
    volume_surge: '舆情量异常激增',
    negative_sentiment_spike: '负面情绪激增',
    rumor_spike: '谣言风险抬升',
    algorithm_watch: '算法监测中',
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };

  return labels[normalized] ?? value;
}

export function OverviewPage() {
  const { ticker: filterTicker } = useFiltersStore();
  const { data } = useOverviewQuery();
  const memberBAnalysisQuery = useMemberBAnalysisQuery(filterTicker);
  const submissionCoverageQuery = useSubmissionStockCoverageQuery(filterTicker);
  const resolvedData: OverviewResponse = data ?? {
    header: {
      ticker: filterTicker,
      as_of: '',
    },
    kpis: {
      price: { value: 0, delta: 0, label: '暂无数据' },
      sentiment: { value: 0, delta: 0, label: '暂无结论' },
      news_heat: { value: 0, delta: 0, label: '暂无样本' },
      risk: { level: '待分析', label: '待分析' },
    },
    price_context: [],
    alerts: [],
  };
  const ticker = resolvedData.header.ticker;
  const instrumentName = useInstrumentName(ticker);
  const asOf = resolvedData.header.as_of
    ? new Date(resolvedData.header.as_of).toLocaleString('zh-CN', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '等待当前标的最新数据';
  const priceValue = typeof resolvedData.kpis.price.value === 'number' ? resolvedData.kpis.price.value.toFixed(2) : resolvedData.kpis.price.value ?? '0.00';
  const priceDelta = resolvedData.kpis.price.delta ?? 0;
  const sentimentValue = typeof resolvedData.kpis.sentiment.value === 'number' ? resolvedData.kpis.sentiment.value.toFixed(2) : resolvedData.kpis.sentiment.value ?? '0.00';
  const newsHeat = formatNumber(resolvedData.kpis.news_heat.value ?? 0);
  const isEmptyOverview =
    resolvedData.price_context.length === 0 &&
    resolvedData.alerts.length === 0 &&
    Number(resolvedData.kpis.price.value ?? 0) === 0 &&
    Number(resolvedData.kpis.sentiment.value ?? 0) === 0 &&
    Number(resolvedData.kpis.news_heat.value ?? 0) === 0;
  const memberBAnalysis = memberBAnalysisQuery.data;
  const shouldUseAlgorithmFallback = isEmptyOverview && Boolean(memberBAnalysis?.matched);
  const algorithmContextSeries = shouldUseAlgorithmFallback
    ? memberBAnalysis!.risk_timeline.map((item) => ({
        date: item.date,
        value: item.opinion_count,
      }))
    : [];
  const algorithmAlertRows = shouldUseAlgorithmFallback
    ? (memberBAnalysis!.triggered_rules.length ? memberBAnalysis!.triggered_rules : ['算法监测中']).map((rule, index) => {
        const anchor = memberBAnalysis!.risk_timeline[Math.max(memberBAnalysis!.risk_timeline.length - 1 - index, 0)];
        const severity = memberBAnalysis!.risk_score >= 30 ? '高' : memberBAnalysis!.risk_score >= 15 ? '中' : '低';
        const factor = memberBAnalysis!.risk_factors[index] ?? memberBAnalysis!.risk_factors[0] ?? '当前窗口内舆情讨论量与情绪结构出现变化，建议继续跟踪。';
        return {
          trade_date: anchor?.date ?? memberBAnalysis!.generated_at.slice(0, 10) ?? '--',
          timestamp: anchor?.date ? '15:00:00' : '--',
          alert_type: rule,
          severity,
          description: factor,
        };
      })
    : [];
  const fallbackQuote = submissionCoverageQuery.data?.quote ?? 0;
  const activeAlerts = shouldUseAlgorithmFallback ? algorithmAlertRows : resolvedData.alerts;
  const contextSeries = shouldUseAlgorithmFallback ? algorithmContextSeries : resolvedData.price_context;
  const effectiveNewsHeat = shouldUseAlgorithmFallback ? memberBAnalysis?.total_opinions ?? 0 : Number(resolvedData.kpis.news_heat.value ?? 0);
  const effectiveSentimentLabel = shouldUseAlgorithmFallback ? memberBAnalysis?.risk_label ?? '算法观察中' : resolvedData.kpis.sentiment.label ?? '中性偏空';
  const dominantRisk = localizeRiskLabel(
    activeAlerts[0]?.alert_type ?? (shouldUseAlgorithmFallback ? memberBAnalysis?.triggered_rules[0] ?? '算法监测中' : '暂无预警'),
  );
  const replayWindowLabel = contextSeries.length
    ? `${contextSeries[0].date} 至 ${contextSeries[contextSeries.length - 1].date}`
    : '当前窗口暂无有效样本';
  const amplitudePct = contextSeries.length >= 2
    ? (((Math.max(...contextSeries.map((item) => item.value)) - Math.min(...contextSeries.map((item) => item.value))) / Math.max(Math.min(...contextSeries.map((item) => item.value)), 1)) * 100)
    : 0;
  const replayConclusion = activeAlerts.length
    ? `近 30 日内共识别 ${activeAlerts.length} 个关键预警节点，主导风险集中在“${dominantRisk}”，市场情绪整体呈现“${effectiveSentimentLabel}”特征。`
    : shouldUseAlgorithmFallback
      ? `当前正式回顾样本不足，页面切换为算法复盘视角；近阶段舆情量为 ${effectiveNewsHeat} 条，风险标签为“${localizeRiskLabel(effectiveSentimentLabel)}”。`
      : '当前窗口暂无足够样本形成完整复盘结论，建议切换股票或扩大日期范围后重试。';
  const resultSummary = shouldUseAlgorithmFallback
    ? `算法视角下当前阶段累计舆情样本 ${effectiveNewsHeat} 条，综合风险评分 ${memberBAnalysis?.risk_score.toFixed(1) ?? '--'}，疑似谣言 ${memberBAnalysis?.rumor_count ?? 0} 条。`
    : `当前区间振幅约 ${amplitudePct.toFixed(1)}%，最近一条预警对应的情绪标签为“${effectiveSentimentLabel}”，说明该股在观察窗口内存在可识别的风险波动。`;
  const reasonNews = activeAlerts[0]?.description ?? (shouldUseAlgorithmFallback ? memberBAnalysis?.risk_factors[0] ?? '当前窗口暂无明确新闻驱动。' : '当前窗口暂无明确新闻驱动。');
  const reasonEmotion = shouldUseAlgorithmFallback
    ? `算法情绪均值 ${memberBAnalysis?.mean_sentiment.toFixed(4) ?? '--'}，负面占比 ${((memberBAnalysis?.negative_ratio ?? 0) * 100).toFixed(1)}%。`
    : `当日情绪得分 ${sentimentValue}，情绪结论为“${effectiveSentimentLabel}”。`;
  const reasonRules = shouldUseAlgorithmFallback
    ? (memberBAnalysis?.triggered_rules.length ? `命中规则：${memberBAnalysis.triggered_rules.map(localizeRiskLabel).join('、')}` : '当前窗口暂无强规则触发。')
    : (activeAlerts.length ? `关键预警类型集中在“${dominantRisk}”。` : '当前窗口暂无规则触发记录。');
  const hasReasonEvidence = Boolean(activeAlerts.length || shouldUseAlgorithmFallback || effectiveNewsHeat);

  return (
    <div className="space-y-7">
      <div className="mb-1">
        <div className="font-headline text-[40px] font-extrabold tracking-[-0.04em] text-white md:text-[50px]">{instrumentName} 历史复盘</div>
        <div className="mt-2 flex items-center gap-2 font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">
          <Icon name="schedule" className="text-[16px]" />
          <span>标的数据更新于 {asOf}</span>
        </div>
        <div className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
          回看指定窗口内的价格背景、预警节点和舆情上下文，回答“这段时间发生了什么”，而不是重复展示当前状态。
        </div>
      </div>
      <section className="intel-frame relative overflow-hidden rounded-[28px] border border-[rgba(173,199,255,0.16)] bg-[linear-gradient(145deg,rgba(11,18,30,0.98),rgba(19,27,39,0.96),rgba(33,28,36,0.94))] px-5 py-6 ambient-shadow-strong md:px-6">
        <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_center,rgba(173,199,255,0.16),transparent_70%)]" />
        <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(173,199,255,0.3),transparent)]" />
        <div className="relative">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">复盘结论</div>
          <div className="mt-3 max-w-4xl font-headline text-[28px] font-bold leading-tight text-white md:text-[34px]">
            {replayConclusion}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="复盘区间" accent="var(--color-outline-variant)">
              <div className="font-label text-sm leading-7 text-white">{replayWindowLabel}</div>
            </MetricCard>
            <MetricCard title="累计预警" accent="var(--color-error)">
              <div className="font-headline text-[30px] font-extrabold leading-none text-white">{activeAlerts.length}</div>
            </MetricCard>
            <MetricCard title="主导风险" accent="var(--color-secondary-container)">
              <div className="font-label text-sm leading-7 text-white">{dominantRisk}</div>
            </MetricCard>
            <MetricCard title="区间振幅" accent="var(--color-tertiary)">
              <div data-overview-price-row className="flex flex-wrap items-end gap-x-3 gap-y-2">
                <div className="font-headline text-[30px] font-extrabold leading-none text-white">{amplitudePct.toFixed(1)}%</div>
                <div className="pb-1 font-label text-sm font-semibold leading-none text-[var(--color-on-surface-variant)]">
                  {shouldUseAlgorithmFallback ? `参考报价 ¥${fallbackQuote.toFixed(2)}` : `当前价格 ¥${priceValue}`}
                </div>
              </div>
            </MetricCard>
          </div>
        </div>
      </section>
      {isEmptyOverview ? (
        <div className="rounded-2xl border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.08)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface)]">
          {shouldUseAlgorithmFallback
            ? `当前股票尚未进入正式主链历史回顾样本，页面已切换为算法分析视角。最新参考报价 ¥${fallbackQuote.toFixed(2)}，下方展示舆情强度上下文与算法预警摘要。`
            : '当前窗口样本不足，暂无法形成价格上下文与预警摘要。你可以切换股票或调整日期范围后重试。'}
        </div>
      ) : null}
      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <PriceContextChart
          data={contextSeries}
          title={shouldUseAlgorithmFallback ? '近 30 日舆情强度复盘' : '30 日价格走势复盘'}
          emptyMessage={
            shouldUseAlgorithmFallback
              ? '当前算法样本也不足，暂无法形成舆情强度上下文。'
              : '暂无法形成有效的价格走势上下文。你可以切换股票，或调整日期范围后重试。'
          }
        />
        <RecentAlertsTable rows={activeAlerts} title="关键预警节点" metaLabel="时间轴回看" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <article className="ambient-shadow rounded-xl border border-[rgba(173,199,255,0.16)] bg-[var(--color-surface-container)] p-5 md:p-6">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">原因归纳</div>
          <div className="mt-2 font-headline text-[24px] font-bold text-white">这段时间为什么会这样</div>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[rgba(173,199,255,0.1)] bg-[rgba(173,199,255,0.06)] px-4 py-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">新闻驱动</div>
              <p className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{reasonNews}</p>
            </div>
            <div className="rounded-2xl border border-[rgba(45,219,222,0.1)] bg-[rgba(45,219,222,0.06)] px-4 py-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">情绪驱动</div>
              <p className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{reasonEmotion}</p>
            </div>
            <div className="rounded-2xl border border-[rgba(255,180,171,0.1)] bg-[rgba(255,180,171,0.06)] px-4 py-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">风险规则</div>
              <p className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{reasonRules}</p>
            </div>
            {!hasReasonEvidence ? (
              <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-7 text-[var(--color-on-surface-variant)]">
                当前窗口暂无可供归纳的新闻、情绪与规则证据。
              </div>
            ) : null}
          </div>
        </article>
        <article className="ambient-shadow rounded-xl border border-[rgba(255,180,171,0.16)] bg-[linear-gradient(145deg,rgba(32,23,28,0.98),rgba(41,31,35,0.96))] p-5 md:p-6">
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">结果总结</div>
          <div className="mt-2 font-headline text-[24px] font-bold text-white">这段历史最终带来了什么</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MetricCard title="当前价格" accent="var(--color-outline-variant)">
              <div className="font-headline text-[30px] font-extrabold leading-none text-white">¥{priceValue}</div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{formatPct(priceDelta * 100)}</div>
            </MetricCard>
            <MetricCard title="当日情绪得分" accent="var(--color-secondary-container)">
              <div className="font-headline text-[30px] font-extrabold leading-none text-white">{sentimentValue}</div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{effectiveSentimentLabel}</div>
            </MetricCard>
            <MetricCard title="新闻热度 / 数量" accent="var(--color-tertiary)">
              <div className="font-headline text-[30px] font-extrabold leading-none text-white">{formatNumber(effectiveNewsHeat)}</div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">条线索 / 文章</div>
            </MetricCard>
            <MetricCard title="当前风险状态" accent="var(--color-error)">
              <div className="font-headline text-[30px] font-extrabold leading-none text-white">{resolvedData.kpis.risk.level ?? '待分析'}</div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{shouldUseAlgorithmFallback ? '算法复盘视角' : '正式主链结果'}</div>
            </MetricCard>
          </div>
          <div className="mt-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-7 text-[var(--color-on-surface-variant)]">
            {resultSummary}
          </div>
        </article>
      </section>
    </div>
  );
}
