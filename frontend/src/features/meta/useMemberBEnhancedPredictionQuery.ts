import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { MemberBEnhancedPredictionResponse } from '../../lib/api/types';

export function useMemberBEnhancedPredictionQuery(ticker: string) {
  return useQuery({
    queryKey: ['meta', 'member-b-enhanced-prediction', ticker],
    queryFn: () => apiGet<MemberBEnhancedPredictionResponse>('/api/meta/member-b-enhanced-prediction', { ticker }),
    enabled: Boolean(ticker),
  });
}
