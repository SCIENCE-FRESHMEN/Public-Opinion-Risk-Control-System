import type {
  BacktestResponse,
  CommandCenterDashboardData,
  LinkageResponse,
  NewsDatesResponse,
  NewsDrilldownResponse,
  OverviewResponse,
  RiskLevel,
  StockInsightDetailData,
} from '../../lib/api/types';

function normalizeRiskLevel(value: string): RiskLevel {
  if (value.includes('高')) return '高';
  if (value.includes('中')) return '中';
  return '低';
}

export const projectEvidence = {
  dataset: {
    totalRecords: 29068,
    uniqueStocks: 1000,
    totalReadCount: 7970407,
    totalCommentCount: 598667,
    windowStart: '2026-05-01',
    windowEnd: '2026-05-21',
  },
  model: {
    featureCount: 52,
    bestCvAuc: 0.6014,
    cvAccuracy: 0.7182,
    cvF1: 0.502,
    mergedSamples: 4494,
  },
  featuredPrediction: {
    direction: '上涨',
    confidence: 0.6316,
    riskScore: 0.5164,
    expectedRange: '+2.9% ~ +8.8%',
  },
} as const;

const fulingInsight: StockInsightDetailData = {
  profile: {
    ticker: '600452.SH',
    stock_name: '涪陵电力',
    full_name: '重庆涪陵电力实业股份有限公司',
    sector: '电力',
    industry: '电力运营与能源服务',
    market: '沪市',
    risk_level: normalizeRiskLevel('中等'),
    as_of: '2026-05-22 09:11:28',
  },
  kpis: {
    latest_price: 12.46,
    price_change_pct: -2.3511,
    sentiment_score: 0.4444,
    sentiment_label: '震荡下行',
    heat_score: 100,
    rumor_ratio: 0.24,
  },
  linkage_series: {
    price: [
      { date: '2026-05-15', value: 12.68 },
      { date: '2026-05-16', value: 12.68 },
      { date: '2026-05-19', value: 13.62 },
      { date: '2026-05-20', value: 12.76 },
      { date: '2026-05-21', value: 12.46 },
    ],
    sentiment: [
      { date: '2026-05-15', value: 0.9156 },
      { date: '2026-05-16', value: 0.0639 },
      { date: '2026-05-19', value: 0.5926 },
      { date: '2026-05-20', value: 0.7190 },
      { date: '2026-05-21', value: 0.4444 },
    ],
    heat: [
      { date: '2026-05-15', value: 8 },
      { date: '2026-05-16', value: 5 },
      { date: '2026-05-19', value: 100 },
      { date: '2026-05-20', value: 47 },
      { date: '2026-05-21', value: 52 },
    ],
  },
  risk_timeline: [
    {
      time: '2026-05-19 11:38',
      event_type: '热点爆发',
      title: '“光之暗面”集体爆发，电力概念热度急升',
      description: '高热帖子集中爆发，阅读量和评论量显著抬升，带动舆情热度达到观察窗口峰值。',
      severity: '中',
    },
    {
      time: '2026-05-19 06:34',
      event_type: '主题催化',
      title: '“六张网”超 7 万亿投资带动算力电力概念',
      description: '算力网与电力基础设施相关讨论升温，成为情绪上行的重要事件背景。',
      severity: '中',
    },
    {
      time: '2026-05-20 09:30',
      event_type: '波动回撤',
      title: '涨停后次日回撤，短线分歧快速放大',
      description: '价格由强转弱，情绪仍处高位，形成典型的高热度与高波动并存状态。',
      severity: '高',
    },
  ],
  rumor_breakdown: [
    { name: '正常舆情', value: 76 },
    { name: '疑似噪声', value: 14 },
    { name: '高波动风险', value: 10 },
  ],
  source_breakdown: [
    { source: '东方财富股吧', value: 88 },
    { source: '机器报告', value: 12 },
  ],
  topic_terms: [
    { term: '电力', weight: 100 },
    { term: '减持', weight: 77 },
    { term: '涪陵', weight: 64 },
    { term: '增持', weight: 60 },
    { term: '算力', weight: 30 },
  ],
  representative_posts: [
    {
      id: '600452-post-1',
      source: '东方财富股吧',
      publish_time: '2026-05-19 11:38',
      sentiment: '正面',
      summary: '5分钟封死涨停板，“光之暗面”集体爆发，带动电力概念关注度大幅提升。',
    },
    {
      id: '600452-post-2',
      source: '东方财富股吧',
      publish_time: '2026-05-19 06:34',
      sentiment: '正面',
      summary: '“六张网”超 7 万亿投资与算力网概念梳理，强化市场对电力基础设施的想象空间。',
    },
    {
      id: '600452-post-3',
      source: '东方财富股吧',
      publish_time: '2026-05-20 03:00',
      sentiment: '中性',
      summary: '电力板块大爆发后，投资者开始讨论高位持续性与 AI 时代电力成长逻辑。',
    },
  ],
  ai_report: {
    title: '涪陵电力个股舆情研判简报',
    event_summary: '观察窗口内涪陵电力的舆情热度在 2026 年 5 月 19 日集中爆发，核心事件围绕电力板块、算力网建设和题材催化展开。',
    sentiment_analysis: '情绪得分从极高位回落到 0.4444，整体呈现“震荡下行”。这说明短线追涨情绪退潮，但市场关注并未彻底消散。',
    rumor_assessment: '当前并非典型谣言驱动，更像高热题材引发的分歧放大；需要重点关注情绪分歧度和次日价格承接情况。',
    risk_warning: '综合风险等级为中，风险评分 0.5164。主要风险来自情绪分歧度偏高、舆情量激增以及近期价格波动显著放大。',
    suggestion: '短线重点跟踪情绪回落后的价格承接能力，并结合 SHAP 中最重要的舆情量与波动特征判断次日方向。',
  },
};

