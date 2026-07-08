import { logger } from './logger';

export const searchLogger = {
  logLatency: (projectId: string, query: any, durationMs: number, resultCount: number) => {
    logger.info('Search Executed', {
      type: 'SEARCH_METRICS',
      projectId,
      durationMs,
      resultCount,
      queryTokens: Object.keys(query).length,
    });
  },
  logTimeout: (projectId: string, query: any, error: any) => {
    logger.error('Search Timeout', {
      type: 'SEARCH_ERROR',
      projectId,
      error: error.message,
    });
  }
};
