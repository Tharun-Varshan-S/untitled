import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/auth.middleware';
import { analyticsRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  getOverviewController,
  getLogLevelsController,
  getServicesController,
  getTrendsController,
} from '../controllers/analytics.controller';

const router = Router();

router.use(authMiddleware);
router.use(analyticsRateLimiter);

router.get('/overview', asyncHandler(getOverviewController));
router.get('/log-levels', asyncHandler(getLogLevelsController));
router.get('/services', asyncHandler(getServicesController));
router.get('/trends', asyncHandler(getTrendsController));

export default router;
