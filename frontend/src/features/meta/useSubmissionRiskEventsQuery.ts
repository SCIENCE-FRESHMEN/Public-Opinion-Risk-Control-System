import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { SubmissionRiskEventsResponse } from '../../lib/api/types';

export function useSubmissionRiskEventsQuery() {
  return useQuery({
    queryKey: ['meta', 'submission-risk-events'],
    queryFn: () => apiGet<SubmissionRiskEventsResponse>('/api/meta/submission-risk-events'),
  });
}
