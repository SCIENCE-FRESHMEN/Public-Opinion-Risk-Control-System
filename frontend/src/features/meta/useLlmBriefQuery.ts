import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { LlmBriefResponse } from '../../lib/api/types';

export function useLlmBriefQuery(ticker: string) {
  return useQuery({
    queryKey: ['meta', 'llm-brief', ticker],
    queryFn: () => apiGet<LlmBriefResponse>('/api/meta/llm-brief', { ticker }),
    enabled: Boolean(ticker),
  });
}
