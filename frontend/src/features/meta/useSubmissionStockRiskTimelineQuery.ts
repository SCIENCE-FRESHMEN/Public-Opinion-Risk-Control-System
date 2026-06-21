import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { SubmissionStockRiskTimelineResponse } from '../../lib/api/types';

export function useSubmissionStockRiskTimelineQuery(ticker: string) {
  return useQuery({
    queryKey: ['meta', 'submission-stock-risk-timeline', ticker],
    queryFn: () =>
      apiGet<SubmissionStockRiskTimelineResponse>('/api/meta/submission-stock-risk-timeline', {
        ticker,
      }),
    enabled: Boolean(ticker),
  });
}
