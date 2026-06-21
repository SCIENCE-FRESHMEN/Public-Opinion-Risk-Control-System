import { useMemo } from 'react';

import type { StockInsightDetailData } from '../../lib/api/types';
import { useFiltersStore } from '../../store/filters';
import { useLinkageQuery } from '../linkage/useLinkageQuery';
import { useNewsDatesQuery } from '../news/useNewsDatesQuery';
import { useNewsDrilldownQuery } from '../news/useNewsDrilldownQuery';
import { useFiltersQuery } from '../meta/useFiltersQuery';
import { useLlmBriefQuery } from '../meta/useLlmBriefQuery';
import { useMemberBAnalysisQuery } from '../meta/useMemberBAnalysisQuery';
import { useMemberBEnhancedPredictionQuery } from '../meta/useMemberBEnhancedPredictionQuery';
import { useOverviewQuery } from '../overview/useOverviewQuery';
import { useSubmissionStockCoverageQuery } from '../meta/useSubmissionStockCoverageQuery';
import { useSubmissionStockRiskTimelineQuery } from '../meta/useSubmissionStockRiskTimelineQuery';
import { useSubmissionStockPostsQuery } from '../meta/useSubmissionStockPostsQuery';
import { useProjectEvidenceQuery } from '../meta/useProjectEvidenceQuery';
import { createEmptyInsight } from './runtime-fallbacks';

function normalizeRiskLevel(level?: string): '高' | '中' | '低' {
  if (!level) return '中';
  if (level.includes('高')) return '高';
  if (level.includes('低')) return '低';
  return '中';
}

type DataSourceState = 'real' | 'fallback' | 'mixed';

type StockInsightPageDataSources = {
  profile: DataSourceState;
  kpis: DataSourceState;
  linkageSeries: DataSourceState;
  representativePosts: DataSourceState;
  topicTerms: DataSourceState;
  riskTimeline: DataSourceState;
  rumorRatio: DataSourceState;
  aiReport: DataSourceState;
};

