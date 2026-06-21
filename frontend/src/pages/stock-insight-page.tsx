import { MetricCard } from '../components/common/metric-card';
import { CommandCenterChart } from '../features/command-center/command-center-chart';
import { BriefingCard } from '../features/command-center/briefing-card';
import { MemberBAnalysisPanel } from '../features/command-center/member-b-analysis-panel';
import type { RiskLevel, StockInsightDetailData } from '../lib/api/types';
import { useStockInsightPageData } from '../features/command-center/use-stock-insight-page-data';
import { useFiltersStore } from '../store/filters';

const MEMBER_B_TOPIC_HEATMAP_SRC = '/member-b-charts/05_topic_heatmap.png';

function formatPct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function getRiskTone(level: RiskLevel) {
  if (level === '高') {
    return 'border-[rgba(255,180,171,0.26)] bg-[rgba(255,180,171,0.12)] text-[var(--color-error)]';
  }

  if (level === '中') {
    return 'border-[rgba(255,208,102,0.24)] bg-[rgba(255,208,102,0.1)] text-[#ffd36d]';
  }

  return 'border-[rgba(45,219,222,0.24)] bg-[rgba(45,219,222,0.1)] text-[var(--color-tertiary)]';
}

function getSentimentTone(sentiment: StockInsightDetailData['representative_posts'][number]['sentiment']) {
  if (sentiment === '负面') {
    return 'bg-[rgba(255,180,171,0.14)] text-[var(--color-error)]';
  }

  if (sentiment === '正面') {
    return 'bg-[rgba(45,219,222,0.14)] text-[var(--color-tertiary)]';
  }

  return 'bg-[rgba(255,255,255,0.08)] text-[var(--color-on-surface-variant)]';
}

function getSourceAccent(source: string) {
  if (source.includes('公告') || source.includes('交易所')) {
    return 'text-[var(--color-secondary-container)] bg-[rgba(173,199,255,0.12)]';
  }

  if (source.includes('股吧') || source.includes('微博')) {
    return 'text-[var(--color-tertiary)] bg-[rgba(45,219,222,0.12)]';
  }

  return 'text-[var(--color-on-surface-variant)] bg-[rgba(255,255,255,0.08)]';
}

function getPredictionTone(direction?: string) {
  if (direction?.includes('空')) {
    return {
      badge: 'border-[rgba(255,180,171,0.24)] bg-[rgba(255,180,171,0.12)] text-[var(--color-error)]',
      glow: 'from-[rgba(255,180,171,0.2)] via-[rgba(255,180,171,0.08)] to-transparent',
      line: 'from-[rgba(255,180,171,0.7)] to-transparent',
      dot: 'bg-[var(--color-error)]',
    };
  }

  if (direction?.includes('多')) {
    return {
      badge: 'border-[rgba(45,219,222,0.24)] bg-[rgba(45,219,222,0.12)] text-[var(--color-tertiary)]',
      glow: 'from-[rgba(45,219,222,0.18)] via-[rgba(45,219,222,0.06)] to-transparent',
      line: 'from-[rgba(45,219,222,0.72)] to-transparent',
      dot: 'bg-[var(--color-tertiary)]',
    };
  }

  return {
    badge: 'border-[rgba(255,208,102,0.22)] bg-[rgba(255,208,102,0.1)] text-[#ffd36d]',
    glow: 'from-[rgba(255,208,102,0.16)] via-[rgba(255,208,102,0.06)] to-transparent',
    line: 'from-[rgba(255,208,102,0.72)] to-transparent',
    dot: 'bg-[#ffd36d]',
  };
}

type StockInsightPageProps = {
  insight?: StockInsightDetailData;
};

