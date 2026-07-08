import { getIO } from '../index';
import { getOverview, getLogLevels, getServices, getTrends } from '../../services/analytics.service';
import { logger } from '../../utils/logger';
import { socketMetrics } from '../services/metrics';
import { SocketEvents } from '../../../../shared/socket/events';

// Debounce map: projectId -> timeout
const debounceMap = new Map<string, NodeJS.Timeout>();

export const broadcastAnalyticsUpdate = (projectId: string): void => {
  if (debounceMap.has(projectId)) {
    clearTimeout(debounceMap.get(projectId)!);
  }

  const timeout = setTimeout(async () => {
    debounceMap.delete(projectId);
    try {
      // Re-run analytics efficiently
      const [overview, logLevels, services, trends] = await Promise.all([
        getOverview(projectId),
        getLogLevels(projectId),
        getServices(projectId),
        getTrends(projectId)
      ]);

      const io = getIO();
      const room = `project_${projectId}`;

      io.to(room).emit(SocketEvents.ANALYTICS_UPDATE, {
        overview,
        logLevels,
        services,
        trends,
      });

      socketMetrics.incrementMessagesSent();
      logger.debug(`[Socket.io] Broadcasted ${SocketEvents.ANALYTICS_UPDATE} to room ${room}`);
    } catch (error) {
      logger.error(`[Socket.io] Failed to broadcast analytics for ${projectId}:`, error);
      // Analytics failure must not rollback MongoDB ingestion pipeline
    }
  }, 1000); // 1000ms debounce to prevent broadcast storms

  debounceMap.set(projectId, timeout);
};
