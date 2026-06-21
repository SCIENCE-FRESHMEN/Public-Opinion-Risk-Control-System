export interface InstrumentSummary {
  symbol: string;
  code: string;
  name: string;
  full_name: string;
  market: string;
  board: string;
  sector_group: string;
  industry: string;
  aliases: string[];
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface InstrumentGroup {
  group_name: string;
  instruments: InstrumentSummary[];
}

export interface FiltersResponse {
  tickers: string[];
  instrument_groups: InstrumentGroup[];
  date_range: { start: string; end: string };
  defaults: { ticker: string; start_date: string; end_date: string };
}

export interface StatusResponse {
  artifacts: Array<{ name: string; exists: boolean; path: string }>;
}

export interface SubmissionHeatTopResponse {
  rows: Array<{
    rank: number;
    ticker: string;
    stock_name: string;
    heat_score: number;
    sentiment_score: number;
    risk_level: RiskLevel;
    change_pct: number;
  }>;
}

export interface SubmissionRiskEventsResponse {
  events: Array<{
    time: string;
    ticker: string;
    stock_name: string;
    title: string;
    severity: RiskLevel;
    source: string;
  }>;
}

export interface SubmissionStockRiskTimelineResponse {
  events: Array<{
    time: string;
    event_type: string;
    title: string;
    description: string;
    severity: RiskLevel;
  }>;
}

export interface SubmissionStockPostsResponse {
  posts: Array<{
    id: string;
    source: string;
    publish_time: string;
    sentiment: '正面' | '中性' | '负面';
    summary: string;
  }>;
}

export interface SubmissionStockCoverageResponse {
  ticker: string;
  stock_name: string;
  quote: number;
  important_official_count: number;
  official_count: number;
  news_count: number;
  guba_count: number;
  active_source_count: number;
  latest_capture_time: string;
  quote_status: string;
  source_items: Array<{
    source: string;
    record_count: number;
    status: string;
  }>;
}

export interface ProjectEvidenceResponse {
  dataset: {
    total_records: number;
    unique_stocks: number;
    total_news_count: number;
    total_comment_count: number;
    window_start: string;
    window_end: string;
  };
  model: {
    trigger_count: number;
    mean_forward_return: number;
    max_drawdown: number;
    negative_return_ratio: number;
    volatility: number;
  };
  featured_prediction: {
    direction: string;
    confidence: number;
    risk_score: number;
    expected_range: string;
  };
}

export interface AcquisitionSummaryResponse {
  stock_pool_count: number;
  selection_mode: string;
  window_start: string;
  window_end: string;
  unified_event_coverage: number;
  latest_generated_at: string;
  external_site_url: string;
  coverage_items: Array<{
    source: string;
    covered: number;
    total: number;
    coverage_ratio: number;
  }>;
}

export interface MemberBAnalysisResponse {
  matched: boolean;
  ticker: string;
  stock_code: string;
  stock_name: string;
  generated_at: string;
  mean_sentiment: number;
  total_opinions: number;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  risk_score: number;
  risk_level: RiskLevel;
  risk_label: string;
  rumor_count: number;
  triggered_rules: string[];
  risk_factors: string[];
  top_topics: Array<{
    keyword: string;
    score: number;
    frequency: number;
  }>;
  risk_timeline: Array<{
    date: string;
    risk_score: number;
    sentiment_weighted: number;
    negative_ratio: number;
    opinion_count: number;
  }>;
  covered_stocks: Array<{
    ticker: string;
    stock_name: string;
    risk_label: string;
    mean_sentiment: number;
    total_opinions: number;
  }>;
}

export interface MemberBEnhancedPredictionResponse {
  matched: boolean;
  ticker: string;
  stock_name: string;
  model_name: string;
  model_ready: boolean;
  scaler_ready: boolean;
  feature_count: number;
  direction: string;
  confidence: number;
  risk_level: string;
  explanation: string;
  notes: string[];
  supported_outputs: string[];
}

export interface LlmBriefResponse {
  ticker: string;
  stock_name: string;
  generation_mode: string;
  data_sources: string[];
  brief: {
    headline: string;
    summary: string;
    sentiment_view: string;
    risk_view: string;
    action_view: string;
  };
}

export interface SeriesPoint {
  date: string;
  value: number;
}

export type RiskLevel = '高' | '中' | '低';

export interface RatioSlice {
  name: string;
  value: number;
}

export interface SourceBreakdownItem {
  source: string;
  value: number;
}

export interface OverviewResponse {
  header: { ticker: string; as_of: string };
  kpis: {
    price: { value: number | string; delta?: number | null; label?: string | null };
    sentiment: { value: number | string; delta?: number | null; label?: string | null };
    news_heat: { value: number | string; delta?: number | null; label?: string | null };
    risk: { level: string; label: string };
  };
  price_context: SeriesPoint[];
  alerts: Array<{
    trade_date: string;
    timestamp: string;
    alert_type: string;
    severity: string;
    description: string;
  }>;
}

export interface LinkageResponse {
  summary: {
    ticker: string;
    sector: string;
    avg_sentiment: number;
    risk_status: string;
  };
  series: {
    price: SeriesPoint[];
    sentiment: SeriesPoint[];
    news_volume: SeriesPoint[];
  };
  alert_spikes: Array<{
    date: string;
    price: number;
    sentiment: number;
    news_volume: number;
    label: string;
  }>;
  anchor: {
    anchor_date: string;
    note: string;
  };
}

export interface NewsDatesResponse {
  dates: string[];
  range_start?: string | null;
  range_end?: string | null;
  latest_anchor_in_range?: string | null;
}

export interface NewsDrilldownResponse {
  header: {
    ticker: string;
    alert_date: string;
    summary: string;
    range_start?: string | null;
    range_end?: string | null;
  };
  stats: {
    negative_ratio: number;
    negative_vs_30d: number;
    total_signals: number;
  };
  drivers: Array<{
    term: string;
    count: number;
  }>;
  news_items: Array<{
    id: string;
    title: string;
    source: string;
    publish_time: string;
    topic_tags: string[];
    sentiment: string;
    confidence: number;
    summary: string;
  }>;
  anchor: {
    anchor_date: string;
    note: string;
    in_range?: boolean;
  };
}

export interface BacktestResponse {
  summary: {
    historical_triggers: number;
    mean_forward_return: number;
    max_drawdown: number;
    negative_hit_rate: number;
  };
  active_alert_type: string;
  trajectory: Array<{
    horizon: number;
    avg_return: number;
  }>;
  distribution: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  };
  events: Array<{
    ticker: string;
    trade_date: string;
    alert_type: string;
    horizon: number;
    forward_return: number;
  }>;
}

