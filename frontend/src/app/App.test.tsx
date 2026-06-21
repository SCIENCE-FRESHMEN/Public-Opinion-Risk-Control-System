import { render, screen } from '@testing-library/react';

vi.mock('../features/meta/useFiltersQuery', () => ({
  useFiltersQuery: () => ({
    data: {
      tickers: ['600519.SH', '300750.SZ', '601318.SH'],
      date_range: {
        start: '2020-01-01',
        end: '2026-04-22',
      },
      defaults: {
        ticker: '600519.SH',
        start_date: '2020-01-01',
        end_date: '2026-04-22',
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../features/meta/useStatusQuery', () => ({
  useStatusQuery: () => ({
    data: {
      artifacts: [],
    },
    isLoading: false,
    isError: false,
  }),
}));

import { App } from './App';

describe('App', () => {
  it('provides the query client to routed pages', async () => {
    render(<App />);

    expect(await screen.findByText('上市公司网络舆情风控态势感知平台')).toBeInTheDocument();
  });
});
