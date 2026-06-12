import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateApiKey } from '../middleware/authenticateApiKey.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  ingestLogController,
  bulkIngestLogsController,
  listLogsController,
} from '../controllers/logs.controller';
import { uploadLogsController } from '../controllers/upload.controller';
import { ingestionRateLimiter } from '../middleware/rateLimiter.middleware';
import { uploadMiddleware } from '../config/multer';

const router = Router();

router.post('/ingest', ingestionRateLimiter, authenticateApiKey, asyncHandler(ingestLogController));
router.post('/bulk', ingestionRateLimiter, authenticateApiKey, asyncHandler(bulkIngestLogsController));
router.post(
  '/upload',
  authMiddleware,
  uploadMiddleware.single('file'),
  asyncHandler(uploadLogsController)
);
router.get('/', authenticateApiKey, asyncHandler(listLogsController));

export default router;
