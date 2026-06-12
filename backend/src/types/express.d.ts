import type { AuthenticatedUser } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      project?: {
        id: string;
        name: string;
        description?: string;
        ownerId?: string;
        createdAt: Date;
        updatedAt?: Date;
      };
      apiKey?: {
        id: string;
        name: string;
        prefix: string;
        projectId: string;
        revoked: boolean;
      };
    }
  }
}

export {};
