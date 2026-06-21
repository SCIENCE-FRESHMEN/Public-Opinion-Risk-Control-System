import type { CommandCenterDashboardData, StockInsightDetailData } from '../../lib/api/types';

export function createEmptyDashboard(ticker: string): CommandCenterDashboardData {
  return {
    header: {
      title: '上市公司网络舆情风控态势感知平台',
      subtitle: '券商舆情风控指挥中枢',
      as_of: '',
      market_status: '已收盘',
      monitored_stocks: 0,
      total_records: 0,
      active_alerts: 0,
      rumor_events: 0,
    },
    featured_stock: {
      ticker,
      stock_name: ticker,
      sector: '待分析',
      risk_level: '中',
      sentiment_label: '待分析',
      latest_price: 0,
      price_change_pct: 0,
    },
    heat_top10: [],
    linkage_series: {
      price: [],
      sentiment: [],
      heat: [],
    },
    rumor_pie: [],
    source_breakdown: [],
    topic_tags: [],
    risk_events: [],
    ai_brief: {
      headline: '当前暂无自动研判结果',
      summary: '等待舆情样本、行情与分析结果完成聚合后生成首页简报。',
      sentiment_view: '当前暂无情绪结论，请先检查联动数据与样本覆盖情况。',
      risk_view: '当前暂无可判定的显著风险事件。',
      action_view: '可先切换标的或调整日期范围，以触发新的联动分析结果。',
    },
  };
}

export function createEmptyInsight(ticker: string): StockInsightDetailData {
  return {
    profile: {
      ticker,
      stock_name: ticker,
      full_name: ticker,
      sector: '待分析',
      industry: '待分析',
      market: '待分析',
      risk_level: '中',
      as_of: '',
    },
    kpis: {
      latest_price: 0,
      price_change_pct: 0,
      sentiment_score: 0,
      sentiment_label: '待分析',
      heat_score: 0,
      rumor_ratio: 0,
    },
    linkage_series: {
      price: [],
      sentiment: [],
      heat: [],
    },
    risk_timeline: [],
    rumor_breakdown: [],
    source_breakdown: [],
    topic_terms: [],
    representative_posts: [],
    ai_report: {
      title: `${ticker} 个股研判简报`,
      event_summary: '当前暂无可总结的关键事件。',
      sentiment_analysis: '当前暂无足够样本形成情绪判断。',
      rumor_assessment: '当前暂无可确认的谣言风险。',
      risk_warning: '请结合新的舆情样本与行情数据再次查看。',
      suggestion: '建议切换日期范围或目标标的后继续分析。',
    },
  };
}
