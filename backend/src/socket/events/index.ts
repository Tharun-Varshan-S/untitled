import { Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';
import { logger } from '../../utils/logger';
import { roomManager } from '../rooms';
import { withErrorHandler } from '../services/errorHandler';
import { socketMetrics } from '../services/metrics';
import { SocketEvents } from '@shared/socket/events';

export function registerSocketEvents(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) {
  socket.on(SocketEvents.JOIN_PROJECT, withErrorHandler(socket, SocketEvents.JOIN_PROJECT, async ({ projectId }, callback) => {
    socketMetrics.incrementMessagesReceived();
    const success = await roomManager.joinProject(socket, projectId);
    if (callback) {
      if (success) {
        socketMetrics.trackProjectJoin(projectId);
        callback({ success: true });
      } else {
        callback({ success: false, message: 'Unauthorized or project not found' });
      }
    }
  }));

  socket.on(SocketEvents.LEAVE_PROJECT, withErrorHandler(socket, SocketEvents.LEAVE_PROJECT, async ({ projectId }, callback) => {
    socketMetrics.incrementMessagesReceived();
    await roomManager.leaveProject(socket, projectId);
    socketMetrics.trackProjectLeave(projectId);
    if (callback) {
      callback({ success: true });
    }
  }));

  logger.info(`Registered events for socket: ${socket.id}`);
}
