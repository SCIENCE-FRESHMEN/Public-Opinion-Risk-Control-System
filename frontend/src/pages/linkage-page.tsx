import { Icon } from '../components/common/icon';
import { useLinkageQuery } from '../features/linkage/useLinkageQuery';
import { useInstrumentName } from '../features/meta/useInstrumentName';
import { CompositeLinkageChart } from '../features/linkage/composite-linkage-chart';
import { useFiltersStore } from '../store/filters';
import type { LinkageResponse } from '../lib/api/types';

function formatAnchorDate(value: string) {
  return value || '--';
}

function deriveLinkageType(summary: LinkageResponse['summary'], spike?: LinkageResponse['alert_spikes'][number]) {
  if (!spike) {
    return '待分析';
  }
  if (spike.sentiment < -0.2 && summary.avg_sentiment < 0) {
    return '同步下压';
  }
  if (spike.sentiment >= 0 && spike.news_volume > 0) {
    return '热度先行';
  }
  return '情绪先行';
}

function buildDiagnosis(summary: LinkageResponse['summary'], spike?: LinkageResponse['alert_spikes'][number]) {
  if (!spike) {
    return '当前窗口尚未形成足够强的价格、情绪与热度共振样本，建议扩大观察区间后再进行联动判断。';
  }
  if (spike.sentiment < -0.2) {
    return '价格下行与负面情绪放大同步出现，新闻热度在锚点日前后明显抬升，属于典型风险共振。';
  }
  if (spike.news_volume > 0 && summary.avg_sentiment >= 0) {
    return '新闻热度率先抬升，情绪随后走弱，价格端暂未完全确认，属于早期分歧扩散阶段。';
  }
  return '情绪波动先于价格出现变化，新闻讨论量保持活跃，属于需要继续跟踪的预警前兆。';
}

