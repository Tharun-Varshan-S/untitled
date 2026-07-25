import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createWorkspaceController,
  getUserWorkspacesController,
  getWorkspaceByIdController,
  getWorkspaceProjectsController,
  createWorkspaceProjectController,
} from '../controllers/workspace.controller';

const router = Router();

// Protect all workspace routes with auth
router.use(authMiddleware);

router.post('/', createWorkspaceController);
router.get('/', getUserWorkspacesController);
router.get('/:id', getWorkspaceByIdController);
router.get('/:id/projects', getWorkspaceProjectsController);
router.post('/:id/projects', createWorkspaceProjectController);

export default router;
