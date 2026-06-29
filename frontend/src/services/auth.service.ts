import { fetchApi } from '../lib/api';
import { LoginCredentials, RegisterCredentials, User, AuthLoginData, ApiSuccess } from '../types/auth.types';
import { AUTH_TOKEN_KEY } from '../lib/constants';

/**
 * JWT cookie lifetime — must match the backend JWT expiry.
 * Backend signs tokens with expiresIn: '7d' (7 days = 604800 seconds).
 * The cookie max-age is set to the same value so the browser clears it
 * automatically when the token expires, preventing stale-cookie logins.
 *
 * Expiry strategy: If the backend JWT lifetime changes, update this constant.
 * In a future phase with token refresh (Phase J), the max-age should be
 * renewed on each successful refresh cycle.
 */
const JWT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days — matches backend expiresIn

/**
 * Persists the JWT token in BOTH localStorage (for API calls) and
 * a cookie (for Proxy route guards).
 *
 * Cookie is intentionally NOT httpOnly here so the client can also
 * read it. In production with a BFF/Server Actions architecture,
 * switch to an httpOnly cookie set by the backend.
 *
 * Security attributes applied:
 *   - SameSite=Strict  — prevents CSRF on same-origin requests
 *   - Secure           — transmitted over HTTPS only in production
 *   - max-age          — matches JWT lifetime; browser auto-expires the cookie
 *   - path=/           — readable by all routes including the proxy
 */
function persistToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${JWT_COOKIE_MAX_AGE_SECONDS}; SameSite=Strict${secureFlag}`;
}

function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict${secureFlag}`;
}

class AuthService {
  /**
   * POST /auth/login
   * Backend response: { success: true, data: { token: string; user: User } }
   * Unwraps data, persists token, returns the login data.
   */
  async login(credentials: LoginCredentials): Promise<AuthLoginData> {
    const res = await fetchApi<ApiSuccess<AuthLoginData>>('/auth/login', {
      method: 'POST',
      requireAuth: false,
      body: JSON.stringify(credentials),
    });
    persistToken(res.data.token);
    return res.data;
  }

  /**
   * POST /auth/register
   * Backend response: { success: true, data: User }
   * NOTE: Register does NOT return a token — only a SafeUser.
   * After registration the user is redirected to login to authenticate.
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    const res = await fetchApi<ApiSuccess<User>>('/auth/register', {
      method: 'POST',
      requireAuth: false,
      body: JSON.stringify(credentials),
    });
    return res.data;
  }

  logout(): void {
    clearToken();
  }

  /**
   * GET /auth/me
   * Backend response: { success: true, data: User }
   */
  async getCurrentUser(): Promise<User> {
    const res = await fetchApi<ApiSuccess<User>>('/auth/me');
    return res.data;
  }
}

export const authService = new AuthService();
