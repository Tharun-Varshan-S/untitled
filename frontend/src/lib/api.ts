import { API_BASE_URL, AUTH_TOKEN_KEY } from './constants';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Centralized API wrapper.
 *
 * Works in both Server Components and Client Components.
 *
 * Token injection strategy:
 *   - Client Components: pass token via `serverToken` param (not used) — token
 *     is read from localStorage automatically when window is defined.
 *   - Server Components: call fetchApiServer() from lib/api.server.ts instead,
 *     which reads the token from cookies before calling this function.
 *
 * This file deliberately does NOT import next/headers or any server-only module
 * so it remains safe to import in Client Components.
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions & { token?: string } = {}
): Promise<T> {
  const { requireAuth = true, token: explicitToken, ...customConfig } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customConfig.headers as Record<string, string>),
  };

  if (requireAuth) {
    // Explicit token passed in (used by server-side callers via fetchApiServer)
    if (explicitToken) {
      headers['Authorization'] = `Bearer ${explicitToken}`;
    } else if (typeof window !== 'undefined') {
      // Client-side: read from localStorage
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred while fetching data');
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Cannot reach backend. If you are using college Wi-Fi, a firewall might be blocking the connection. Try a mobile hotspot, a VPN, or check if the backend server is running on port 5000.'
      );
    }
    throw error;
  }
}
