import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { FiltersResponse } from '../../lib/api/types';

export function useFiltersQuery() {
  return useQuery({
    queryKey: ['meta', 'filters'],
    queryFn: () => apiGet<FiltersResponse>('/api/meta/filters'),
  });
}
