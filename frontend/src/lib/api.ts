import { API_BASE_URL, AUTH_TOKEN_KEY } from './constants';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Centralized API wrapper to handle common logic like setting auth headers,
 * error handling, and response parsing.
 */
export async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { requireAuth = true, ...customConfig } = options;
  
  // Using Record<string, string> (compatible with fetch headers) instead of
  // HeadersInit so we can safely set arbitrary header keys.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customConfig.headers as Record<string, string>),
  };

  if (requireAuth) {
    // Note: In Next.js App Router, localStorage is only available on the client.
    // For Server Components, read from cookies via lib/auth.ts instead.
    if (typeof window !== 'undefined') {
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
      // Standardize error throwing so services can catch them easily
      throw new Error(data.message || 'An error occurred while fetching data');
    }

    return data;
  } catch (error: any) {
    // If it's a TypeError indicating 'Failed to fetch', it's a network/offline error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Cannot reach backend. If you are using college Wi-Fi, a firewall might be blocking the connection. Try a mobile hotspot, a VPN, or check if the backend server is running on port 5000.'
      );
    }
    throw error;
  }
}
