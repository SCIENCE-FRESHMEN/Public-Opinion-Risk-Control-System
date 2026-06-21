import type { CommandCenterDashboardData, StockInsightDetailData } from '../../lib/api/types';

const sectionLabels = [
  ['摘要研判', 'summary'],
  ['情绪观察', 'sentiment_view'],
  ['风险提示', 'risk_view'],
  ['席位建议', 'action_view'],
] as const;

type BriefingMeta = {
  generationMode?: string;
  dataSources?: string[];
  referenceTime?: string;
  ticker?: string;
  stockName?: string;
};

function formatGenerationMode(mode?: string) {
  if (!mode) return '课程演示模式';
  if (mode.includes('local_template')) return '本地模板融合模式';
  if (mode.includes('fallback')) return '模板兜底模式';
  if (mode.includes('llm')) return '大模型生成模式';
  if (mode.includes('hybrid')) return '混合研判模式';
  return mode;
}

export function BriefingCard({
  brief,
  report,
  meta,
}: {
  brief: CommandCenterDashboardData['ai_brief'];
  report: StockInsightDetailData['ai_report'];
  meta?: BriefingMeta;
}) {
  const sourceLabels = meta?.dataSources?.length ? meta.dataSources : ['舆情样本', '情绪评分', '风险标签'];

  return (
    <section className="intel-frame ambient-shadow-strong relative overflow-hidden rounded-[28px] border border-[rgba(255,180,171,0.2)] bg-[linear-gradient(145deg,rgba(34,38,49,0.98),rgba(53,31,38,0.92))] p-5 md:p-6">
      <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_center,rgba(255,180,171,0.12),transparent_72%)]" />
      <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,180,171,0.38),transparent)]" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="relative">
          <div className="intel-kicker">AI 研判简报中枢</div>
          <div className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">AI 证券分析师自动研判</div>
          <h3 className="mt-3 font-headline text-[22px] font-bold text-white md:text-[28px]">{report.title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
            由多源舆情样本、情绪评分、风险标签与事件摘要自动汇总，用于答辩时展示“分析结果如何被收敛成一段可阅读的券商式结论”。
          </p>
        </div>
        <div className="relative rounded-full border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.14)] px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]">
          自动生成
        </div>
      </div>
      <div className="relative mt-5 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 md:p-5">
        <div data-testid="briefing-meta-grid" className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
          <div className="min-w-0 rounded-2xl bg-[rgba(255,255,255,0.04)] px-3 py-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">生成模式</div>
            <div className="mt-2 break-words text-sm leading-7 text-white whitespace-normal">{formatGenerationMode(meta?.generationMode)}</div>
          </div>
          <div className="min-w-0 rounded-2xl bg-[rgba(255,255,255,0.04)] px-3 py-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">输入来源</div>
            <div className="mt-2 space-y-1.5">
              {sourceLabels.map((source) => (
                <div key={source} className="break-words text-sm leading-7 text-white whitespace-normal">
                  {source}
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0 rounded-2xl bg-[rgba(255,255,255,0.04)] px-3 py-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">研判基准时间</div>
            <div className="mt-2 break-words text-sm leading-7 text-white whitespace-normal">{meta?.referenceTime ?? '待同步'}</div>
          </div>
          <div className="min-w-0 rounded-2xl bg-[rgba(255,255,255,0.04)] px-3 py-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">目标标的</div>
            <div className="mt-2 break-words text-sm leading-7 text-white whitespace-normal">{meta?.stockName ?? '--'}{meta?.ticker ? ` / ${meta.ticker}` : ''}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[rgba(45,219,222,0.12)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">
            核心结论
          </span>
          <div className="h-px min-w-[72px] flex-1 bg-[linear-gradient(90deg,rgba(45,219,222,0.22),transparent)]" />
        </div>
        <div className="mt-3 font-headline text-xl font-bold text-white">{brief.headline}</div>
        <p className="mt-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">{report.event_summary}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sectionLabels.map(([label, key]) => (
          <div key={key} className="intel-frame rounded-[22px] bg-[rgba(255,255,255,0.03)] px-4 py-4 ghost-border">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-tertiary)]" />
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">{label}</div>
            </div>
            <p className="mt-2 text-sm leading-7 text-white">{brief[key]}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[22px] border border-[rgba(45,219,222,0.14)] bg-[rgba(45,219,222,0.08)] px-4 py-4">
        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">补充说明</div>
        <p className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{report.risk_warning}</p>
      </div>
    </section>
  );
}
