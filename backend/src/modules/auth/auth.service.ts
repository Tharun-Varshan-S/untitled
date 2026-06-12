import { AppError } from '../../utils/AppError';
import { auditLog } from '../../utils/audit';
import { signJwt } from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/hash';
import { randomBytes } from 'crypto';
import UserModel from '../../models/User';
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
    auditLog('REGISTRATION_FAILURE', { reason: 'DUPLICATE_EMAIL', email: data.email });
    throw new AppError('Email is already registered', 409, 'DUPLICATE_EMAIL');
  }

  const hashedPassword = await hashPassword(data.password);
  const user = await createUser({
    name: data.name,
    email: data.email,
    passwordHash: hashedPassword,
  });

  auditLog('USER_REGISTERED', { userId: user._id.toString(), email: data.email, name: data.name });

  return toSafeUserRecord(user);
};

export const loginUser = async (
  payload: unknown
): Promise<{ token: string; user: SafeUser }> => {
  const data = validateLoginInput(payload);
  const user = await findUserByEmail(data.email, { withPasswordHash: true });

  if (!user || !user.passwordHash) {
    auditLog('LOGIN_FAILURE', { reason: 'INVALID_CREDENTIALS', email: data.email });
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    auditLog('LOGIN_FAILURE', { reason: 'INVALID_PASSWORD', email: data.email, userId: user._id.toString() });
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const safeUser = toSafeUserRecord(user);
  const token = signJwt({ userId: safeUser.id } as AuthPayload);

  auditLog('USER_LOGIN', { userId: user._id.toString(), email: data.email });

  return { token, user: safeUser };
};

export const getUserById = async (id: string): Promise<AuthenticatedUser> => {
  const user = await findSafeUserById(id);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
};

export const initiatePasswordReset = async (email: string): Promise<{ resetToken: string }> => {
  const user = await findUserByEmail(email);

  if (!user) {
    auditLog('PASSWORD_RESET_REQUESTED', { reason: 'USER_NOT_FOUND', email });
    // don't reveal if user exists, for security
    throw new AppError('If user exists, a reset link will be sent', 200, 'PASSWORD_RESET_INITIATED');
  }

  // Generate reset token (32 bytes = 64 hex chars)
  const resetToken = randomBytes(32).toString('hex');
  const hashedToken = await hashPassword(resetToken);
  const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Save hashed token and expiration to database
  await UserModel.updateOne(
    { _id: user._id },
    {
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: tokenExpires,
    }
  );

  auditLog('PASSWORD_RESET_INITIATED', { userId: user._id.toString(), email });

  // Return unhashed token for sending to user
  return { resetToken };
};

export const resetPassword = async (payload: unknown): Promise<SafeUser> => {
  const data = payload as { resetToken?: string; newPassword?: string };

  if (!data.resetToken || typeof data.resetToken !== 'string') {
    throw new AppError('Invalid reset token format', 400, 'INVALID_RESET_TOKEN');
  }

  if (!data.newPassword || typeof data.newPassword !== 'string') {
    throw new AppError('Password is required', 400, 'PASSWORD_REQUIRED');
  }

  if (data.newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400, 'PASSWORD_TOO_SHORT');
  }

  // Find user with matching token
  const user = await UserModel.findOne(
    { passwordResetTokenExpires: { $gt: new Date() } },
    { passwordResetToken: 1, passwordResetTokenExpires: 1, email: 1 }
  );

  if (!user || !user.passwordResetToken) {
    auditLog('PASSWORD_RESET_FAILURE', { reason: 'NO_VALID_TOKEN' });
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
  }

  // Verify token matches
  const isTokenValid = await comparePassword(data.resetToken, user.passwordResetToken);
  if (!isTokenValid) {
    auditLog('PASSWORD_RESET_FAILURE', { reason: 'INVALID_TOKEN', userId: user._id.toString() });
    throw new AppError('Invalid reset token', 400, 'INVALID_RESET_TOKEN');
  }

  // Hash new password and update
  const newHashedPassword = await hashPassword(data.newPassword);
  const updatedUser = await UserModel.findByIdAndUpdate(
    user._id,
    {
      passwordHash: newHashedPassword,
      passwordResetToken: undefined,
      passwordResetTokenExpires: undefined,
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError('Failed to reset password', 500, 'PASSWORD_RESET_FAILED');
  }

  auditLog('PASSWORD_RESET_SUCCESS', { userId: user._id.toString(), email: user.email });

  return toSafeUserRecord(updatedUser);
};
