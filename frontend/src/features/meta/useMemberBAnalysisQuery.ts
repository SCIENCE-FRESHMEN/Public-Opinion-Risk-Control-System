import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { MemberBAnalysisResponse } from '../../lib/api/types';

export function useMemberBAnalysisQuery(ticker: string) {
  return useQuery({
    queryKey: ['meta', 'member-b-analysis', ticker],
    queryFn: () => apiGet<MemberBAnalysisResponse>('/api/meta/member-b-analysis', { ticker }),
    enabled: Boolean(ticker),
  });
}
