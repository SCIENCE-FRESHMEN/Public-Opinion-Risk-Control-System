import type { MemberBAnalysisResponse } from '../../lib/api/types';
import { MetricCard } from '../../components/common/metric-card';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

function formatPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function riskTone(level: string) {
  if (level === '高') return 'text-[var(--color-error)]';
  if (level === '中') return 'text-[#ffd36d]';
  return 'text-[var(--color-tertiary)]';
}

function formatTimelineLabel(date: string) {
  return date.slice(5).replace('-', '/');
}

function ratioWidth(value: number) {
  return `${Math.max(4, Math.round(value * 100))}%`;
}

export function MemberBAnalysisPanel({
  analysis,
}: {
  analysis: MemberBAnalysisResponse | null;
}) {
  if (!analysis) {
    return null;
  }

  const hasCurrentStock = analysis.matched;
  const hasRiskTimeline = analysis.risk_timeline.length > 0;
  const sentimentBreakdown = [
    { label: '正向情绪', value: analysis.positive_ratio, tone: 'bg-[var(--color-tertiary)]', text: 'text-[var(--color-tertiary)]' },
    { label: '中性情绪', value: analysis.neutral_ratio, tone: 'bg-[rgba(173,199,255,0.82)]', text: 'text-[var(--color-secondary-container)]' },
    { label: '负向情绪', value: analysis.negative_ratio, tone: 'bg-[var(--color-error)]', text: 'text-[var(--color-error)]' },
  ];
  const maxTopicFrequency = Math.max(...analysis.top_topics.map((topic) => topic.frequency), 1);

  return (
    <section className="ambient-shadow rounded-xl border border-[rgba(45,219,222,0.16)] bg-[linear-gradient(145deg,rgba(22,35,45,0.96),rgba(28,38,52,0.92))] p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">算法分析结果</div>
          <h2 className="mt-2 font-headline text-[24px] font-bold text-white">
            {hasCurrentStock ? `${analysis.stock_name} 情绪 / 主题 / 风险研判` : '已覆盖股票的算法批处理结果'}
          </h2>
        </div>
        <div className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
          生成时间 {analysis.generated_at}
        </div>
      </div>

      {hasCurrentStock ? (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <MetricCard title="平均情绪">
              <div className="font-headline text-[28px] font-extrabold leading-none text-white">{analysis.mean_sentiment.toFixed(4)}</div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">样本 {analysis.total_opinions} 条</div>
            </MetricCard>
            <MetricCard title="风险评分" accent="var(--color-error)">
              <div className={`font-headline text-[28px] font-extrabold leading-none ${riskTone(analysis.risk_level)}`}>{analysis.risk_score.toFixed(1)}</div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{analysis.risk_label}</div>
            </MetricCard>
            <MetricCard title="疑似谣言" accent="var(--color-secondary-container)">
              <div className="font-headline text-[28px] font-extrabold leading-none text-white">{analysis.rumor_count}</div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">规则触发样本</div>
            </MetricCard>
            <MetricCard title="情绪分布" accent="var(--color-tertiary)">
              <div className="font-headline text-[22px] font-extrabold leading-tight text-white">
                正 {formatPct(analysis.positive_ratio)} / 负 {formatPct(analysis.negative_ratio)}
              </div>
              <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">中性 {formatPct(analysis.neutral_ratio)}</div>
            </MetricCard>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">主题关键词前八</div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {analysis.top_topics.map((topic) => (
                  <span key={topic.keyword} className="rounded-xl bg-[rgba(45,219,222,0.1)] px-3 py-2 font-label text-sm text-[var(--color-tertiary)]">
                    {topic.keyword} <span className="ml-1 text-white">{topic.frequency}</span>
                  </span>
                ))}
              </div>
              <div className="mt-5">
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">主题强度排序</div>
                <div className="mt-3 space-y-3">
                  {analysis.top_topics.slice(0, 5).map((topic, index) => (
                    <div key={`${topic.keyword}-bar`} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 text-white">
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgba(45,219,222,0.12)] px-1.5 font-label text-[10px] uppercase tracking-[0.12em] text-[var(--color-tertiary)]">
                            {index + 1}
                          </span>
                          <span>{topic.keyword}</span>
                        </div>
                        <div className="font-label text-[11px] uppercase tracking-[0.12em] text-[var(--color-on-surface-variant)]">
                          频次 {topic.frequency} / 权重 {topic.score.toFixed(2)}
                        </div>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(45,219,222,0.92),rgba(173,199,255,0.82))]"
                          style={{ width: `${Math.max(12, Math.round((topic.frequency / maxTopicFrequency) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">触发规则与风险因素</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(analysis.triggered_rules.length ? analysis.triggered_rules : ['无强预警规则']).map((rule) => (
                  <span key={rule} className="rounded-full bg-[rgba(255,180,171,0.12)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-[var(--color-error)]">
                    {rule}
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {(analysis.risk_factors.length ? analysis.risk_factors : ['当前未发现明显异常风险因素。']).slice(0, 3).map((factor) => (
                  <p key={factor} className="text-sm leading-6 text-[var(--color-on-surface-variant)]">{factor}</p>
                ))}
              </div>
              <div className="mt-5 border-t border-[rgba(255,255,255,0.08)] pt-4">
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">情绪结构剖面</div>
                <div className="mt-3 space-y-3">
                  {sentimentBreakdown.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-sm ${item.text}`}>{item.label}</span>
                        <span className="font-label text-[11px] uppercase tracking-[0.12em] text-[var(--color-on-surface-variant)]">
                          {formatPct(item.value)}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                        <div className={`h-full rounded-full ${item.tone}`} style={{ width: ratioWidth(item.value) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">风险趋势追踪</div>
                <h3 className="mt-2 font-headline text-[20px] font-bold text-white">风险评分 / 负面占比 / 舆情量</h3>
              </div>
              <div className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
                来自算法批处理结果
              </div>
            </div>
            {hasRiskTimeline ? (
              <>
                <div className="mt-2 text-sm leading-6 text-[var(--color-on-surface-variant)]">
                  用连续时间序列观察风险抬升、负面情绪占比变化以及讨论量异动，比单点指标更适合答辩时解释“为什么触发预警”。
                </div>
                <div className="mt-4 h-[248px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.risk_timeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatTimelineLabel}
                        stroke="rgba(255,255,255,0.32)"
                        tick={{ fill: 'rgba(255,255,255,0.58)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="risk"
                        stroke="rgba(255,255,255,0.32)"
                        tick={{ fill: 'rgba(255,255,255,0.58)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={34}
                      />
                      <YAxis
                        yAxisId="ratio"
                        orientation="right"
                        stroke="rgba(255,255,255,0.32)"
                        tick={{ fill: 'rgba(255,255,255,0.58)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(10,16,27,0.94)',
                          borderRadius: '16px',
                          color: '#fff',
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.72)' }}
                      />
                      <Area yAxisId="risk" type="monotone" dataKey="risk_score" name="风险评分" stroke="#ff9d91" fill="rgba(255,157,145,0.18)" strokeWidth={2.2} />
                      <Area yAxisId="ratio" type="monotone" dataKey="negative_ratio" name="负面占比" stroke="#ffd36d" fill="rgba(255,211,109,0.12)" strokeWidth={2} />
                      <Area yAxisId="risk" type="monotone" dataKey="opinion_count" name="舆情量" stroke="#2ddbde" fill="rgba(45,219,222,0.1)" strokeWidth={1.8} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.08)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface)]">
                当前股票暂无可展示的风险时间序列，可切换到已覆盖股票或重新运行批处理脚本后查看。
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-5">
          <p className="text-sm leading-7 text-[var(--color-on-surface-variant)]">
            当前所选标的暂未进入已完成的算法批处理覆盖清单；下方展示已完成情绪、主题和风险分析的已覆盖股票，用于说明现阶段算法结果边界。
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {analysis.covered_stocks.map((stock) => (
              <div key={stock.ticker} className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="font-headline text-lg font-bold text-white">{stock.stock_name}</div>
                <div className="mt-1 font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">{stock.ticker}</div>
                <div className="mt-3 text-sm text-[var(--color-on-surface-variant)]">情绪 {stock.mean_sentiment.toFixed(3)}</div>
                <div className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{stock.total_opinions} 条 / {stock.risk_label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