const changjiangInsight: StockInsightDetailData = {
  profile: {
    ticker: '600900.SH',
    stock_name: '长江电力',
    full_name: '中国长江电力股份有限公司',
    sector: '电力',
    industry: '水电运营',
    market: '沪市',
    risk_level: normalizeRiskLevel('低'),
    as_of: '2026-05-22 09:11:07',
  },
  kpis: {
    latest_price: 26.66,
    price_change_pct: -0.8922,
    sentiment_score: 0.4666,
    sentiment_label: '平稳',
    heat_score: 18,
    rumor_ratio: 0.08,
  },
  linkage_series: {
    price: [{ date: '2026-05-21', value: 26.66 }],
    sentiment: [{ date: '2026-05-21', value: 0.4666 }],
    heat: [{ date: '2026-05-21', value: 18 }],
  },
  risk_timeline: [
    {
      time: '2026-05-21 11:39',
      event_type: '盘中讨论',
      title: '盘中交易讨论为主，情绪整体平稳',
      description: '主要帖子集中在短线交易判断和可转债话题，缺乏持续性的强事件催化。',
      severity: '低',
    },
  ],
  rumor_breakdown: [
    { name: '正常舆情', value: 92 },
    { name: '疑似噪声', value: 8 },
  ],
  source_breakdown: [
    { source: '东方财富股吧', value: 93 },
    { source: '机器报告', value: 7 },
  ],
  topic_terms: [
    { term: '电力', weight: 100 },
    { term: '长江', weight: 98 },
    { term: '股东会', weight: 58 },
    { term: '主力', weight: 50 },
    { term: '需谨慎', weight: 35 },
  ],
  representative_posts: [
    {
      id: '600900-post-1',
      source: '东方财富股吧',
      publish_time: '2026-05-21 11:39',
      sentiment: '中性',
      summary: '22:00 前不出新低准备出手开多，讨论偏交易节奏判断。',
    },
    {
      id: '600900-post-2',
      source: '东方财富股吧',
      publish_time: '2026-05-21 01:02',
      sentiment: '中性',
      summary: '5 月 24 日可转债上市相关讨论，偏事件通知型信息。',
    },
  ],
  ai_report: {
    title: '长江电力个股舆情研判简报',
    event_summary: '长江电力当前舆情数量较少，主要围绕盘中交易观点和可转债相关讨论，缺乏明显持续性热点。',
    sentiment_analysis: '当前情绪得分 0.4666，趋势为平稳，未出现明显的情绪加速或恐慌性下行特征。',
    rumor_assessment: '模型未识别到明显的谣言扩散现象，整体更接近低热度、低风险的稳态舆情环境。',
    risk_warning: '综合风险等级为低，风险评分 0.1242。当前更需关注信息不足而非高风险舆情冲击。',
    suggestion: '适合作为低风险对照标的，用来和高热度、高波动的涪陵电力形成展示对比。',
  },
};

