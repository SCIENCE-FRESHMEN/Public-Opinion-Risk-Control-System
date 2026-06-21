import { render, screen } from '@testing-library/react';

const stockInsightPageDataMock = {
  insight: {
    profile: {
      ticker: '600452.SH',
      stock_name: '涪陵电力',
      full_name: '重庆涪陵电力实业股份有限公司',
      sector: '电力',
      industry: '电力运营与能源服务',
      market: '沪市',
      risk_level: '中' as const,
      as_of: '2026-05-22 09:11:28',
    },
    kpis: {
      latest_price: 12.46,
      price_change_pct: -2.35,
      sentiment_score: 0.44,
      sentiment_label: '震荡下行',
      heat_score: 100,
      rumor_ratio: 0.24,
    },
    linkage_series: {
      price: [{ date: '2026-05-21', value: 12.46 }],
      sentiment: [{ date: '2026-05-21', value: 0.44 }],
      heat: [{ date: '2026-05-21', value: 52 }],
    },
    risk_timeline: [
      {
        time: '2026-05-19 11:38',
        event_type: '热点爆发',
        title: '“光之暗面”集体爆发，电力概念热度急升',
        description: '高热帖子集中爆发，阅读量和评论量显著抬升。',
        severity: '中' as const,
      },
    ],
    rumor_breakdown: [],
    source_breakdown: [],
    topic_terms: [{ term: '电力', weight: 100 }],
    representative_posts: [
      {
        id: 'post-1',
        source: '东方财富股吧',
        publish_time: '2026-05-19 11:38',
        sentiment: '正面' as const,
        summary: '代表性摘要',
      },
    ],
    ai_report: {
      title: '涪陵电力个股舆情研判简报',
      event_summary: '事件总结',
      sentiment_analysis: '情绪分析',
      rumor_assessment: '谣言评估',
      risk_warning: '风险提示',
      suggestion: '跟踪建议',
    },
  },
  memberBAnalysis: {
    matched: true,
    ticker: '600900.SH',
    stock_code: '600900',
    stock_name: '长江电力',
    generated_at: '2026-06-02 21:56:50',
    mean_sentiment: 0.5472,
    total_opinions: 124,
    positive_ratio: 0.1855,
    negative_ratio: 0.0161,
    neutral_ratio: 0.7984,
    risk_score: 5,
    risk_level: '低' as const,
    risk_label: '低风险',
    rumor_count: 0,
    triggered_rules: ['volume_surge'],
    risk_factors: ['舆情量异常激增'],
    top_topics: [
      { keyword: '电力', score: 0.7802, frequency: 103 },
      { keyword: '长江', score: 0.6996, frequency: 93 },
    ],
    risk_timeline: [
      {
        date: '2026-06-02',
        risk_score: 5,
        sentiment_weighted: 0.5705,
        negative_ratio: 0.026,
        opinion_count: 77,
      },
    ],
    covered_stocks: [
      {
        ticker: '600900.SH',
        stock_name: '长江电力',
        risk_label: '低风险',
        mean_sentiment: 0.5472,
        total_opinions: 124,
      },
    ],
  },
  llmBriefMeta: {
    generationMode: 'hybrid',
    dataSources: ['新闻驱动词', '情绪评分', '风险标签'],
    referenceTime: '2026-05-22 09:11:28',
    ticker: '600452.SH',
    stockName: '涪陵电力',
  },
  availableInstruments: [
    {
      symbol: '600452.SH',
      code: '600452',
      name: '涪陵电力',
    },
  ],
  dataSources: {
    profile: 'mixed',
    kpis: 'mixed',
    linkageSeries: 'real',
    representativePosts: 'real',
    topicTerms: 'real',
    riskTimeline: 'real',
    rumorRatio: 'real',
    aiReport: 'real',
  },
  projectEvidence: {
    dataset: {
      total_records: 121768,
      unique_stocks: 1000,
      total_news_count: 22727,
      total_comment_count: 98893,
      window_start: '2026-05-03',
      window_end: '2026-06-02',
    },
    model: {
      trigger_count: 225,
      mean_forward_return: 0.0042,
      max_drawdown: -0.0068,
      negative_return_ratio: 0.59,
      volatility: 0.026,
    },
    featured_prediction: {
      direction: '上涨',
      confidence: 0.6316,
      risk_score: 0.5164,
      expected_range: '+0.0% ~ +7.0%',
    },
  },
  isUsingFallback: true,
};

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

vi.mock('../features/command-center/use-stock-insight-page-data', () => ({
  useStockInsightPageData: () => stockInsightPageDataMock,
}));

import { StockInsightPage } from './stock-insight-page';