export function useStockInsightPageData() {
  const { ticker, endDate } = useFiltersStore();
  const filtersQuery = useFiltersQuery();
  const overviewQuery = useOverviewQuery();
  const linkageQuery = useLinkageQuery();
  const newsDatesQuery = useNewsDatesQuery();
  const activeDate = newsDatesQuery.data?.latest_anchor_in_range ?? endDate;
  const newsDrilldownQuery = useNewsDrilldownQuery(ticker, activeDate);
  const memberBAnalysisQuery = useMemberBAnalysisQuery(ticker);
  const memberBEnhancedPredictionQuery = useMemberBEnhancedPredictionQuery(ticker);
  const llmBriefQuery = useLlmBriefQuery(ticker);
  const submissionStockCoverageQuery = useSubmissionStockCoverageQuery(ticker);
  const submissionRiskTimelineQuery = useSubmissionStockRiskTimelineQuery(ticker);
  const submissionStockPostsQuery = useSubmissionStockPostsQuery(ticker);
  const projectEvidenceQuery = useProjectEvidenceQuery();

  return useMemo(() => {
    const fallback = createEmptyInsight(ticker);
    const instruments = filtersQuery.data?.instrument_groups?.flatMap((group) => group.instruments) ?? [];
    const currentInstrument = instruments.find((instrument) => instrument.symbol === ticker);
    const overviewData = overviewQuery.data;
    const linkageData = linkageQuery.data;
    const newsData = newsDrilldownQuery.data;
    const memberBAnalysis = memberBAnalysisQuery.data;
    const llmBrief = llmBriefQuery.data?.brief;
    const coverage = submissionStockCoverageQuery.data;
    const rumorRatio =
      memberBAnalysis?.matched && memberBAnalysis.total_opinions > 0
        ? memberBAnalysis.rumor_count / memberBAnalysis.total_opinions
        : fallback.kpis.rumor_ratio;
    const resolvedStockName =
      currentInstrument?.name
      ?? coverage?.stock_name
      ?? memberBAnalysis?.stock_name
      ?? fallback.profile.stock_name;
    const resolvedFullName =
      currentInstrument?.full_name
      ?? memberBAnalysis?.stock_name
      ?? fallback.profile.full_name;
    const resolvedSector =
      linkageData?.summary.sector
      ?? currentInstrument?.sector_group
      ?? fallback.profile.sector;
    const resolvedIndustry =
      currentInstrument?.industry
      ?? fallback.profile.industry;
    const resolvedMarket =
      currentInstrument?.market === 'SSE'
        ? '沪市'
        : currentInstrument?.market === 'SZSE'
          ? '深市'
          : fallback.profile.market;
    const resolvedAiReport = llmBrief
      ? {
          title: `${resolvedStockName} 个股研判简报`,
          event_summary: llmBrief.summary,
          sentiment_analysis: llmBrief.sentiment_view,
          rumor_assessment: llmBrief.risk_view,
          risk_warning: llmBrief.risk_view,
          suggestion: llmBrief.action_view,
        }
      : fallback.ai_report;

    const insight: StockInsightDetailData = {
      ...fallback,
      profile: {
        ...fallback.profile,
        ticker: overviewData?.header.ticker ?? ticker ?? fallback.profile.ticker,
        stock_name: resolvedStockName,
        full_name: resolvedFullName,
        sector: resolvedSector,
        industry: resolvedIndustry,
        market: resolvedMarket,
        risk_level: normalizeRiskLevel(overviewData?.kpis.risk.level ?? linkageData?.summary.risk_status ?? fallback.profile.risk_level),
        as_of: overviewData?.header.as_of ?? fallback.profile.as_of,
      },
      kpis: {
        ...fallback.kpis,
        latest_price:
          typeof overviewData?.kpis.price.value === 'number'
            ? overviewData.kpis.price.value
            : fallback.kpis.latest_price,
        price_change_pct:
          typeof overviewData?.kpis.price.delta === 'number'
            ? overviewData.kpis.price.delta * 100
            : fallback.kpis.price_change_pct,
        sentiment_score:
          typeof overviewData?.kpis.sentiment.value === 'number'
            ? overviewData.kpis.sentiment.value
            : fallback.kpis.sentiment_score,
        sentiment_label: overviewData?.kpis.sentiment.label ?? fallback.kpis.sentiment_label,
        heat_score:
          typeof overviewData?.kpis.news_heat.value === 'number'
            ? overviewData.kpis.news_heat.value
            : fallback.kpis.heat_score,
        rumor_ratio: rumorRatio,
      },
      linkage_series: linkageData
        ? {
            price: linkageData.series.price,
            sentiment: linkageData.series.sentiment,
            heat: linkageData.series.news_volume,
          }
        : fallback.linkage_series,
      representative_posts: submissionStockPostsQuery.data?.posts?.length
        ? submissionStockPostsQuery.data.posts
        : newsData?.news_items?.length
          ? newsData.news_items.slice(0, 3).map((item) => ({
              id: item.id,
              source: item.source,
              publish_time: item.publish_time,
              sentiment: item.sentiment === '负面' || item.sentiment === '正面' ? item.sentiment : '中性',
              summary: item.summary,
            }))
        : fallback.representative_posts,
      topic_terms: newsData?.drivers?.length
        ? newsData.drivers.slice(0, 5).map((item) => ({
            term: item.term,
            weight: item.count,
          }))
        : fallback.topic_terms,
      source_breakdown: coverage?.source_items?.length
        ? coverage.source_items.map((item) => ({
            source: item.source,
            value: item.record_count,
          }))
        : fallback.source_breakdown,
      rumor_breakdown: memberBAnalysis?.matched
        ? [
            {
              name: '正常舆情',
              value: Math.max(0, memberBAnalysis.total_opinions - memberBAnalysis.rumor_count),
            },
            {
              name: '疑似谣言',
              value: memberBAnalysis.rumor_count,
            },
          ]
        : fallback.rumor_breakdown,
      risk_timeline: submissionRiskTimelineQuery.data?.events?.length
        ? submissionRiskTimelineQuery.data.events
        : fallback.risk_timeline,
      ai_report: resolvedAiReport,
    };

    const hasOverview = Boolean(overviewData);
    const hasLinkage = Boolean(linkageData);
    const hasNewsItems = Boolean(newsData?.news_items?.length || submissionStockPostsQuery.data?.posts?.length);
    const hasDrivers = Boolean(newsData?.drivers?.length);
    const dataSources: StockInsightPageDataSources = {
      profile: hasOverview || hasLinkage || Boolean(currentInstrument) ? 'mixed' : 'fallback',
      kpis: hasOverview || Boolean(memberBAnalysis?.matched) ? 'mixed' : 'fallback',
      linkageSeries: hasLinkage ? 'real' : 'fallback',
      representativePosts: hasNewsItems ? 'real' : 'fallback',
      topicTerms: hasDrivers ? 'real' : 'fallback',
      riskTimeline: submissionRiskTimelineQuery.data?.events?.length ? 'real' : 'fallback',
      rumorRatio: memberBAnalysis?.matched ? 'real' : 'fallback',
      aiReport: llmBrief ? 'real' : 'fallback',
    };

    return {
      insight,
      memberBAnalysis: memberBAnalysis ?? null,
      memberBEnhancedPrediction: memberBEnhancedPredictionQuery.data ?? null,
      llmBriefMeta: llmBriefQuery.data
        ? {
            generationMode: llmBriefQuery.data.generation_mode,
            dataSources: llmBriefQuery.data.data_sources,
            referenceTime: overviewData?.header.as_of ?? undefined,
            ticker,
            stockName: resolvedStockName,
          }
        : null,
      availableInstruments: instruments,
      projectEvidence: projectEvidenceQuery.data ?? null,
      dataSources,
      isUsingFallback: Object.values(dataSources).some((value) => value !== 'real'),
    };
  }, [
    filtersQuery.data,
    endDate,
    linkageQuery.data,
    llmBriefQuery.data,
    memberBAnalysisQuery.data,
    memberBEnhancedPredictionQuery.data,
    newsDrilldownQuery.data,
    overviewQuery.data,
    submissionStockCoverageQuery.data,
    submissionStockPostsQuery.data,
    submissionRiskTimelineQuery.data,
    projectEvidenceQuery.data,
    ticker,
  ]);
}
