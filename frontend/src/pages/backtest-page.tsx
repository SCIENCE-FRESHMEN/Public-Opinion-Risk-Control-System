import { Icon } from '../components/common/icon';
import { useBacktestQuery } from '../features/backtest/useBacktestQuery';
import { DistributionCard } from '../features/backtest/distribution-card';
import { TrajectoryChart } from '../features/backtest/trajectory-chart';
import { useMemberBAnalysisQuery } from '../features/meta/useMemberBAnalysisQuery';
import { useInstrumentName } from '../features/meta/useInstrumentName';
import { useFiltersStore } from '../store/filters';
import type { BacktestResponse } from '../lib/api/types';

const MEMBER_B_RISK_SCORES_SRC = '/member-b-charts/04_risk_scores.png';

function isEmptyBacktestResponse(data: BacktestResponse | undefined) {
  if (!data) {
    return true;
  }

  const hasTrajectory = data.trajectory.length > 0;
  const hasEvents = data.events.length > 0;
  const hasSummary =
    data.summary.historical_triggers > 0 ||
    data.summary.mean_forward_return !== 0 ||
    data.summary.max_drawdown !== 0 ||
    data.summary.negative_hit_rate !== 0;
  const hasDistribution =
    data.distribution.min !== 0 ||
    data.distribution.q1 !== 0 ||
    data.distribution.median !== 0 ||
    data.distribution.q3 !== 0 ||
    data.distribution.max !== 0;

  return !(hasTrajectory || hasEvents || hasSummary || hasDistribution);
}

