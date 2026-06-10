import mongoose from 'mongoose';
import UserModel, { UserDocument } from '../../models/User';
import { SafeUser } from './auth.types';

const toSafeUser = (user: UserDocument): SafeUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const createUser = async (user: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserDocument> => {
  return UserModel.create(user);
};

export const findUserByEmail = async (
  email: string,
  options?: { withPasswordHash?: boolean }
): Promise<UserDocument | null> => {
  const query = UserModel.findOne({ email });

  if (options?.withPasswordHash) {
    query.select('+passwordHash');
  }

  return query.exec();
};

export const findUserById = async (id: string): Promise<UserDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return UserModel.findById(id).exec();
};

export const findSafeUserById = async (id: string): Promise<SafeUser | null> => {
  const user = await findUserById(id);
  return user ? toSafeUser(user) : null;
};

export const toSafeUserRecord = toSafeUser;
