import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { loginUser, registerUser, getUserById, initiatePasswordReset, resetPassword } from './auth.service';

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
  const userReq = req as any;
  if (!userReq.user) {
    throw new AppError('Unauthorized', 401);
  }

  const user = getUserById(userReq.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    throw new AppError('Email is required', 400, 'EMAIL_REQUIRED');
  }

  const result = await initiatePasswordReset(email);

  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset link will be sent',
    // In production: DO NOT return the token here
    // Instead, send it via email. This is just for demo/testing.
    resetToken: result.resetToken,
  });
};

export const resetUserPassword = async (req: Request, res: Response) => {
  const user = await resetPassword(req.body);

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully',
    data: user,
  });
};
