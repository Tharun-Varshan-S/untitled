import { Socket } from 'socket.io';
import { verifyJwt } from '../../utils/jwt';
import { findSafeUserById } from '../../modules/auth/auth.repository';
import { logger } from '../../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';
import { socketMetrics } from '../services/metrics';

export const socketAuthMiddleware = async (
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socketMetrics.incrementAuthFailures();
      return next(new Error('Authentication error: Token missing'));
    }

    const payload = verifyJwt(token);
    
    if (!payload || !payload.userId) {
       socketMetrics.incrementAuthFailures();
       return next(new Error('Authentication error: Invalid token'));
    }

    const user = await findSafeUserById(payload.userId);

    if (!user) {
      socketMetrics.incrementAuthFailures();
      return next(new Error('Authentication error: User not found or disabled'));
    }

    // Attach user to socket
    socket.data.user = user;
    socket.data.connectedAt = Date.now();

    next();
  } catch (error) {
    socketMetrics.incrementAuthFailures();
    logger.warn(`Socket authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    next(new Error('Authentication error: Invalid or expired token'));
  }
};
