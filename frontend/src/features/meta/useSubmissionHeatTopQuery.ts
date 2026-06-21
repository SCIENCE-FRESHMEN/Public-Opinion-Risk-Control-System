import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { SubmissionHeatTopResponse } from '../../lib/api/types';

export function useSubmissionHeatTopQuery() {
  return useQuery({
    queryKey: ['meta', 'submission-heat-top'],
    queryFn: () => apiGet<SubmissionHeatTopResponse>('/api/meta/submission-heat-top'),
  });
}
