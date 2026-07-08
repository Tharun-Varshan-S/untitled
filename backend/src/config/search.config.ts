export const SearchConfig = {
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  validation: {
    maxQueryLength: 200,
    maxFieldLength: 100, // For service, environment, etc.
    allowedLevels: ['info', 'warn', 'error', 'debug'],
  },
  database: {
    maxTimeMS: 5000, // Prevent DoS by killing long queries
    defaultSort: { timestamp: -1, _id: 1 } as const, // Matches compound index
  },
  cache: {
    ttlSeconds: 60, // Prepared for Phase P
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute window (Prepared for Phase P)
    maxRequests: 30, // Limit per IP/User (Prepared for Phase P)
  }
} as const;
