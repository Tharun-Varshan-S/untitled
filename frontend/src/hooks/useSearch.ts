import { useInfiniteQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search.api';
import { SearchParams } from '../types/search.types';
import { QUERY_KEYS } from '../lib/query-keys';

export function useSearchLogs(params: SearchParams) {
  const { projectId, q, level, service, environment, source, startDate, endDate, limit } = params;
  
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.search?.logs?.(projectId, { q, level, service, environment, source, startDate, endDate }) || ['search', projectId, { q, level, service, environment, source, startDate, endDate }],
    queryFn: async ({ pageParam = undefined }) => {
      return searchApi.searchLogs({
        ...params,
        cursor: pageParam,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!projectId,
  });
}
