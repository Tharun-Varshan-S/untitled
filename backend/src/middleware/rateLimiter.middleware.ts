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
