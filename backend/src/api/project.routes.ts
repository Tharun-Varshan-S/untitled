import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/auth.middleware';
import { sanitizeProjectInput, handleSanitizationErrors } from '../middleware/sanitize.middleware';
import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from '../controllers/project.controller';
import projectApiKeysRoutes from './project-api-keys.routes';

const router = Router();

router.use(authMiddleware);

router.post('/', sanitizeProjectInput, handleSanitizationErrors, asyncHandler(createProjectController));
router.get('/', asyncHandler(listProjectsController));
router.get('/:id', asyncHandler(getProjectController));
router.patch('/:id', sanitizeProjectInput, handleSanitizationErrors, asyncHandler(updateProjectController));
router.delete('/:id', asyncHandler(deleteProjectController));

// Project-scoped API keys
router.use('/:id/api-keys', projectApiKeysRoutes);

export default router;
