import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { SubmissionStockPostsResponse } from '../../lib/api/types';

export function useSubmissionStockPostsQuery(ticker: string) {
  return useQuery({
    queryKey: ['meta', 'submission-stock-posts', ticker],
    queryFn: () =>
      apiGet<SubmissionStockPostsResponse>('/api/meta/submission-stock-posts', {
        ticker,
      }),
    enabled: Boolean(ticker),
  });
}
