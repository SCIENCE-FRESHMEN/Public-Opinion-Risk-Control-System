import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { useFiltersStore } from '../../store/filters';
import { RiskEventList } from './risk-event-list';

function PathProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}{location.search}</div>;
}

describe('RiskEventList', () => {
  beforeEach(() => {
    useFiltersStore.setState({
      ticker: '600519.SH',
      startDate: '2020-01-01',
      endDate: '2026-04-22',
    });
  });

  it('updates the global ticker and navigates to stock detail when an event is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <PathProbe />
                <RiskEventList
                  events={[
                    {
                      time: '2026-06-02 14:29',
                      ticker: '000089.SZ',
                      stock_name: '深圳机场',
                      title: '深圳官方通报：因未消除事故隐患，这家企业年内连吃三张罚单',
                      severity: '高',
                      source: '新浪财经',
                    },
                  ]}
                />
              </>
            }
          />
          <Route path="/news" element={<PathProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /查看深圳机场风险事件详情/i }));

    expect(useFiltersStore.getState().ticker).toBe('000089.SZ');
    expect(screen.getByTestId('pathname')).toHaveTextContent('/news?alertDate=2026-06-02');
  });
});
