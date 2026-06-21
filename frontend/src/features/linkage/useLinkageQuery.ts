import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api/client';
import type { LinkageResponse } from '../../lib/api/types';
import { useFiltersStore } from '../../store/filters';

export function useLinkageQuery() {
  const { ticker, startDate, endDate } = useFiltersStore();
  return useQuery({
    queryKey: ['linkage', ticker, startDate, endDate],
    queryFn: () => apiGet<LinkageResponse>('/api/linkage', { ticker, start_date: startDate, end_date: endDate }),
  });
}
