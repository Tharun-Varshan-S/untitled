import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/auth.middleware';
import { getApiKeyController, revokeApiKeyController, deleteApiKeyController } from '../controllers/apiKey.controller';

const router = Router();

router.use(authMiddleware);

router.get('/:id', asyncHandler(getApiKeyController));
router.patch('/:id/revoke', asyncHandler(revokeApiKeyController));
router.delete('/:id', asyncHandler(deleteApiKeyController));

export default router;