describe('StockInsightPage', () => {
  afterEach(() => {
    stockInsightPageDataMock.insight.linkage_series = {
      price: [{ date: '2026-05-21', value: 12.46 }],
      sentiment: [{ date: '2026-05-21', value: 0.44 }],
      heat: [{ date: '2026-05-21', value: 52 }],
    };
    stockInsightPageDataMock.insight.risk_timeline = [
      {
        time: '2026-05-19 11:38',
        event_type: '热点爆发',
        title: '“光之暗面”集体爆发，电力概念热度急升',
        description: '高热帖子集中爆发，阅读量和评论量显著抬升。',
        severity: '中',
      },
    ];
    stockInsightPageDataMock.insight.representative_posts = [
      {
        id: 'post-1',
        source: '东方财富股吧',
        publish_time: '2026-05-19 11:38',
        sentiment: '正面',
        summary: '代表性摘要',
      },
    ];
    stockInsightPageDataMock.insight.topic_terms = [{ term: '电力', weight: 100 }];
    stockInsightPageDataMock.dataSources.linkageSeries = 'real';
    stockInsightPageDataMock.dataSources.representativePosts = 'real';
    stockInsightPageDataMock.dataSources.topicTerms = 'real';
    stockInsightPageDataMock.dataSources.riskTimeline = 'real';
  });

  it('renders stock profile, linkage analysis, risk timeline, representative posts, and detail-level AI briefing', () => {
    render(<StockInsightPage />);

    expect(screen.getByText('涪陵电力')).toBeInTheDocument();
    expect(screen.getByText('600452.SH')).toBeInTheDocument();
    expect(screen.getByText('数据接入与算法结果汇总')).toBeInTheDocument();
    expect(screen.getByText('算法分析结果')).toBeInTheDocument();
    expect(screen.getByText('长江电力 情绪 / 主题 / 风险研判')).toBeInTheDocument();
    expect(screen.getByText('风险趋势追踪')).toBeInTheDocument();
    expect(screen.getByText('风险评分 / 负面占比 / 舆情量')).toBeInTheDocument();
    expect(screen.getByText('主题关键词前八')).toBeInTheDocument();
    expect(screen.getByText('主题强度排序')).toBeInTheDocument();
    expect(screen.getByText('情绪结构剖面')).toBeInTheDocument();
    expect(screen.getByText('算法主题证据图谱')).toBeInTheDocument();
    expect(screen.getByAltText('主题热力图')).toBeInTheDocument();
    expect(screen.getByText('正向情绪')).toBeInTheDocument();
    expect(screen.getByText('中性情绪')).toBeInTheDocument();
    expect(screen.getByText('负向情绪')).toBeInTheDocument();
    expect(screen.getByText('项目证据链')).toBeInTheDocument();
    expect(screen.getByText('涪陵电力情绪因子联动')).toBeInTheDocument();
    expect(screen.getByText('单股联动诊断')).toBeInTheDocument();
    expect(screen.getByText('个股观察结论')).toBeInTheDocument();
    expect(screen.getByText('价格情绪共振')).toBeInTheDocument();
    expect(screen.getByText('风险时间线')).toBeInTheDocument();
    expect(screen.getByText('代表性舆情摘要')).toBeInTheDocument();
    expect(screen.getByText('AI 个股研判简报')).toBeInTheDocument();
    expect(screen.getByText('生成模式')).toBeInTheDocument();
    expect(screen.getByText('混合研判模式')).toBeInTheDocument();
    expect(screen.getByText('研判基准时间')).toBeInTheDocument();
    expect(screen.getByText('研判摘要')).toBeInTheDocument();
    expect(screen.getAllByText('谣言评估').length).toBeGreaterThan(0);
    expect(screen.getAllByText('风险提示').length).toBeGreaterThan(0);
    expect(screen.getAllByText('跟踪建议').length).toBeGreaterThan(0);
    expect(screen.getByText('121,768')).toBeInTheDocument();
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('1,000') ?? false).length).toBeGreaterThan(0);
    expect(screen.getByText('225')).toBeInTheDocument();
    expect(screen.getByText('上涨')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-chart')).toHaveLength(4);
  });

  it('shows clear empty-state guidance when current window lacks detail samples', () => {
    stockInsightPageDataMock.insight.linkage_series = {
      price: [],
      sentiment: [],
      heat: [],
    };
    stockInsightPageDataMock.insight.risk_timeline = [];
    stockInsightPageDataMock.insight.representative_posts = [];
    stockInsightPageDataMock.insight.topic_terms = [];
    stockInsightPageDataMock.dataSources.linkageSeries = 'fallback';
    stockInsightPageDataMock.dataSources.representativePosts = 'fallback';
    stockInsightPageDataMock.dataSources.topicTerms = 'fallback';
    stockInsightPageDataMock.dataSources.riskTimeline = 'fallback';
    stockInsightPageDataMock.memberBAnalysis.risk_timeline = [];

    render(<StockInsightPage />);

    expect(screen.getByText(/当前窗口样本不足，单股联动图暂无法形成有效走势/)).toBeInTheDocument();
    expect(screen.getByText(/当前窗口暂无可展示的风险事件/)).toBeInTheDocument();
    expect(screen.getByText(/当前窗口暂无代表性舆情样本/)).toBeInTheDocument();
    expect(screen.getByText(/当前股票暂无可展示的风险时间序列/)).toBeInTheDocument();
  });
});
