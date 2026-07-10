import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventManager } from '../services/socket/eventManager';
import { LogEntry } from '../services/socket/types';
import { useUIStore } from '@/store';

export const useLogStream = (projectId: string | undefined) => {
  const queryClient = useQueryClient();

  const addNotification = useUIStore((state) => state.addNotification);

  useEffect(() => {
    if (!projectId) return;

    const handleNewLog = (newLog: LogEntry) => {
      // Show toast alert for high severity logs
      if (newLog.level === 'fatal' || newLog.level === 'error') {
        addNotification({
          type: 'error',
          title: `New ${newLog.level.toUpperCase()} in ${newLog.service}`,
          message: newLog.message
        });
      }

      queryClient.setQueryData(['logs', projectId], (oldData: any) => {
        if (!oldData || !oldData.logs) {
          return {
            logs: [newLog],
            nextCursor: null,
            totalStats: { totalMatches: 1 }
          };
        }

        return {
          ...oldData,
          logs: [newLog, ...oldData.logs],
          totalStats: {
            ...oldData.totalStats,
            totalMatches: (oldData.totalStats?.totalMatches || 0) + 1
          }
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
