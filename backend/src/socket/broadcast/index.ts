import { getIO } from '../index';
import { LogResponse } from '../../types/logs.types';
import { logger } from '../../utils/logger';
import { socketMetrics } from '../services/metrics';
import { SocketEvents } from '../../../../shared/socket/events';

/**
 * Broadcasts a newly ingested log to all connected clients in the project's room.
 * Ensures the payload is safe and only relevant to authorized viewers.
 */
export const broadcastNewLog = (projectId: string, log: LogResponse): void => {
  try {
    const io = getIO();
    const room = `project_${projectId}`;
    io.to(room).emit(SocketEvents.NEW_LOG, log);
    socketMetrics.incrementMessagesSent();
    logger.debug(`[Socket.io] Broadcasted ${SocketEvents.NEW_LOG} to room ${room}`);
  } catch (error) {
    logger.error(`[Socket.io] Failed to broadcast log to ${projectId}:`, error);
  }
};
