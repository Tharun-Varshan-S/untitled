import { AppError } from '../../utils/AppError';
import { LoginInput, RegisterInput } from './auth.types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegisterInput = (payload: unknown): RegisterInput => {
  const data = payload as Record<string, unknown>;

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError('Email must be valid', 400);
  }

  if (!password) {
    throw new AppError('Password is required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  return { name, email, password };
};

export const validateLoginInput = (payload: unknown): LoginInput => {
  const data = payload as Record<string, unknown>;

  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  if (!password) {
    throw new AppError('Password is required', 400);
  }

  return { email, password };
};
