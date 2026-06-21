import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { SubmissionStockCoverageResponse } from '../../lib/api/types';

export function useSubmissionStockCoverageQuery(ticker: string) {
  return useQuery({
    queryKey: ['meta', 'submission-stock-coverage', ticker],
    queryFn: () => apiGet<SubmissionStockCoverageResponse>('/api/meta/submission-stock-coverage', { ticker }),
    enabled: Boolean(ticker),
  });
}
