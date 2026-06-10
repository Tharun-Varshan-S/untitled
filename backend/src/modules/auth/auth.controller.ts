import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { loginUser, registerUser, getUserById } from './auth.service';

export const register = async (req: Request, res: Response) => {
  const user = await registerUser(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const user = getUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
};
