import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

/**
 * Root page (/) — Server Component
 * Redirects unauthenticated users to /login and authenticated users to /dashboard.
 * We don't render any UI here — the redirect is instant.
 *
 * NOTE: In Phase J+, replace with a proper server-side session check
 * (reading cookie via `getServerToken()` from lib/auth.ts).
 */
export default function RootPage() {
  redirect(ROUTES.LOGIN);
}
