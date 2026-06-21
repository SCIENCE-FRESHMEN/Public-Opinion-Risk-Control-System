import { render, screen } from '@testing-library/react';

const useOverviewQueryMock = vi.fn();
const useLinkageQueryMock = vi.fn();
const useFiltersQueryMock = vi.fn();
const useSubmissionHeatTopQueryMock = vi.fn();
const useSubmissionRiskEventsQueryMock = vi.fn();
const useLlmBriefQueryMock = vi.fn();
const useProjectEvidenceQueryMock = vi.fn();
const useAcquisitionSummaryQueryMock = vi.fn();

vi.mock('../overview/useOverviewQuery', () => ({
  useOverviewQuery: () => useOverviewQueryMock(),
}));

vi.mock('../linkage/useLinkageQuery', () => ({
  useLinkageQuery: () => useLinkageQueryMock(),
}));

vi.mock('../meta/useFiltersQuery', () => ({
  useFiltersQuery: () => useFiltersQueryMock(),
}));

vi.mock('../meta/useSubmissionHeatTopQuery', () => ({
  useSubmissionHeatTopQuery: () => useSubmissionHeatTopQueryMock(),
}));

vi.mock('../meta/useSubmissionRiskEventsQuery', () => ({
  useSubmissionRiskEventsQuery: () => useSubmissionRiskEventsQueryMock(),
}));

vi.mock('../meta/useLlmBriefQuery', () => ({
  useLlmBriefQuery: () => useLlmBriefQueryMock(),
}));

vi.mock('../meta/useProjectEvidenceQuery', () => ({
  useProjectEvidenceQuery: () => useProjectEvidenceQueryMock(),
}));

vi.mock('../meta/useAcquisitionSummaryQuery', () => ({
  useAcquisitionSummaryQuery: () => useAcquisitionSummaryQueryMock(),
}));

import { useCommandCenterPageData } from './use-command-center-page-data';

function HookProbe() {
  const { dashboard } = useCommandCenterPageData();
  return (
    <div>
      <span data-testid="ticker">{dashboard.featured_stock.ticker}</span>
      <span data-testid="name">{dashboard.featured_stock.stock_name}</span>
      <span data-testid="risk">{dashboard.featured_stock.risk_level}</span>
    </div>
  );
}

describe('useCommandCenterPageData', () => {
  beforeEach(() => {
    useOverviewQueryMock.mockReturnValue({
      data: {
        header: { ticker: '600519.SH', as_of: '2026-06-04 12:00:00' },
        kpis: {
          price: { value: 1756.7, delta: 0.0066 },
          sentiment: { value: -0.04, label: '中性偏空' },
          news_heat: { value: 1, label: '24H' },
          risk: { level: '低', label: '低风险' },
        },
        alerts: [],
      },
    });
    useLinkageQueryMock.mockReturnValue({
      data: {
        summary: { ticker: '600519.SH', sector: '消费', avg_sentiment: -0.04, risk_status: '低' },
        series: { price: [], sentiment: [], news_volume: [] },
        alert_spikes: [],
        anchor: { anchor_date: '2026-04-22', note: 'note' },
      },
    });
    useFiltersQueryMock.mockReturnValue({
      data: {
        tickers: ['600519.SH', '000089.SZ'],
        instrument_groups: [
          {
            group_name: '消费',
            instruments: [
              {
                symbol: '600519.SH',
                code: '600519',
                name: '贵州茅台',
                full_name: '贵州茅台酒股份有限公司',
                market: 'SSE',
                board: 'main_board',
                sector_group: '消费',
                industry: '白酒',
                aliases: ['茅台'],
                is_featured: true,
                sort_order: 101,
                is_active: true,
              },
            ],
          },
        ],
        defaults: { ticker: '600519.SH', start_date: '2020-01-01', end_date: '2026-04-22' },
        date_range: { start: '2020-01-01', end: '2026-04-22' },
      },
    });
    useSubmissionHeatTopQueryMock.mockReturnValue({
      data: {
        rows: [
          {
            rank: 1,
            ticker: '000089.SZ',
            stock_name: '深圳机场',
            heat_score: 100,
            sentiment_score: 0.41,
            risk_level: '高',
            change_pct: -0.29,
          },
        ],
      },
    });
    useSubmissionRiskEventsQueryMock.mockReturnValue({ data: { events: [] } });
    useLlmBriefQueryMock.mockReturnValue({ data: null });
    useAcquisitionSummaryQueryMock.mockReturnValue({ data: null });
    useProjectEvidenceQueryMock.mockReturnValue({
      data: {
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
    });
  });

  it('keeps featured stock identity aligned with the resolved primary ticker instead of the top-heat row', () => {
    render(<HookProbe />);

    expect(screen.getByTestId('ticker')).toHaveTextContent('600519.SH');
    expect(screen.getByTestId('name')).toHaveTextContent('贵州茅台');
    expect(screen.getByTestId('risk')).toHaveTextContent('低');
  });
});
