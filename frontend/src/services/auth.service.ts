import { fetchApi } from '../lib/api';
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth.types';
import { AUTH_TOKEN_KEY } from '../lib/constants';

/**
 * Persists the JWT token in BOTH localStorage (for API calls) and
 * a cookie (for Edge Middleware route guards).
 *
 * Cookie is intentionally NOT httpOnly here so the client can also
 * read it. In production with a BFF/Server Actions architecture,
 * switch to an httpOnly cookie set by the backend.
 */
function persistToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  // SameSite=Strict prevents CSRF; path=/ ensures all routes can read it
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; SameSite=Strict`;
}

function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      requireAuth: false,
      body: JSON.stringify(credentials),
    });
    persistToken(data.token);
    return data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const data = await fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      requireAuth: false,
      body: JSON.stringify(credentials),
    });
    persistToken(data.token);
    return data;
  }

  logout(): void {
    clearToken();
  }

  async getCurrentUser(): Promise<User> {
    return fetchApi<User>('/auth/me');
  }
}

export const authService = new AuthService();
