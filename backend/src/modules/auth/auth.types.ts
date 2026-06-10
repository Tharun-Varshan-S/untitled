export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type SafeUser = User;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthPayload = {
  userId: string;
};

export type AuthenticatedUser = SafeUser;
