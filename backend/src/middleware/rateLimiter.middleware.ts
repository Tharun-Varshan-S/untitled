import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

export const ingestionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many ingestion requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

export const analyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many analytics requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Search rate limiter — MongoDB $text queries are CPU-intensive.
 * Limits to 30 searches per minute per IP to prevent DoS via complex queries.
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many search requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});