export const realCommandCenterDashboard: CommandCenterDashboardData = {
  header: {
    title: '上市公司网络舆情风控态势感知平台',
    subtitle: '券商舆情风控指挥中枢',
    as_of: '2026-05-22 09:11:28',
    market_status: '已收盘',
    monitored_stocks: 1000,
    total_records: 29068,
    active_alerts: 1,
    rumor_events: 0,
  },
  featured_stock: {
    ticker: fulingInsight.profile.ticker,
    stock_name: fulingInsight.profile.stock_name,
    sector: fulingInsight.profile.sector,
    risk_level: fulingInsight.profile.risk_level,
    sentiment_label: fulingInsight.kpis.sentiment_label,
    latest_price: fulingInsight.kpis.latest_price,
    price_change_pct: fulingInsight.kpis.price_change_pct,
  },
  heat_top10: [
    { rank: 1, ticker: '600452.SH', stock_name: '涪陵电力', heat_score: 100, sentiment_score: 0.4444, risk_level: '中', change_pct: -2.3511 },
    { rank: 2, ticker: '600909.SH', stock_name: '华安证券', heat_score: 33, sentiment_score: 0.52, risk_level: '中', change_pct: 1.18 },
    { rank: 3, ticker: '601059.SH', stock_name: '信达证券', heat_score: 29, sentiment_score: 0.48, risk_level: '中', change_pct: 0.86 },
    { rank: 4, ticker: '600707.SH', stock_name: '彩虹股份', heat_score: 27, sentiment_score: 0.57, risk_level: '中', change_pct: 2.44 },
    { rank: 5, ticker: '600673.SH', stock_name: '东阳光', heat_score: 24, sentiment_score: 0.46, risk_level: '中', change_pct: -1.12 },
    { rank: 6, ticker: '600885.SH', stock_name: '宏发股份', heat_score: 22, sentiment_score: 0.51, risk_level: '低', change_pct: 0.35 },
    { rank: 7, ticker: '603005.SH', stock_name: '晶方科技', heat_score: 20, sentiment_score: 0.49, risk_level: '中', change_pct: 1.67 },
    { rank: 8, ticker: '600642.SH', stock_name: '申能股份', heat_score: 18, sentiment_score: 0.47, risk_level: '低', change_pct: -0.63 },
    { rank: 9, ticker: '600900.SH', stock_name: '长江电力', heat_score: 18, sentiment_score: 0.4666, risk_level: '低', change_pct: -0.8922 },
    { rank: 10, ticker: '600060.SH', stock_name: '海信视像', heat_score: 17, sentiment_score: 0.50, risk_level: '低', change_pct: 0.58 },
  ],
  linkage_series: {
    price: [...fulingInsight.linkage_series.price],
    sentiment: [...fulingInsight.linkage_series.sentiment],
    heat: [...fulingInsight.linkage_series.heat],
  },
  rumor_pie: [
    { name: '正常舆情', value: 76 },
    { name: '疑似噪声', value: 14 },
    { name: '高波动风险', value: 10 },
  ],
  source_breakdown: [
    { source: '东方财富股吧', value: 88 },
    { source: '预测报告', value: 12 },
  ],
  topic_tags: fulingInsight.topic_terms.map((item) => item.term),
  risk_events: [
    { time: '2026-05-19 11:38', ticker: '600452.SH', stock_name: '涪陵电力', title: '“光之暗面”集体爆发带动涪陵电力热度冲顶', severity: '中', source: '股吧热帖' },
    { time: '2026-05-20 15:00', ticker: '600452.SH', stock_name: '涪陵电力', title: '涨停次日回撤，短线分歧快速放大', severity: '高', source: '价格联动' },
    { time: '2026-05-21 09:11', ticker: '600452.SH', stock_name: '涪陵电力', title: '模型给出上涨预测但风险仍处中位', severity: '中', source: '预测结果' },
  ],
  ai_brief: {
    headline: '涪陵电力舆情热度显著高于长江电力，热点题材驱动下的波动与分歧是当前核心风险。',
    summary: '基于真实抓取结果与预测报告，涪陵电力在 2026 年 5 月 19 日附近出现明显的舆情热度峰值，模型给出上涨预测，但短线价格已出现高波动回撤；长江电力整体维持低热度、低风险状态。',
    sentiment_view: '涪陵电力情绪趋势为震荡下行，说明高热之后市场分歧迅速放大；长江电力情绪平稳，更适合作为对照标的。',
    risk_view: '当前主要风险不是单一谣言，而是热点题材驱动的高热度、高波动和情绪分歧并存状态。',
    action_view: '首页建议以涪陵电力作为重点监测股，长江电力作为低风险对照股展示，以突出真实数据链路和模型差异化输出。',
  },
};

