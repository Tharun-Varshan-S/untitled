import { logger } from './logger';

export const auditLog = (event: string, payload?: Record<string, unknown>) => {
  const message = payload ? `${event} ${JSON.stringify(payload)}` : event;
  logger.info(`[AUDIT] ${message}`);
};