export interface CommandCenterDashboardData {
  header: {
    title: string;
    subtitle: string;
    as_of: string;
    market_status: '盘中监测' | '已收盘' | '盘前准备';
    monitored_stocks: number;
    total_records: number;
    active_alerts: number;
    rumor_events: number;
  };
  featured_stock: {
    ticker: string;
    stock_name: string;
    sector: string;
    risk_level: RiskLevel;
    sentiment_label: string;
    latest_price: number;
    price_change_pct: number;
  };
  heat_top10: Array<{
    rank: number;
    ticker: string;
    stock_name: string;
    heat_score: number;
    sentiment_score: number;
    risk_level: RiskLevel;
    change_pct: number;
  }>;
  linkage_series: {
    price: SeriesPoint[];
    sentiment: SeriesPoint[];
    heat: SeriesPoint[];
  };
  rumor_pie: RatioSlice[];
  source_breakdown: SourceBreakdownItem[];
  topic_tags: string[];
  risk_events: Array<{
    time: string;
    ticker: string;
    stock_name: string;
    title: string;
    severity: RiskLevel;
    source: string;
  }>;
  ai_brief: {
    headline: string;
    summary: string;
    sentiment_view: string;
    risk_view: string;
    action_view: string;
  };
}

export interface StockInsightDetailData {
  profile: {
    ticker: string;
    stock_name: string;
    full_name: string;
    sector: string;
    industry: string;
    market: string;
    risk_level: RiskLevel;
    as_of: string;
  };
  kpis: {
    latest_price: number;
    price_change_pct: number;
    sentiment_score: number;
    sentiment_label: string;
    heat_score: number;
    rumor_ratio: number;
  };
  linkage_series: {
    price: SeriesPoint[];
    sentiment: SeriesPoint[];
    heat: SeriesPoint[];
  };
  risk_timeline: Array<{
    time: string;
    event_type: string;
    title: string;
    description: string;
    severity: RiskLevel;
  }>;
  rumor_breakdown: RatioSlice[];
  source_breakdown: SourceBreakdownItem[];
  topic_terms: Array<{
    term: string;
    weight: number;
  }>;
  representative_posts: Array<{
    id: string;
    source: string;
    publish_time: string;
    sentiment: '正面' | '中性' | '负面';
    summary: string;
  }>;
  ai_report: {
    title: string;
    event_summary: string;
    sentiment_analysis: string;
    rumor_assessment: string;
    risk_warning: string;
    suggestion: string;
  };
}
