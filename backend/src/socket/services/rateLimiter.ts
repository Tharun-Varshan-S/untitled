import { socketConfig } from '../config';
import { logger } from '../../utils/logger';

class SocketRateLimiter {
  // Track requests per socket id: Map<socketId, { count: number, resetAt: number }>
  private counters = new Map<string, { count: number; resetAt: number }>();
  private readonly maxTokens = socketConfig.rateLimit;
  private readonly windowMs = 1000; // 1 second window

  public consume(socketId: string): boolean {
    const now = Date.now();
    const record = this.counters.get(socketId);

    if (!record || now >= record.resetAt) {
      // Create new record or reset expired window
      this.counters.set(socketId, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (record.count < this.maxTokens) {
      record.count++;
      return true;
    }

    // Rate limit exceeded
    logger.warn(`[SocketRateLimiter] Socket ${socketId} exceeded rate limit (${this.maxTokens}/s)`);
    return false;
  }

  public clear(socketId: string): void {
    this.counters.delete(socketId);
  }
}

export const socketRateLimiter = new SocketRateLimiter();
