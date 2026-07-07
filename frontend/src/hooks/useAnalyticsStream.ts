import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventManager } from '../services/socket/eventManager';
import { AnalyticsUpdatePayload } from '../services/socket/types';
import { QUERY_KEYS } from '../lib/query-keys';

export const useAnalyticsStream = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const handleAnalyticsUpdate = (payload: AnalyticsUpdatePayload) => {
      // Incrementally update TanStack Query cache without invalidating the whole query
      // This directly updates the UI charts and KPIs dynamically
      
      queryClient.setQueryData(QUERY_KEYS.analytics.overview(projectId), payload.overview);
      queryClient.setQueryData(QUERY_KEYS.analytics.logLevels(projectId), payload.logLevels);
      queryClient.setQueryData(QUERY_KEYS.analytics.services(projectId), payload.services);
      queryClient.setQueryData(QUERY_KEYS.analytics.trends(projectId), payload.trends);
    };

    const unsubscribe = eventManager.subscribe('analytics-update', handleAnalyticsUpdate);

    return () => {
      unsubscribe();
    };
  }, [projectId, queryClient]);
};
