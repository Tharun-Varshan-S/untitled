import rateLimit from 'express-rate-limit';

export const ingestionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
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
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many analytics requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});
