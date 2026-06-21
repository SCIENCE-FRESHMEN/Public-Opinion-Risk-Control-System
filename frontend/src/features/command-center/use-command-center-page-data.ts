import { useMemo } from 'react';

import { useLinkageQuery } from '../linkage/useLinkageQuery';
import { useOverviewQuery } from '../overview/useOverviewQuery';
import { useFiltersQuery } from '../meta/useFiltersQuery';
import { useSubmissionHeatTopQuery } from '../meta/useSubmissionHeatTopQuery';
import { useSubmissionRiskEventsQuery } from '../meta/useSubmissionRiskEventsQuery';
import { useProjectEvidenceQuery } from '../meta/useProjectEvidenceQuery';
import { useAcquisitionSummaryQuery } from '../meta/useAcquisitionSummaryQuery';
import { useLlmBriefQuery } from '../meta/useLlmBriefQuery';
import type {
  CommandCenterDashboardData,
  StockInsightDetailData,
  SubmissionHeatTopResponse,
  LlmBriefResponse,
  SubmissionRiskEventsResponse,
} from '../../lib/api/types';
import { createEmptyDashboard, createEmptyInsight } from './runtime-fallbacks';
import { resolvePrimaryTicker } from './command-center-data-utils';

type DataSourceState = 'real' | 'fallback' | 'mixed';

type CommandCenterPageDataSources = {
  header: DataSourceState;
  featuredStock: DataSourceState;
  linkageSeries: DataSourceState;
  heatTop10: DataSourceState;
  riskEvents: DataSourceState;
  aiBrief: DataSourceState;
  stockAiReport: DataSourceState;
};

function normalizeRiskLevel(level?: string): '高' | '中' | '低' {
  if (!level) return '中';
  if (level.includes('高')) return '高';
  if (level.includes('低')) return '低';
  return '中';
}

function buildCommandCenterDashboard(
  overviewData: ReturnType<typeof useOverviewQuery>['data'],
  linkageData: ReturnType<typeof useLinkageQuery>['data'],
  filtersData: ReturnType<typeof useFiltersQuery>['data'],
  submissionHeatData: SubmissionHeatTopResponse | undefined,
  submissionRiskEventsData: SubmissionRiskEventsResponse | undefined,
  llmBriefData: LlmBriefResponse | undefined,
): CommandCenterDashboardData {
  const fallback = createEmptyDashboard(
    overviewData?.header.ticker
      ?? linkageData?.summary.ticker
      ?? submissionHeatData?.rows?.[0]?.ticker
      ?? filtersData?.defaults?.ticker
      ?? 'UNKNOWN',
  );
  const topHeatRow = submissionHeatData?.rows?.[0];
  const filterInstruments = filtersData?.instrument_groups?.flatMap((group) => group.instruments) ?? [];
  const currentTicker = resolvePrimaryTicker({
    overviewTicker: overviewData?.header.ticker,
    linkageTicker: linkageData?.summary.ticker,
    filterTicker: filtersData?.defaults?.ticker,
    heatTopTicker: topHeatRow?.ticker,
    fallbackTicker: fallback.featured_stock.ticker,
  });
  const currentInstrument = filterInstruments.find((instrument) => instrument.symbol === currentTicker);
  const alignedHeatRow = submissionHeatData?.rows?.find((row) => row.ticker === currentTicker);
  const riskLevel = normalizeRiskLevel(
    overviewData?.kpis.risk.level
      ?? linkageData?.summary.risk_status
      ?? alignedHeatRow?.risk_level
      ?? fallback.featured_stock.risk_level,
  );
  const latestPrice =
    typeof overviewData?.kpis.price.value === 'number'
      ? overviewData.kpis.price.value
      : alignedHeatRow
        ? fallback.featured_stock.latest_price
      : fallback.featured_stock.latest_price;
  const priceChangePct =
    typeof overviewData?.kpis.price.delta === 'number'
      ? overviewData.kpis.price.delta * 100
      : alignedHeatRow?.change_pct ?? fallback.featured_stock.price_change_pct
  ;
  const sentimentScore =
    typeof overviewData?.kpis.sentiment.value === 'number'
      ? overviewData.kpis.sentiment.value
      : alignedHeatRow?.sentiment_score ?? fallback.heat_top10[0]?.sentiment_score ?? 0
  ;
  const sentimentLabel =
    overviewData?.kpis.sentiment.label
      ?? fallback.featured_stock.sentiment_label;
  const resolvedHeatTop10 = submissionHeatData?.rows?.length
    ? submissionHeatData.rows
    : fallback.heat_top10.map((row, index) =>
        index === 0
          ? {
              ...row,
              ticker: currentTicker,
              stock_name: currentInstrument?.name ?? row.stock_name,
              sentiment_score: sentimentScore,
              risk_level: riskLevel,
              change_pct: priceChangePct,
            }
          : row,
      );
  const resolvedRiskEvents = submissionRiskEventsData?.events?.length
    ? submissionRiskEventsData.events
    : fallback.risk_events;

  return {
    ...fallback,
    header: {
      ...fallback.header,
      as_of: overviewData?.header.as_of ?? fallback.header.as_of,
      monitored_stocks: filtersData?.tickers?.length ?? fallback.header.monitored_stocks,
      active_alerts: overviewData?.alerts?.length ?? fallback.header.active_alerts,
    },
    featured_stock: {
      ticker: currentTicker,
      stock_name: currentInstrument?.name ?? alignedHeatRow?.stock_name ?? fallback.featured_stock.stock_name,
      sector: linkageData?.summary.sector ?? currentInstrument?.sector_group ?? fallback.featured_stock.sector,
      risk_level: riskLevel,
      sentiment_label: sentimentLabel,
      latest_price: latestPrice,
      price_change_pct: priceChangePct,
    },
    linkage_series: linkageData
      ? {
          price: linkageData.series.price,
          sentiment: linkageData.series.sentiment,
          heat: linkageData.series.news_volume,
        }
      : fallback.linkage_series,
    heat_top10: resolvedHeatTop10,
    risk_events: resolvedRiskEvents,
    ai_brief: llmBriefData?.brief ?? fallback.ai_brief,
  };
}

