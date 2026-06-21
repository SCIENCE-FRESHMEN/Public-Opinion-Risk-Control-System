import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api/client';
import type { NewsDrilldownResponse } from '../../lib/api/types';
import { useFiltersStore } from '../../store/filters';

export function useNewsDrilldownQuery(ticker: string, alertDate: string) {
  const { startDate, endDate } = useFiltersStore();
  return useQuery({
    queryKey: ['news', 'drilldown', ticker, alertDate, startDate, endDate],
    queryFn: () =>
      apiGet<NewsDrilldownResponse>('/api/news/drilldown', {
        ticker,
        alert_date: alertDate,
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: Boolean(ticker && alertDate),
  });
}
