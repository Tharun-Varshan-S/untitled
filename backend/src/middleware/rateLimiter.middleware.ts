import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

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


