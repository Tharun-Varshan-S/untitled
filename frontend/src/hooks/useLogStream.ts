import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventManager } from '../services/socket/eventManager';
import { roomService } from '../services/room.service';
import { LogEntry } from '../services/socket/types';
import { useUIStore } from '@/store';

export const useLogStream = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  useEffect(() => {
    if (!projectId) return;

    // Ensure socket room is joined for real-time streaming
    roomService.joinProject(projectId);

    const handleNewLog = (newLog: LogEntry) => {
      // Show toast alert for high severity logs
      if (newLog.level === 'fatal' || newLog.level === 'error') {
        addNotification({
          type: 'error',
          title: `New ${newLog.level.toUpperCase()} in ${newLog.service}`,
          message: newLog.message
        });
      }

      // Prepend new log dynamically into cache
      queryClient.setQueryData(['logs', projectId], (oldData: any) => {
        if (!oldData) {
          return {
            results: [newLog],
            logs: [newLog],
            nextCursor: null,
            hasMore: false
          };
        }

        const currentList = oldData.results || oldData.logs || [];
        const existingIds = new Set(currentList.filter(Boolean).map((l: any) => l?._id || l?.id));
        const logId = newLog?.id || (newLog as any)?._id;

        if (logId && existingIds.has(logId)) {
          return oldData;
        }

        const updatedList = [newLog, ...currentList];

        return {
          ...oldData,
          results: updatedList,
          logs: updatedList,
        };
      });

      // Also invalidate log and analytics queries for full real-time sync
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    };

    // Subscribe via the centralized event manager
    const unsubscribe = eventManager.subscribe('new-log', handleNewLog);

    return () => {
      unsubscribe();
    };
  }, [projectId, queryClient, addNotification]);
};
