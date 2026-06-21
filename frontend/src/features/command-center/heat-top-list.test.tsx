import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { useFiltersStore } from '../../store/filters';
import { HeatTopList } from './heat-top-list';

function PathProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

describe('HeatTopList', () => {
  beforeEach(() => {
    useFiltersStore.setState({
      ticker: '600519.SH',
      startDate: '2020-01-01',
      endDate: '2026-04-22',
    });
  });

  it('updates the global ticker and navigates to the stock detail page when a heat row is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <PathProbe />
                <HeatTopList
                  rows={[
                    {
                      rank: 1,
                      ticker: '000089.SZ',
                      stock_name: '深圳机场',
                      heat_score: 100,
                      sentiment_score: 0.41,
                      risk_level: '高',
                      change_pct: -0.29,
                    },
                  ]}
                />
              </>
            }
          />
          <Route path="/stock" element={<PathProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /深圳机场/i }));

    expect(useFiltersStore.getState().ticker).toBe('000089.SZ');
    expect(screen.getByTestId('pathname')).toHaveTextContent('/stock');
  });
});
