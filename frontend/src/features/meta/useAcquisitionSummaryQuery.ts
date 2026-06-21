import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { AcquisitionSummaryResponse } from '../../lib/api/types';

export function useAcquisitionSummaryQuery() {
  return useQuery({
    queryKey: ['meta', 'acquisition-summary'],
    queryFn: () => apiGet<AcquisitionSummaryResponse>('/api/meta/acquisition-summary'),
  });
}