export const realStockInsight = fulingInsight;
export const realComparisonInsight = changjiangInsight;

export const fallbackOverviewResponse: OverviewResponse = {
  header: {
    ticker: fulingInsight.profile.ticker,
    as_of: fulingInsight.profile.as_of,
  },
  kpis: {
    price: {
      value: fulingInsight.kpis.latest_price,
      delta: fulingInsight.kpis.price_change_pct / 100,
      label: '收盘价',
    },
    sentiment: {
      value: fulingInsight.kpis.sentiment_score,
      label: fulingInsight.kpis.sentiment_label,
    },
    news_heat: {
      value: 30,
      label: '近 5 日',
    },
    risk: {
      level: fulingInsight.profile.risk_level,
      label: '中等风险',
    },
  },
  price_context: fulingInsight.linkage_series.price,
  alerts: [
    {
      trade_date: '2026-05-19',
      timestamp: '11:38:00',
      alert_type: '热点爆发',
      severity: '高',
      description: '电力题材热度快速上升，舆情量与阅读量同步放大，触发重点监测。',
    },
    {
      trade_date: '2026-05-20',
      timestamp: '09:30:00',
      alert_type: '波动回撤',
      severity: '中',
      description: '涨停次日价格回撤，短线分歧显著扩大，情绪与价格出现背离。',
    },
  ],
};

export const fallbackLinkageResponse: LinkageResponse = {
  summary: {
    ticker: fulingInsight.profile.ticker,
    sector: fulingInsight.profile.sector,
    avg_sentiment: fulingInsight.kpis.sentiment_score,
    risk_status: fulingInsight.profile.risk_level,
  },
  series: {
    price: fulingInsight.linkage_series.price,
    sentiment: fulingInsight.linkage_series.sentiment.map((item) => ({
      date: item.date,
      value: item.value * 2 - 1,
    })),
    news_volume: fulingInsight.linkage_series.heat.map((item) => ({
      date: item.date,
      value: item.value,
    })),
  },
  alert_spikes: [
    {
      date: '2026-05-19',
      price: 13.62,
      sentiment: 0.5926,
      news_volume: 100,
      label: '热度峰值',
    },
  ],
  anchor: {
    anchor_date: '2026-05-19',
    note: '以 2026-05-19 热点爆发日为锚点，观察价格、情绪与热度三线共振。',
  },
};

