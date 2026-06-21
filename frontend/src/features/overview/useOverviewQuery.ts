import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { OverviewResponse } from '../../lib/api/types';
import { useFiltersStore } from '../../store/filters';

export function useOverviewQuery() {
  const { ticker, startDate, endDate } = useFiltersStore();
  return useQuery({
    queryKey: ['overview', ticker, startDate, endDate],
    queryFn: () => apiGet<OverviewResponse>('/api/overview', { ticker, start_date: startDate, end_date: endDate }),
  });
}
