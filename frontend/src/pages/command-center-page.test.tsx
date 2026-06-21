import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

vi.mock('../features/command-center/use-command-center-page-data', () => ({
  useCommandCenterPageData: () => {
    return {
      dashboard: {
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
          ticker: '600452.SH',
          stock_name: '涪陵电力',
          sector: '电力',
          risk_level: '中',
          sentiment_label: '震荡下行',
          latest_price: 12.46,
          price_change_pct: -2.35,
        },
        heat_top10: [
          { rank: 1, ticker: '600452.SH', stock_name: '涪陵电力', heat_score: 100, sentiment_score: 0.44, risk_level: '中', change_pct: -2.35 },
        ],
        linkage_series: {
          price: [{ date: '2026-05-21', value: 12.46 }],
          sentiment: [{ date: '2026-05-21', value: 0.44 }],
          heat: [{ date: '2026-05-21', value: 52 }],
        },
        rumor_pie: [],
        source_breakdown: [],
        topic_tags: ['电力', '算力'],
        risk_events: [{ time: '2026-05-20 15:00', ticker: '600452.SH', stock_name: '涪陵电力', title: '涨停次日回撤，短线分歧快速放大', severity: '高', source: '价格联动' }],
        ai_brief: {
          headline: '涪陵电力舆情热度显著高于长江电力',
          summary: '摘要',
          sentiment_view: '情绪观察',
          risk_view: '风险提示',
          action_view: '席位建议',
        },
      },
      insight: {
        profile: {
          ticker: '600452.SH',
          stock_name: '涪陵电力',
          full_name: '重庆涪陵电力实业股份有限公司',
          sector: '电力',
          industry: '电力运营与能源服务',
          market: '沪市',
          risk_level: '中',
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
        risk_timeline: [],
        rumor_breakdown: [],
        source_breakdown: [],
        topic_terms: [],
        representative_posts: [],
        ai_report: {
          title: '涪陵电力个股舆情研判简报',
          event_summary: '事件总结',
          sentiment_analysis: '情绪分析',
          rumor_assessment: '谣言评估',
          risk_warning: '风险提示',
          suggestion: '跟踪建议',
        },
      },
      llmBriefMeta: {
        generationMode: 'llm_live',
        dataSources: ['舆情样本', '情绪评分', '风险标签'],
        referenceTime: '2026-05-22 09:11:28',
        ticker: '600452.SH',
        stockName: '涪陵电力',
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
  },
}));

import { CommandCenterPage } from './command-center-page';

describe('CommandCenterPage', () => {
  it('renders a focused home page: hero intro, linkage chart, and concise conclusion', () => {
    render(
      <MemoryRouter>
        <CommandCenterPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('上市公司网络舆情风控态势感知平台')).toBeInTheDocument();
    expect(screen.getByText('情绪因子总览 · 量价之外的增量信号')).toBeInTheDocument();
    expect(screen.getByText('把多源舆情情绪作为量价之外的一类增量因子，补充量化研究的盲区。')).toBeInTheDocument();
    expect(screen.getByText('29,068')).toBeInTheDocument();

    expect(screen.getByText('涪陵电力焦点区')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-chart')).toHaveLength(3);

    expect(screen.getByText('AI 研判概要结论')).toBeInTheDocument();
    expect(screen.getByText('涪陵电力舆情热度显著高于长江电力')).toBeInTheDocument();
    expect(screen.getByText('摘要研判')).toBeInTheDocument();
    expect(screen.getAllByText('情绪观察').length).toBeGreaterThan(0);
    expect(screen.getAllByText('风险提示').length).toBeGreaterThan(0);
    expect(screen.getAllByText('席位建议').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: '进入单股详情' })).toHaveAttribute('href', '/stock');
    expect(screen.getAllByText('涪陵电力').length).toBeGreaterThan(0);
  });
});
