import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api/client';
import type { NewsDatesResponse } from '../../lib/api/types';
import { useFiltersStore } from '../../store/filters';

export function useNewsDatesQuery() {
  const { ticker, startDate, endDate } = useFiltersStore();
  return useQuery({
    queryKey: ['news', 'dates', ticker, startDate, endDate],
    queryFn: () => apiGet<NewsDatesResponse>('/api/news/dates', { ticker, start_date: startDate, end_date: endDate }),
  });
}
