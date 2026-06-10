import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from '../controllers/project.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', asyncHandler(createProjectController));
router.get('/', asyncHandler(listProjectsController));
router.get('/:id', asyncHandler(getProjectController));
router.patch('/:id', asyncHandler(updateProjectController));
router.delete('/:id', asyncHandler(deleteProjectController));

export default router;