export function BacktestPage() {
  const { ticker, startDate, endDate } = useFiltersStore();
  const instrumentName = useInstrumentName(ticker);
  const requestedSignalVector = '新闻热度激增';
  const horizon = 5;
  const { data } = useBacktestQuery(ticker, startDate, endDate, requestedSignalVector, horizon);
  const memberBAnalysisQuery = useMemberBAnalysisQuery(ticker);
  const resolvedData: BacktestResponse = !data || isEmptyBacktestResponse(data)
    ? {
        summary: {
          historical_triggers: 0,
          mean_forward_return: 0,
          max_drawdown: 0,
          negative_hit_rate: 0,
        },
        active_alert_type: requestedSignalVector,
        trajectory: [],
        distribution: {
          min: 0,
          q1: 0,
          median: 0,
          q3: 0,
          max: 0,
        },
        events: [],
      }
    : data;
  const signalVector = resolvedData.active_alert_type ?? requestedSignalVector;
  const isEmptyBacktest = isEmptyBacktestResponse(resolvedData);
  const memberBAnalysis = memberBAnalysisQuery.data;
  const shouldUseAlgorithmFallback = isEmptyBacktest && Boolean(memberBAnalysis?.matched);
  const statCards = [
    ['历史触发次数', String(resolvedData.summary.historical_triggers ?? 0), '次', 'var(--color-tertiary)'],
    ['平均远期收益', ((resolvedData.summary.mean_forward_return ?? 0) * 100).toFixed(2), '%', 'var(--color-primary)'],
    ['最大回撤', ((resolvedData.summary.max_drawdown ?? 0) * 100).toFixed(1), '%', 'var(--color-error)'],
    ['负收益命中率', ((resolvedData.summary.negative_hit_rate ?? 0) * 100).toFixed(1), '%', 'var(--color-secondary-container)'],
  ] as const;
  const anchorDate = resolvedData.events[0]?.trade_date ?? '当前窗口暂无历史触发';
  const fallbackStatCards = shouldUseAlgorithmFallback
    ? [
        ['算法样本数', String(memberBAnalysis!.total_opinions), '条', 'var(--color-tertiary)'],
        ['平均情绪', memberBAnalysis!.mean_sentiment.toFixed(4), '', 'var(--color-primary)'],
        ['风险评分', memberBAnalysis!.risk_score.toFixed(1), '', 'var(--color-error)'],
        ['疑似谣言', String(memberBAnalysis!.rumor_count), '条', 'var(--color-secondary-container)'],
      ] as const
    : statCards;
  const fallbackAnchorDate = shouldUseAlgorithmFallback
    ? memberBAnalysis!.risk_timeline[memberBAnalysis!.risk_timeline.length - 1]?.date ?? memberBAnalysis!.generated_at.slice(0, 10)
    : anchorDate;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-headline text-[40px] font-extrabold tracking-[-0.04em] text-white md:text-[50px]">情绪因子有效性验证</div>
          <div className="mt-2 max-w-3xl text-sm text-[var(--color-on-surface-variant)]">检验情绪因子触发后价格在后续窗口的表现，量化这一增量因子相对量价的预测有效性。</div>
          <div className="mt-3 inline-flex items-center rounded-sm bg-[var(--color-surface-high)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">{`当前标的：${instrumentName}`}</div>
        </div>
        <div className="flex gap-4">
          <div>
            <div className="mb-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">信号类型</div>
            <div className="ghost-border flex items-center gap-3 rounded-sm bg-[var(--color-surface-lowest)] px-4 py-2.5 font-label text-sm text-white">
              <span className="h-2 w-2 rounded-full bg-[var(--color-error)]" />
              <span>{signalVector}</span>
              <Icon name="expand_more" className="ml-1 text-[16px] text-[var(--color-outline)]" />
            </div>
          </div>
          <div>
            <div className="mb-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">评估周期</div>
            <div className="ghost-border flex items-center gap-3 rounded-sm bg-[var(--color-surface-lowest)] px-4 py-2.5 font-label text-sm text-white">
              <Icon name="calendar_clock" className="text-[16px] text-[var(--color-tertiary)]" />
              <span>{`${horizon} 个交易日（后 ${horizon} 日）`}</span>
              <Icon name="expand_more" className="ml-1 text-[16px] text-[var(--color-outline)]" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {fallbackStatCards.map(([title, value, suffix, accent]) => (
          <div key={title} className="ambient-shadow relative overflow-hidden rounded-xl bg-[var(--color-surface-high)] p-6">
            <div className="absolute inset-y-0 left-0 w-1" style={{ background: `var(${accent.replace('var(', '').replace(')', '')})` }} />
            <div className="font-label text-[11px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">{title}</div>
            <div className="mt-2 text-[10px] text-[var(--color-outline)]">
              {shouldUseAlgorithmFallback
                ? title === '算法样本数'
                  ? '当前算法批处理实际分析的舆情样本数量'
                  : title === '平均情绪'
                    ? '当前窗口内算法情绪聚合结果'
                    : title === '风险评分'
                      ? '基于情绪、分歧、谣言与舆情量的综合风险值'
                      : '当前窗口内标记为疑似谣言的样本数量'
                : title === '历史触发次数' ? '过去出现过多少次类似信号' : title === '平均远期收益' ? '这些信号出现后，后续区间平均涨跌幅' : title === '最大回撤' ? '这些信号出现后，区间内最明显的一次下跌幅度' : '这些信号里，后续出现亏损的占比'}
            </div>
            <div className="mt-6 flex items-end gap-2"><span className="font-headline text-[42px] font-extrabold text-white">{value}</span><span className="pb-2 font-label text-sm text-[var(--color-on-surface-variant)]">{suffix}</span></div>
            {title === '历史触发次数' || title === '算法样本数' ? <div className="mt-2 text-xs text-[var(--color-on-surface-variant)]">{`累计 ${value}${suffix ? ` ${suffix}` : ''}`}</div> : null}
          </div>
        ))}
      </div>
      {isEmptyBacktest ? (
        <div className="rounded-2xl border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.08)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface)]">
          {shouldUseAlgorithmFallback
            ? '当前股票尚未进入正式主链回测样本，页面已切换为算法验证视角。下方展示算法风险时间线和规则触发摘要，用于辅助说明该股票的风险研判过程。'
            : '当前窗口样本不足，暂无法形成有效的历史回测结论。你可以切换股票、扩大日期范围，或等待更多事件样本接入后再查看。'}
        </div>
      ) : null}
      {shouldUseAlgorithmFallback ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <section className="ambient-shadow rounded-xl bg-[var(--color-surface-container)] p-6 ghost-border">
            <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">算法风险时间线</div>
            <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">基于算法批处理的日频风险、负面占比与舆情量变化，用于补充正式回测缺失时的验证视角。</div>
            <div className="mt-5 space-y-3">
              {memberBAnalysis!.risk_timeline.slice().reverse().map((item) => (
                <div key={item.date} className="rounded-2xl bg-[rgba(255,255,255,0.03)] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-headline text-lg font-bold text-white">{item.date}</div>
                    <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">
                      舆情量 {item.opinion_count} / 负面占比 {(item.negative_ratio * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
                    <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(255,180,171,0.92),rgba(255,208,102,0.82))]" style={{ width: `${Math.max(8, Math.min(100, item.opinion_count))}%` }} />
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[var(--color-on-surface-variant)]">
                    情绪得分 {item.sentiment_weighted.toFixed(4)}，风险评分 {item.risk_score.toFixed(1)}。
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="ambient-shadow rounded-xl bg-[var(--color-surface-container)] p-6 ghost-border">
            <div className="font-headline text-[20px] font-bold text-white md:text-[22px]">规则触发与主题摘要</div>
            <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">用规则命中、风险因素和主题词替代空白回测结论，突出算法对当前股票的可解释性。</div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(memberBAnalysis!.triggered_rules.length ? memberBAnalysis!.triggered_rules : ['无强预警规则']).map((rule) => (
                <span key={rule} className="rounded-full bg-[rgba(255,180,171,0.12)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-[var(--color-error)]">
                  {rule}
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {(memberBAnalysis!.risk_factors.length ? memberBAnalysis!.risk_factors : ['当前未发现明显异常风险因素。']).map((factor) => (
                <div key={factor} className="rounded-2xl bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-7 text-[var(--color-on-surface-variant)]">
                  {factor}
                </div>
              ))}
            </div>
            <div className="mt-5">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">主题关键词</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {memberBAnalysis!.top_topics.slice(0, 8).map((topic) => (
                  <span key={topic.keyword} className="rounded-full border border-[rgba(173,199,255,0.14)] bg-[rgba(173,199,255,0.08)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-[var(--color-secondary-container)]">
                    {topic.keyword} {topic.frequency}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8"><TrajectoryChart points={resolvedData.trajectory ?? []} /></div>
          <div className="col-span-4"><DistributionCard distribution={resolvedData.distribution ?? { min: 0, q1: 0, median: 0, q3: 0, max: 0 }} /></div>
        </div>
      )}
      <section className="intel-frame relative overflow-hidden rounded-[28px] border border-[rgba(255,180,171,0.16)] bg-[linear-gradient(145deg,rgba(31,18,22,0.98),rgba(39,27,32,0.96),rgba(27,33,43,0.94))] p-6 ambient-shadow-strong">
        <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_center,rgba(255,180,171,0.14),transparent_70%)]" />
        <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,180,171,0.32),transparent)]" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">算法证据补强</div>
            <div className="mt-2 font-headline text-[20px] font-bold text-white md:text-[22px]">算法风险对比图</div>
          </div>
          <div className="rounded-full border border-[rgba(255,180,171,0.16)] bg-[rgba(255,180,171,0.08)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-error)]">
            离线批处理结果附证
          </div>
        </div>
        <p className="relative mt-3 max-w-3xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
          当正式回测样本较少时，这张离线风险评分对比图可以帮助解释不同样例股之间的风险层级差异；当正式回测样本充分时，它则作为补充证据，说明算法批处理与页面回测视角是相互印证的。
        </p>
        <a
          href={MEMBER_B_RISK_SCORES_SRC}
          target="_blank"
          rel="noreferrer"
          className="relative mt-5 block overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]"
        >
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-[rgba(7,12,20,0.72)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]">
            Quant Evidence
          </div>
          <img src={MEMBER_B_RISK_SCORES_SRC} alt="综合风险评分对比" className="h-auto w-full object-cover" />
        </a>
      </section>
      <div className="flex max-w-[960px] items-start gap-3 rounded-sm border-l-2 border-[var(--color-tertiary)] bg-[rgba(54,57,64,0.82)] px-4 py-4 shadow-[0_0_28px_rgba(0,0,0,0.18)]">
        <Icon name="anchor" className="pt-1 text-[18px] text-[var(--color-tertiary)]" />
        <div>
          <div className="font-label text-[12px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">锚点日期：{fallbackAnchorDate}</div>
          <div className="mt-1 text-sm leading-6 text-[var(--color-on-surface)]">
            {shouldUseAlgorithmFallback
              ? '当前页展示的是算法验证视角，不等同于正式事件回测结果；其目的在于补充说明舆情、规则与风险因子如何共同推导出当前股票的风险研判。'
              : '所有计算均相对于指定交易日收盘时点。本模块用于事件驱动的历史验证研究，不构成自动交易信号或投资建议。'}
          </div>
        </div>
      </div>
    </div>
  );
}
