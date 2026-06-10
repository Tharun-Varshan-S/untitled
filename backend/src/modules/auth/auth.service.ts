import { AppError } from '../../utils/AppError';
import { signJwt } from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/hash';
import {
  createUser,
  findSafeUserById,
  findUserByEmail,
  toSafeUserRecord,
} from './auth.repository';
import { AuthPayload, AuthenticatedUser, LoginInput, RegisterInput, SafeUser } from './auth.types';
import { validateLoginInput, validateRegisterInput } from './auth.validation';

export const registerUser = async (payload: unknown): Promise<SafeUser> => {
  const data = validateRegisterInput(payload);
  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new AppError('Email is already registered', 409, 'DUPLICATE_EMAIL');
  }

  const hashedPassword = await hashPassword(data.password);
  const user = await createUser({
    name: data.name,
    email: data.email,
    passwordHash: hashedPassword,
  });

  return toSafeUserRecord(user);
};

export const loginUser = async (
  payload: unknown
): Promise<{ token: string; user: SafeUser }> => {
  const data = validateLoginInput(payload);
  const user = await findUserByEmail(data.email, { withPasswordHash: true });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const safeUser = toSafeUserRecord(user);
  const token = signJwt({ userId: safeUser.id } as AuthPayload);

  return { token, user: safeUser };
};

export const getUserById = async (id: string): Promise<AuthenticatedUser> => {
  const user = await findSafeUserById(id);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
};
