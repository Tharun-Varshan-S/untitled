import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventManager } from '../services/socket/eventManager';
import { LogEntry } from '../services/socket/types';

export const useLogStream = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const handleNewLog = (newLog: LogEntry) => {
      queryClient.setQueryData(['logs', projectId], (oldData: any) => {
        if (!oldData) {
          return {
            data: [newLog],
            totalCount: 1,
            totalPages: 1,
            currentPage: 1,
            pageSize: 20
          };
        }

        return {
          ...oldData,
          data: [newLog, ...oldData.data],
          totalCount: oldData.totalCount + 1,
        };
      });
    };

    // Subscribes via the centralized event manager instead of raw socket.on
    const unsubscribe = eventManager.subscribe('new-log', handleNewLog);

    return () => {
      unsubscribe();
    };
  }, [projectId, queryClient]);
};
