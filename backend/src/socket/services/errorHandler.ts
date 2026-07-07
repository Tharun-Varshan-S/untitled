import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { socketRateLimiter } from './rateLimiter';

/**
 * Wraps socket event handlers with centralized error handling and rate limiting.
 * Prevents unhandled promise rejections from crashing the server.
 */
export function withErrorHandler<T extends any[]>(
  socket: Socket,
  eventName: string,
  handler: (...args: T) => Promise<void> | void
): (...args: T) => void {
  return async (...args: T) => {
    try {
      // 1. Rate Limiting Check
      if (!socketRateLimiter.consume(socket.id)) {
        // If the last argument is a callback, return an error natively
        const lastArg = args[args.length - 1];
        if (typeof lastArg === 'function') {
          lastArg({ success: false, message: 'Rate limit exceeded' });
        }
        return;
      }

      // 2. Execute Handler
      await handler(...args);
    } catch (error) {
      logger.error(`[Socket Error] Event '${eventName}' from socket ${socket.id} failed:`, error);
      
      // If the last argument is a callback, return an error securely
      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'function') {
        lastArg({ success: false, message: 'Internal server error processing event' });
      }
    }
  };
}
