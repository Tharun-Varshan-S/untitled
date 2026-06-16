import { cookies } from 'next/headers';
import { AUTH_TOKEN_KEY } from './constants';

/**
 * Server-side function to check if the user is authenticated.
 * Used in Next.js Server Components and Server Actions.
 */
export async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_KEY);
  return !!token;
}

/**
 * Get the token on the server side
 */
export async function getServerToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_KEY)?.value;
}