export function StockInsightPage({
  insight: insightProp,
}: StockInsightPageProps) {
  const { ticker, startDate, endDate, setFilters } = useFiltersStore();
  const {
    insight: resolvedInsight,
    memberBAnalysis,
    memberBEnhancedPrediction,
    availableInstruments,
    llmBriefMeta,
    projectEvidence: resolvedProjectEvidence,
    dataSources: dataSourcesProp,
  } = useStockInsightPageData();
  const instrumentOptions = availableInstruments ?? [];
  const insight = insightProp ?? resolvedInsight;
  const projectEvidence = resolvedProjectEvidence;
  const latestPrice = `¥${insight.kpis.latest_price.toFixed(1)}`;
  const rumorRatio = `${Math.round(insight.kpis.rumor_ratio * 100)}%`;
  const dataSources = dataSourcesProp ?? {
    profile: 'fallback',
    kpis: 'fallback',
    linkageSeries: 'fallback',
    representativePosts: 'fallback',
    topicTerms: 'fallback',
    riskTimeline: 'fallback',
    rumorRatio: 'fallback',
    aiReport: 'fallback',
  };
  const supplementalPanels = {
    riskTimeline: insight.risk_timeline,
    aiReport: insight.ai_report,
  };
  const hasLinkageSamples =
    insight.linkage_series.price.length > 0 ||
    insight.linkage_series.sentiment.length > 0 ||
    insight.linkage_series.heat.length > 0;
  const hasRiskTimeline = supplementalPanels.riskTimeline.length > 0;
  const hasRepresentativePosts = insight.representative_posts.length > 0;
  const hasSourceBreakdown = insight.source_breakdown.length > 0;
  const hasRumorBreakdown = insight.rumor_breakdown.length > 0;
  const totalSourceRecords = insight.source_breakdown.reduce((sum, item) => sum + item.value, 0);
  const activeEnhancedPrediction = memberBEnhancedPrediction?.matched ? memberBEnhancedPrediction : null;
  const predictionTone = getPredictionTone(activeEnhancedPrediction?.direction);
  const hasProjectEvidence = Boolean(projectEvidence);
  const projectEvidenceDataset = projectEvidence?.dataset;
  const projectEvidenceModel = projectEvidence?.model;
  const projectEvidencePrediction = projectEvidence?.featured_prediction;

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="intel-frame intel-grid relative overflow-hidden rounded-[30px] border border-[rgba(173,199,255,0.18)] bg-[radial-gradient(circle_at_top_left,rgba(173,199,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,180,171,0.14),transparent_28%),linear-gradient(135deg,rgba(15,18,28,0.98),rgba(23,29,43,0.96),rgba(50,31,37,0.94))] px-5 py-6 ambient-shadow-strong md:px-7 md:py-7">
        <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_center,rgba(255,180,171,0.12),transparent_68%)]" />
        <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(45,219,222,0.4),transparent)]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.15fr,0.85fr] xl:items-end">
          <div className="max-w-3xl">
            <div className="intel-kicker">个股情绪因子详情</div>
            <h1 className="mt-3 font-headline text-[34px] font-extrabold leading-tight tracking-[-0.05em] text-white md:text-[48px]">
              {insight.profile.stock_name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[rgba(45,219,222,0.12)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-tertiary)]">
                {insight.profile.ticker}
              </span>
              <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
                {insight.profile.sector} / {insight.profile.market}
              </span>
              <span className={`rounded-full border px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.16em] ${getRiskTone(insight.profile.risk_level)}`}>
                风险等级 {insight.profile.risk_level}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
              围绕所选个股，把情绪因子与价格、热度、风险时间线及 AI 研判叠加对照，观察情绪因子相对量价提供的增量分歧与风险提示。
            </p>
            <div className="mt-5 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
              数据时间 {insight.profile.as_of}
            </div>
            <div className="mt-4 flex max-w-[280px] flex-col gap-1">
              <label htmlFor="stock-insight-ticker" className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">
                当前分析标的
              </label>
              <select
                id="stock-insight-ticker"
                value={ticker}
                onChange={(event) => setFilters({ ticker: event.target.value, startDate, endDate })}
                className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(7,12,20,0.72)] px-4 py-3 text-sm text-white outline-none"
              >
                {!instrumentOptions.length ? (
                  <option value={ticker}>{insight.profile.stock_name} / {ticker}</option>
                ) : null}
                {instrumentOptions.map((instrument) => (
                  <option key={instrument.symbol} value={instrument.symbol}>
                    {instrument.name} / {instrument.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="最新价格">
              <div className="font-headline text-[34px] font-extrabold leading-none text-white">{latestPrice}</div>
              <div className={`mt-2 font-label text-sm ${insight.kpis.price_change_pct >= 0 ? 'text-[var(--color-secondary-container)]' : 'text-[var(--color-error)]'}`}>
                {formatPct(insight.kpis.price_change_pct)}
              </div>
            </MetricCard>
            <MetricCard title="情绪结论" accent="var(--color-tertiary)">
              <div className="font-headline text-[28px] font-extrabold leading-tight text-white">{insight.kpis.sentiment_label}</div>
              <div className="mt-2 font-label text-sm text-[var(--color-tertiary)]">{insight.kpis.sentiment_score.toFixed(2)}</div>
            </MetricCard>
            <MetricCard title="舆情热度" accent="var(--color-secondary-container)">
              <div className="font-headline text-[34px] font-extrabold leading-none text-white">{insight.kpis.heat_score}</div>
              <div className="mt-2 font-label text-sm text-[var(--color-on-surface-variant)]">全市场重点观察</div>
            </MetricCard>
            <MetricCard title="疑似谣言占比" accent="var(--color-error)">
              <div className="font-headline text-[34px] font-extrabold leading-none text-white">{rumorRatio}</div>
              <div className="mt-2 font-label text-sm text-[var(--color-on-surface-variant)]">需结合时间线持续筛查</div>
            </MetricCard>
          </div>
        </div>
      </section>

      <section className="ambient-shadow rounded-xl border border-[rgba(173,199,255,0.16)] bg-[var(--color-surface-container)] p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">项目证据链</div>
            <h2 className="mt-2 font-headline text-[24px] font-bold text-white">数据接入与算法结果汇总</h2>
          </div>
          <div className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
            当前标的详情页展示
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="舆情记录">
            <div className="font-headline text-[28px] font-extrabold leading-none text-white">
              {projectEvidenceDataset ? projectEvidenceDataset.total_records.toLocaleString('zh-CN') : '--'}
            </div>
            <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
              {projectEvidenceDataset ? `覆盖 ${projectEvidenceDataset.unique_stocks.toLocaleString('zh-CN')} 只股票` : '工程证据数据待加载'}
            </div>
          </MetricCard>
          <MetricCard title="回测触发" accent="var(--color-secondary-container)">
            <div className="font-headline text-[28px] font-extrabold leading-none text-white">
              {projectEvidenceModel ? projectEvidenceModel.trigger_count : '--'}
            </div>
            <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
              {projectEvidenceModel ? `平均前向收益 ${projectEvidenceModel.mean_forward_return.toFixed(4)}` : '回测证据待加载'}
            </div>
          </MetricCard>
          <MetricCard title="预测方向" accent="var(--color-tertiary)">
            <div className="font-headline text-[28px] font-extrabold leading-none text-white">
              {activeEnhancedPrediction?.direction ?? projectEvidencePrediction?.direction ?? '--'}
            </div>
            <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
              {activeEnhancedPrediction || hasProjectEvidence
                ? `置信度 ${Math.round(((activeEnhancedPrediction?.confidence ?? projectEvidencePrediction?.confidence) ?? 0) * 100)}%`
                : '方向信号待加载'}
            </div>
          </MetricCard>
          <MetricCard title="风险评分" accent="var(--color-error)">
            <div className="font-headline text-[28px] font-extrabold leading-none text-white">
              {projectEvidencePrediction ? projectEvidencePrediction.risk_score.toFixed(4) : '--'}
            </div>
            <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
              {projectEvidencePrediction ? `预期波动 ${projectEvidencePrediction.expected_range}` : '波动区间待加载'}
            </div>
          </MetricCard>
        </div>
        <p className="mt-4 text-xs leading-6 text-[var(--color-on-surface-variant)]">
          当前页面采用“真实数据优先、缺失则保持中性空态”的策略：价格、情绪、热度、联动图、代表性舆情与主题词优先来自真实接口，不再回灌旧演示样例。
        </p>
        <p className="mt-2 text-[11px] leading-6 text-[rgba(255,255,255,0.62)]">
          当前数据边界：联动图 {dataSources.linkageSeries}，代表性舆情 {dataSources.representativePosts}，主题词 {dataSources.topicTerms}，风险时间线 {dataSources.riskTimeline}，AI 简报 {dataSources.aiReport}。
        </p>
        {activeEnhancedPrediction ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="intel-frame relative overflow-hidden rounded-[28px] border border-[rgba(45,219,222,0.14)] bg-[linear-gradient(145deg,rgba(11,18,30,0.98),rgba(25,31,45,0.96),rgba(34,28,28,0.94))] p-5 ambient-shadow-strong md:p-6">
              <div className={`absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_60%)]`} />
              <div className={`absolute -left-10 top-0 h-40 w-40 rounded-full bg-gradient-to-br ${predictionTone.glow} blur-3xl`} />
              <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="intel-kicker">增强研判信号</div>
                  <div className="mt-2 font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">增强预测信号</div>
                  <h3 className="mt-4 font-headline text-[34px] font-extrabold tracking-[-0.05em] text-white md:text-[44px]">
                    {activeEnhancedPrediction.direction}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
                    综合情绪、风险规则与预训练模型配置，对当前标的给出方向性辅助判断，适合作为答辩场景中的券商式研判摘要展示。
                  </p>
                </div>
                <div className={`rounded-full border px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em] ${predictionTone.badge}`}>
                  晨会辅助信号
                </div>
              </div>

              <div className="relative mt-6 grid gap-4 lg:grid-cols-[1.08fr,0.92fr]">
                <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 md:p-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-[rgba(255,255,255,0.04)] px-4 py-4">
                      <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">方向结论</div>
                      <div className="mt-3 font-headline text-[24px] font-extrabold text-white">{activeEnhancedPrediction.direction}</div>
                    </div>
                    <div className="rounded-2xl bg-[rgba(255,255,255,0.04)] px-4 py-4">
                      <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">置信度</div>
                      <div className="mt-3 font-headline text-[24px] font-extrabold text-white">
                        {Math.round(activeEnhancedPrediction.confidence * 100)}%
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[rgba(255,255,255,0.04)] px-4 py-4">
                      <div className="font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">风险等级</div>
                      <div className={`mt-3 font-headline text-[24px] font-extrabold ${getRiskTone((activeEnhancedPrediction.risk_level.includes('高') ? '高' : activeEnhancedPrediction.risk_level.includes('低') ? '低' : '中') as RiskLevel)}`}>
                        {activeEnhancedPrediction.risk_level}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${predictionTone.dot}`} />
                      <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">核心研判摘要</div>
                      <div className={`h-px min-w-[72px] flex-1 bg-gradient-to-r ${predictionTone.line}`} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--color-on-surface)]">{activeEnhancedPrediction.explanation}</p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(165deg,rgba(16,22,31,0.9),rgba(27,33,42,0.88))] p-4 md:p-5">
                  <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">模型资质与交付状态</div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgba(255,255,255,0.04)] px-4 py-3">
                      <span className="font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">模型来源</span>
                      <span className="text-sm text-white">{activeEnhancedPrediction.model_name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgba(255,255,255,0.04)] px-4 py-3">
                      <span className="font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">特征维度</span>
                      <span className="text-sm text-white">{activeEnhancedPrediction.feature_count} 维</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgba(255,255,255,0.04)] px-4 py-3">
                      <span className="font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">模型文件</span>
                      <span className={activeEnhancedPrediction.model_ready ? 'text-[var(--color-tertiary)]' : 'text-[var(--color-error)]'}>
                        {activeEnhancedPrediction.model_ready ? '已交付' : '缺失'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgba(255,255,255,0.04)] px-4 py-3">
                      <span className="font-label text-[10px] uppercase tracking-[0.14em] text-[var(--color-outline)]">标准化器</span>
                      <span className={activeEnhancedPrediction.scaler_ready ? 'text-[var(--color-tertiary)]' : 'text-[var(--color-error)]'}>
                        {activeEnhancedPrediction.scaler_ready ? '已交付' : '缺失'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">支持能力</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeEnhancedPrediction.supported_outputs.map((item) => (
                        <span key={item} className="rounded-full border border-[rgba(173,199,255,0.14)] bg-[rgba(173,199,255,0.08)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-[var(--color-secondary-container)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-4 rounded-[24px] border border-[rgba(255,180,171,0.12)] bg-[linear-gradient(90deg,rgba(255,180,171,0.08),rgba(255,255,255,0.02))] px-4 py-4 md:px-5">
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-error)]">风险提示</div>
                <p className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">
                  该模块来自已交付的预训练模型资产与独立预测工具，当前以前端增强展示方式接入，仅作方向性辅助判断，不构成投资建议。
                </p>
                <div className="mt-3 space-y-1.5">
                  {activeEnhancedPrediction.notes.map((note) => (
                    <p key={note} className="text-xs leading-6 text-[rgba(255,255,255,0.62)]">{note}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <MemberBAnalysisPanel analysis={memberBAnalysis} />

      <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <div className="space-y-6">
          {!hasLinkageSamples ? (
            <div className="rounded-2xl border border-[rgba(255,180,171,0.18)] bg-[rgba(255,180,171,0.08)] px-4 py-3 text-sm leading-7 text-[var(--color-on-surface)]">
              当前窗口样本不足，单股联动图暂无法形成有效走势。你可以切换股票或调整日期范围后重试。
            </div>
          ) : null}
          <CommandCenterChart
            series={insight.linkage_series}
            topicTags={insight.topic_terms.map((item) => `${item.term} ${item.weight}`)}
            title={`${insight.profile.stock_name}情绪因子联动`}
            description="把情绪因子与价格、热度三线同屏对照，识别情绪因子相对量价的增量分歧、热点扩散与风险预警拐点。"
            riskLevel={insight.profile.risk_level}
            mode="single-stock"
          />

          <section className="ambient-shadow rounded-xl border border-[rgba(173,199,255,0.16)] bg-[var(--color-surface-container)] p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">风险事件轴</div>
                <h2 className="mt-2 font-headline text-[24px] font-bold text-white">风险时间线</h2>
              </div>
              <div className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
                重点关注舆情触发到价格回撤的链路
              </div>
            </div>
            <div className="relative mt-5 space-y-4 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-[linear-gradient(180deg,rgba(255,180,171,0.35),rgba(45,219,222,0.18))]">
              {hasRiskTimeline ? (
                supplementalPanels.riskTimeline.map((event, index) => (
                  <article key={`${event.time}-${event.title}`} className="relative ml-0 pl-10">
                    <div className={`absolute left-[8px] top-5 h-[18px] w-[18px] rounded-full border-2 ${event.severity === '高' ? 'border-[rgba(255,180,171,0.6)] bg-[rgba(255,180,171,0.22)]' : event.severity === '中' ? 'border-[rgba(255,208,102,0.5)] bg-[rgba(255,208,102,0.16)]' : 'border-[rgba(45,219,222,0.55)] bg-[rgba(45,219,222,0.16)]'}`} />
                    <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 md:p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-headline text-lg font-bold text-white">{event.time}</span>
                        <span className="rounded-full bg-[rgba(173,199,255,0.12)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-secondary-container)]">
                          {event.event_type}
                        </span>
                        <span className={`rounded-full border px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] ${getRiskTone(event.severity)}`}>
                          {event.severity}风险
                        </span>
                        <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-outline)]">
                          节点 {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className="mt-3 font-headline text-xl font-bold text-white">{event.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-on-surface-variant)]">{event.description}</p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm leading-7 text-[var(--color-on-surface-variant)]">
                  当前窗口暂无可展示的风险事件，请切换股票或调整日期范围后重试。
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="intel-frame relative overflow-hidden rounded-[28px] border border-[rgba(173,199,255,0.16)] bg-[linear-gradient(145deg,rgba(12,20,31,0.98),rgba(20,30,42,0.96),rgba(27,35,48,0.94))] p-5 ambient-shadow-strong md:p-6">
            <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_center,rgba(173,199,255,0.14),transparent_68%)]" />
            <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(173,199,255,0.32),transparent)]" />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">算法证据补强</div>
                <h2 className="mt-2 font-headline text-[24px] font-bold text-white">算法主题证据图谱</h2>
              </div>
              <div className="rounded-full border border-[rgba(173,199,255,0.16)] bg-[rgba(173,199,255,0.08)] px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-secondary-container)]">
                主题聚集热力对比
              </div>
            </div>
            <p className="relative mt-4 max-w-3xl text-sm leading-7 text-[var(--color-on-surface-variant)]">
              引入已离线生成的主题热力图，用于补充说明当前项目在主题发现维度的算法输出形态。它和上方主题关键词、右侧代表性舆情摘要共同构成“文本内容 - 主题结构 - 风险解释”的证据链。
            </p>
            <a
              href={MEMBER_B_TOPIC_HEATMAP_SRC}
              target="_blank"
              rel="noreferrer"
              className="relative mt-5 block overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]"
            >
              <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-[rgba(7,12,20,0.72)] px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] text-[var(--color-secondary-container)]">
                算法证据图
              </div>
              <img src={MEMBER_B_TOPIC_HEATMAP_SRC} alt="主题热力图" className="h-auto w-full object-cover" />
            </a>
          </section>

          <section className="ambient-shadow rounded-xl border border-[rgba(255,180,171,0.18)] bg-[linear-gradient(145deg,rgba(34,38,49,0.98),rgba(53,31,38,0.92))] p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">舆情样本</div>
                <h2 className="mt-2 font-headline text-[24px] font-bold text-white">代表性舆情摘要</h2>
              </div>
              <div className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
                展示多源中文舆情样本
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {hasRepresentativePosts ? (
                insight.representative_posts.map((item, index) => (
                  <article key={item.id} className="intel-frame rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(45,219,222,0.16)] bg-[rgba(45,219,222,0.08)] font-label text-[11px] text-[var(--color-tertiary)]">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-outline)]">{item.publish_time}</span>
                          <span className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] ${getSourceAccent(item.source)}`}>
                            {item.source}
                          </span>
                          <span className={`rounded-full px-3 py-1 font-label text-[10px] uppercase tracking-[0.16em] ${getSentimentTone(item.sentiment)}`}>
                            {item.sentiment}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white">{item.summary}</p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-5 text-sm leading-7 text-[var(--color-on-surface-variant)]">
                  当前窗口暂无代表性舆情样本，请切换股票或调整日期范围后重试。
                </div>
              )}
            </div>
          </section>

          <section className="ambient-shadow rounded-xl border border-[rgba(173,199,255,0.16)] bg-[var(--color-surface-container)] p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">覆盖与风险构成</div>
                <h2 className="mt-2 font-headline text-[24px] font-bold text-white">来源覆盖与风控占比</h2>
              </div>
              <div className="font-label text-[11px] uppercase tracking-[0.16em] text-[var(--color-on-surface-variant)]">
                来自真实采集与风险识别结果
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <article className="intel-frame rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">来源覆盖</div>
                {hasSourceBreakdown ? (
                  <div className="mt-4 space-y-3">
                    {insight.source_breakdown.map((item) => {
                      const width = totalSourceRecords > 0 ? Math.max(8, Math.round((item.value / totalSourceRecords) * 100)) : 0;

                      return (
                        <div key={item.source}>
                          <div className="flex items-center justify-between gap-3 text-sm text-white">
                            <span>{item.source}</span>
                            <span className="font-label text-[11px] text-[var(--color-on-surface-variant)]">{item.value}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
                            <div className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(45,219,222,0.9),rgba(173,199,255,0.9))]" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">当前暂无来源覆盖统计。</p>
                )}
              </article>
              <article className="intel-frame rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">疑似谣言占比</div>
                {hasRumorBreakdown ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {insight.rumor_breakdown.map((item) => (
                      <div key={item.name} className={`rounded-2xl px-4 py-4 ${item.name.includes('谣言') ? 'bg-[rgba(255,180,171,0.12)]' : 'bg-[rgba(45,219,222,0.08)]'}`}>
                        <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-outline)]">{item.name}</div>
                        <div className="mt-3 font-headline text-[28px] font-extrabold text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[var(--color-on-surface-variant)]">当前暂无谣言占比统计。</p>
                )}
              </article>
            </div>
          </section>

          <section className="space-y-3">
            <div className="px-1">
              <div className="font-label text-[10px] uppercase tracking-[0.18em] text-[var(--color-tertiary)]">AI 个股研判简报</div>
              <div className="mt-2 hidden">
                <span>研判摘要</span>
                <span>谣言评估</span>
              </div>
            </div>
            <BriefingCard
              brief={{
                headline: supplementalPanels.aiReport.title,
                summary: supplementalPanels.aiReport.event_summary,
                sentiment_view: supplementalPanels.aiReport.sentiment_analysis,
                risk_view: supplementalPanels.aiReport.rumor_assessment,
                action_view: supplementalPanels.aiReport.suggestion,
              }}
              report={supplementalPanels.aiReport}
              meta={llmBriefMeta ?? undefined}
            />
          </section>
        </div>
      </section>
    </div>
  );
}
