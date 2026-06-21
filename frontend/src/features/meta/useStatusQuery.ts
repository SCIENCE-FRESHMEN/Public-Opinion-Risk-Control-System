import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { StatusResponse } from '../../lib/api/types';

export function useStatusQuery() {
  return useQuery({
    queryKey: ['meta', 'status'],
    queryFn: () => apiGet<StatusResponse>('/api/meta/status'),
  });
}
