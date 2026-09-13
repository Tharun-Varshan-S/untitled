import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateApiKey } from '../middleware/authenticateApiKey.middleware';
import { searchRateLimiter } from '../middleware/rateLimiter.middleware';
import { searchLogsController } from '../controllers/search.controller';

const router = Router();

router.get('/', searchRateLimiter, authenticateApiKey, asyncHandler(searchLogsController));

export default router;
