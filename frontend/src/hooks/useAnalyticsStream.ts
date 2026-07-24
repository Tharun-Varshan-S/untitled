import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventManager } from '../services/socket/eventManager';
import { connectionService } from '../services/socket/connection';
import { roomService } from '../services/room.service';
import { AnalyticsUpdatePayload } from '../services/socket/types';
import { QUERY_KEYS } from '../lib/query-keys';

export const useAnalyticsStream = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    // Ensure socket connection & project room join for real-time analytics updates
    connectionService.connect();
    roomService.joinProject(projectId);

    const handleAnalyticsUpdate = (payload: AnalyticsUpdatePayload) => {
      // Directly update TanStack Query cache dynamically
      if (payload.overview) {
        queryClient.setQueryData(QUERY_KEYS.analytics.overview(projectId), payload.overview);
      }
      if (payload.logLevels) {
        queryClient.setQueryData(QUERY_KEYS.analytics.logLevels(projectId), payload.logLevels);
      }
      if (payload.services) {
        queryClient.setQueryData(QUERY_KEYS.analytics.services(projectId), payload.services);
      }
      if (payload.trends) {
        queryClient.setQueryData(QUERY_KEYS.analytics.trends(projectId), payload.trends);
      }

      // Invalidate queries so components re-render with fresh metrics immediately
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    };

    const unsubscribe = eventManager.subscribe('analytics-update', handleAnalyticsUpdate);

    return () => {
      unsubscribe();
    };
  }, [projectId, queryClient]);
};