export const fallbackNewsDatesResponse: NewsDatesResponse = {
  dates: ['2026-05-21', '2026-05-20', '2026-05-19'],
  range_start: projectEvidence.dataset.windowStart,
  range_end: projectEvidence.dataset.windowEnd,
  latest_anchor_in_range: '2026-05-21',
};

export const fallbackNewsDrilldownResponse: NewsDrilldownResponse = {
  header: {
    ticker: fulingInsight.profile.ticker,
    alert_date: '2026-05-21',
    summary: '热点题材驱动后，市场开始围绕高位持续性、情绪分歧和承接能力展开讨论。',
    range_start: projectEvidence.dataset.windowStart,
    range_end: projectEvidence.dataset.windowEnd,
  },
  stats: {
    negative_ratio: 0.24,
    negative_vs_30d: 0.11,
    total_signals: 30,
  },
  drivers: [
    { term: '电力', count: 18 },
    { term: '减持', count: 11 },
    { term: '算力', count: 8 },
    { term: '增持', count: 7 },
  ],
  news_items: [
    {
      id: 'fuling-news-1',
      title: '“光之暗面”集体爆发，涪陵电力热度冲至观察窗口峰值',
      source: '东方财富股吧',
      publish_time: '2026-05-19 11:38',
      topic_tags: ['市场', '电力'],
      sentiment: '正面',
      confidence: 0.91,
      summary: '高热帖子快速扩散，带动电力概念关注度显著上升，成为当前窗口的核心舆情触发点。',
    },
    {
      id: 'fuling-news-2',
      title: '涨停后次日回撤，投资者开始讨论高位分歧是否放大',
      source: '东方财富股吧',
      publish_time: '2026-05-20 09:30',
      topic_tags: ['市场', '监管'],
      sentiment: '负面',
      confidence: 0.84,
      summary: '价格由强转弱后，讨论重点转向短线承接能力和高位持续性，负面情绪有所抬升。',
    },
    {
      id: 'fuling-news-3',
      title: '“六张网”投资逻辑继续发酵，算力与电力链条被反复提及',
      source: '东方财富股吧',
      publish_time: '2026-05-19 06:34',
      topic_tags: ['宏观', '电力'],
      sentiment: '中性',
      confidence: 0.77,
      summary: '题材催化强化了市场对电力基础设施的想象空间，但也放大了短线博弈特征。',
    },
  ],
  anchor: {
    anchor_date: '2026-05-21',
    note: '锚点日期用于锁定舆情样本展示范围，并与首页风险事件时间线保持一致。',
    in_range: true,
  },
};

export const fallbackBacktestResponse: BacktestResponse = {
  summary: {
    historical_triggers: 30,
    mean_forward_return: 0.029,
    max_drawdown: -0.088,
    negative_hit_rate: 0.4,
  },
  active_alert_type: '热点题材驱动',
  trajectory: [
    { horizon: 1, avg_return: 0.008 },
    { horizon: 2, avg_return: 0.016 },
    { horizon: 3, avg_return: 0.022 },
    { horizon: 4, avg_return: 0.027 },
    { horizon: 5, avg_return: 0.029 },
  ],
  distribution: {
    min: -8.8,
    q1: -1.2,
    median: 2.1,
    q3: 5.4,
    max: 8.8,
  },
  events: [
    {
      ticker: fulingInsight.profile.ticker,
      trade_date: '2026-05-19',
      alert_type: '热点题材驱动',
      horizon: 5,
      forward_return: 2.9,
    },
  ],
};
