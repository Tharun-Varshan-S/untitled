import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createApiKeyController, listApiKeysController } from '../controllers/apiKey.controller';

const router = Router({ mergeParams: true });

router.post('/', asyncHandler(createApiKeyController));
router.get('/', asyncHandler(listApiKeysController));

export default router;
