/**
 * Auth types — aligned to backend SafeUser and auth service contracts.
 *
 * Backend source of truth:
 *   POST /auth/login    → { success: true, data: { token: string; user: SafeUser } }
 *   POST /auth/register → { success: true, data: SafeUser }  (no token on register)
 *   GET  /auth/me       → { success: true, data: SafeUser }
 *
 * SafeUser (backend) = { id, name, email, createdAt, updatedAt? }
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

/** Shape returned inside data on POST /auth/login */
export interface AuthLoginData {
  token: string;
  user: User;
}

/** Generic backend success wrapper */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