function buildStockInsight(
  dashboard: CommandCenterDashboardData,
  overviewData: ReturnType<typeof useOverviewQuery>['data'],
  linkageData: ReturnType<typeof useLinkageQuery>['data'],
): StockInsightDetailData {
  const fallback = createEmptyInsight(dashboard.featured_stock.ticker);
  return {
    ...fallback,
    profile: {
      ...fallback.profile,
      ticker: dashboard.featured_stock.ticker,
      stock_name: dashboard.featured_stock.stock_name,
      sector: dashboard.featured_stock.sector,
      risk_level: dashboard.featured_stock.risk_level,
      as_of: overviewData?.header.as_of ?? fallback.profile.as_of,
    },
    kpis: {
      ...fallback.kpis,
      latest_price: dashboard.featured_stock.latest_price,
      price_change_pct: dashboard.featured_stock.price_change_pct,
      sentiment_score:
        typeof overviewData?.kpis.sentiment.value === 'number'
          ? overviewData.kpis.sentiment.value
          : fallback.kpis.sentiment_score,
      sentiment_label: dashboard.featured_stock.sentiment_label,
    },
    linkage_series: linkageData
      ? {
          price: linkageData.series.price,
          sentiment: linkageData.series.sentiment,
          heat: linkageData.series.news_volume,
        }
      : fallback.linkage_series,
  };
}

export function useCommandCenterPageData() {
  const overviewQuery = useOverviewQuery();
  const linkageQuery = useLinkageQuery();
  const filtersQuery = useFiltersQuery();
  const submissionHeatTopQuery = useSubmissionHeatTopQuery();
  const submissionRiskEventsQuery = useSubmissionRiskEventsQuery();
  const projectEvidenceQuery = useProjectEvidenceQuery();
  const acquisitionSummaryQuery = useAcquisitionSummaryQuery();
  const primaryTicker = resolvePrimaryTicker({
    overviewTicker: overviewQuery.data?.header.ticker,
    linkageTicker: linkageQuery.data?.summary.ticker,
    filterTicker: filtersQuery.data?.defaults?.ticker,
    heatTopTicker: submissionHeatTopQuery.data?.rows?.[0]?.ticker,
    fallbackTicker: 'UNKNOWN',
  });
  const llmBriefQuery = useLlmBriefQuery(
    primaryTicker,
  );

  return useMemo(() => {
    const dashboard = buildCommandCenterDashboard(
      overviewQuery.data,
      linkageQuery.data,
      filtersQuery.data,
      submissionHeatTopQuery.data,
      submissionRiskEventsQuery.data,
      llmBriefQuery.data,
    );
    const insight = buildStockInsight(dashboard, overviewQuery.data, linkageQuery.data);
    const hasOverview = Boolean(overviewQuery.data);
    const hasLinkage = Boolean(linkageQuery.data);
    const hasFilters = Boolean(filtersQuery.data);
    const dataSources: CommandCenterPageDataSources = {
      header: hasOverview || hasFilters ? 'mixed' : 'fallback',
      featuredStock: hasOverview || hasLinkage || hasFilters ? 'mixed' : 'fallback',
      linkageSeries: hasLinkage ? 'real' : 'fallback',
      heatTop10: submissionHeatTopQuery.data?.rows?.length ? 'real' : 'fallback',
      riskEvents: submissionRiskEventsQuery.data?.events?.length ? 'real' : 'fallback',
      aiBrief: llmBriefQuery.data ? 'real' : 'fallback',
      stockAiReport: 'fallback',
    };

    return {
      dashboard,
      insight,
      llmBriefMeta: llmBriefQuery.data
        ? {
            generationMode: llmBriefQuery.data.generation_mode,
            dataSources: llmBriefQuery.data.data_sources,
            referenceTime: overviewQuery.data?.header.as_of ?? undefined,
            ticker: primaryTicker,
            stockName: dashboard.featured_stock.stock_name,
          }
        : null,
      projectEvidence: projectEvidenceQuery.data ?? null,
      acquisitionSummary: acquisitionSummaryQuery.data ?? null,
      dataSources,
      isUsingFallback: Object.values(dataSources).some((value) => value !== 'real'),
    };
  }, [
    filtersQuery.data,
    linkageQuery.data,
    overviewQuery.data,
    llmBriefQuery.data,
    submissionHeatTopQuery.data,
    submissionRiskEventsQuery.data,
    projectEvidenceQuery.data,
    acquisitionSummaryQuery.data,
  ]);
}
