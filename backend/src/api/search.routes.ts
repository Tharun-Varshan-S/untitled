import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateApiKey } from '../middleware/authenticateApiKey.middleware';
import { searchLogsController } from '../controllers/search.controller';

const router = Router();

router.get('/', authenticateApiKey, asyncHandler(searchLogsController));

export default router;
