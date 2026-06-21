import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api/client';
import type { BacktestResponse } from '../../lib/api/types';

export function useBacktestQuery(ticker: string, startDate: string, endDate: string, alertType: string, horizon: number) {
  return useQuery({
    queryKey: ['backtest', ticker, startDate, endDate, alertType, horizon],
    queryFn: () =>
      apiGet<BacktestResponse>('/api/backtest', {
        ticker,
        start_date: startDate,
        end_date: endDate,
        alert_type: alertType,
        horizon,
      }),
  });
}
