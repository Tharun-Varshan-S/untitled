import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyJwt } from '../utils/jwt';
import { findSafeUserById } from '../modules/auth/auth.repository';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let payload;

  try {
    payload = verifyJwt(token);
  } catch {
    return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  findSafeUserById(payload.userId)
    .then((user) => {
      if (!user) {
        return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
      }

      (req as any).user = user;
      next();
    })
    .catch(next);
};
