import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api/client';
import type { ProjectEvidenceResponse } from '../../lib/api/types';

export function useProjectEvidenceQuery() {
  return useQuery({
    queryKey: ['meta', 'project-evidence'],
    queryFn: () => apiGet<ProjectEvidenceResponse>('/api/meta/project-evidence'),
  });
}
