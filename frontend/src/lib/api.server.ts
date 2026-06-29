/**
 * Server-only API wrapper.
 *
 * This file imports next/headers and is therefore ONLY safe to use in:
 *   - Server Components
 *   - Server Actions
 *   - Route Handlers
 *
 * DO NOT import this file from any Client Component or client service.
 * Client services (auth.service, upload.service) use lib/api.ts directly.
 *
 * Usage in a Server Component page:
 *   import { fetchApiServer } from '@/lib/api.server';
 *   const data = await fetchApiServer<MyType>('/some-endpoint');
 */

import { getServerToken } from './auth';
import { fetchApi } from './api';

export async function fetchApiServer<T>(
  endpoint: string,
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<T> {
  const token = await getServerToken();
  return fetchApi<T>(endpoint, { ...options, token: token ?? undefined });
}