export function LinkagePage() {
  const { ticker } = useFiltersStore();
  const { data } = useLinkageQuery();
  const resolvedData: LinkageResponse = data ?? {
    summary: {
      ticker,
      sector: '待分析',
      avg_sentiment: 0,
      risk_status: '待分析',
    },
    series: {
      price: [],
      sentiment: [],
      news_volume: [],
    },
    alert_spikes: [],
    anchor: {
      anchor_date: '',
      note: '当前范围内尚未形成可用联动样本，请切换股票或调整日期范围后重试。',
    },
  };
  const summary = resolvedData.summary;
  const spike = resolvedData.alert_spikes[0];
  const instrumentName = useInstrumentName(summary?.ticker ?? ticker);
  const linkageType = deriveLinkageType(summary, spike);
  const diagnosis = buildDiagnosis(summary, spike);
  const isEmptyLinkage =
    resolvedData.series.price.length === 0 &&
    resolvedData.series.sentiment.length === 0 &&
    resolvedData.series.news_volume.length === 0 &&
    resolvedData.alert_spikes.length === 0;
  const observationConclusion = isEmptyLinkage
    ? '当前窗口暂无足够样本形成共振链路，建议切换到样本更丰富的股票或扩大日期范围。'
    : `从当前标的表现看，${linkageType === '同步下压' ? '价格、情绪与热度三条线在同一窗口内形成了较明显的同步下压。' : '三条线存在先后顺序变化，可作为风险演化节奏的观察依据。'}`;
  const divergenceSummary = isEmptyLinkage
    ? '暂无可识别背离点'
    : linkageType === '同步下压'
      ? '未见明显背离，核心变量大体同向。'
      : '价格与情绪并未完全同步，需结合新闻页查看具体原因。';
  const triggerSummary = spike
    ? `锚点日 ${spike.date} 的新闻量升至 ${spike.news_volume} 条，情绪读数 ${spike.sentiment.toFixed(2)}，触发本轮联动诊断。`
    : '当前窗口暂无可用预警锚点，图表仅保留结构化空态。';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(14,20,30,0.92),rgba(12,19,32,0.84),rgba(31,24,30,0.8))] px-5 py-6 ambient-shadow-strong md:px-6">
        <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-[rgba(173,199,255,0.12)] blur-3xl" />
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[rgba(255,180,171,0.10)] blur-3xl" />
        <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(173,199,255,0.28),transparent)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 font-label text-[11px] uppercase tracking-[0.18em]">
              <span className="rounded-full border border-white/8 bg-[var(--color-surface-high)] px-3 py-1.5 text-[var(--color-on-surface-variant)]">{`标的：${instrumentName}`}</span>
              <span className="rounded-full border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.12)] px-3 py-1.5 text-[var(--color-tertiary)]">{`板块：${summary?.sector ?? '消费'}`}</span>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[var(--color-outline)]">联动诊断视图</span>
            </div>
            <div className="font-headline text-[38px] font-extrabold tracking-[-0.04em] text-white md:text-[50px]">情绪与价格联动</div>
            <div className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-on-surface-variant)]">帮助你判断价格变化是否与新闻情绪、新闻数量同步出现变化。</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
            <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-md">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">平均情绪</div>
              <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{summary.avg_sentiment.toFixed(2)}</div>
            </div>
            <div className="rounded-[22px] border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.06)] px-4 py-4 backdrop-blur-md">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">锚点状态</div>
              <div className="mt-2 font-headline text-[20px] font-extrabold text-white">{resolvedData.anchor.anchor_date ? '已形成锚点' : '等待样本'}</div>
            </div>
            <div className="rounded-[22px] border border-[rgba(255,180,171,0.12)] bg-[rgba(255,180,171,0.06)] px-4 py-4 backdrop-blur-md">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">风险状态</div>
              <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{summary?.risk_status ?? '待分析'}</div>
            </div>
          </div>
        </div>
      </div>
      <section className="intel-frame relative overflow-hidden rounded-[28px] border border-[rgba(173,199,255,0.16)] bg-[linear-gradient(145deg,rgba(11,18,30,0.98),rgba(18,27,42,0.96),rgba(37,29,35,0.94))] px-5 py-6 ambient-shadow-strong md:px-6">
        <div className="absolute inset-y-0 right-0 w-[35%] bg-[radial-gradient(circle_at_center,rgba(255,180,171,0.16),transparent_72%)]" />
        <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(173,199,255,0.28),transparent)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">联动诊断结论</div>
            <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">
              共振识别
            </div>
          </div>
          <div className="mt-3 max-w-4xl font-headline text-[28px] font-bold leading-tight text-white md:text-[34px]">
            {diagnosis}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-[rgba(173,199,255,0.12)] bg-[rgba(173,199,255,0.06)] px-4 py-4">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[rgba(173,199,255,0.12)] blur-2xl" />
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">联动类型</div>
              <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{linkageType}</div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.06)] px-4 py-4">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[rgba(45,219,222,0.12)] blur-2xl" />
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">锚点日</div>
              <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{formatAnchorDate(resolvedData.anchor.anchor_date)}</div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,180,171,0.14)] bg-[rgba(255,180,171,0.07)] px-4 py-4">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[rgba(255,180,171,0.12)] blur-2xl" />
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">当前风险状态</div>
              <div className="mt-2 font-headline text-[28px] font-extrabold text-white">{summary?.risk_status ?? '待分析'}</div>
            </div>
          </div>
        </div>
      </section>
      {isEmptyLinkage ? (
        <div className="rounded-2xl border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.08)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface)]">
          当前窗口样本不足，暂无法形成价格、情绪与新闻热度的联动判断。你可以切换股票或调整日期范围后重试。
        </div>
      ) : null}
      <CompositeLinkageChart
        series={resolvedData.series}
        spike={spike}
      />
      <div className="flex max-w-[560px] items-start gap-3 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(54,57,64,0.82),rgba(34,38,46,0.86))] px-4 py-4 shadow-[0_0_28px_rgba(0,0,0,0.18)]">
        <Icon name="anchor" className="pt-1 text-[18px] text-[var(--color-tertiary)]" />
        <div>
          <div className="font-label text-[12px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">锚点日期：{resolvedData.anchor.anchor_date ?? '--'}</div>
          <div className="mt-1 text-sm leading-6 text-[var(--color-on-surface)]">{resolvedData.anchor.note ?? '计算相对于指定交易日收盘时点。'}</div>
        </div>
      </div>
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <article className="ambient-shadow relative overflow-hidden rounded-[28px] border border-[rgba(173,199,255,0.16)] bg-[var(--color-surface-container)] p-5 md:p-6">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-[rgba(173,199,255,0.08)] blur-3xl" />
          <div className="relative">
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">联动关系卡</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-[rgba(173,199,255,0.12)] bg-[rgba(173,199,255,0.06)] px-4 py-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">同步性</div>
              <div className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">
                {linkageType === '同步下压' ? '价格、情绪与热度在同一时间窗内同向变化。' : '变量存在先后次序，需要结合锚点继续观察。'}
              </div>
            </div>
            <div className="rounded-[22px] border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.06)] px-4 py-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">背离点</div>
              <div className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{divergenceSummary}</div>
            </div>
            <div className="rounded-[22px] border border-[rgba(255,180,171,0.14)] bg-[rgba(255,180,171,0.06)] px-4 py-4">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">触发说明</div>
              <div className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{triggerSummary}</div>
            </div>
          </div>
          </div>
        </article>
        <article className="ambient-shadow relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(25,29,37,0.98),rgba(31,36,46,0.96))] p-5 md:p-6">
          <div className="absolute inset-y-0 right-0 w-24 bg-[linear-gradient(180deg,rgba(45,219,222,0.08),transparent)]" />
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">联动观察结论</div>
              <div className="mt-3 rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-7 text-[var(--color-on-surface-variant)]">{observationConclusion}</div>
            </div>
            <div>
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary-container)]">页面定位说明</div>
              <div className="mt-3 space-y-2">
                <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">详情页看当前画像。</div>
                <div className="rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">新闻页看单日原因。</div>
                <div className="rounded-[18px] border border-[rgba(45,219,222,0.12)] bg-[rgba(45,219,222,0.06)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">这一页看价格、情绪与热度是否形成共振。</div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
