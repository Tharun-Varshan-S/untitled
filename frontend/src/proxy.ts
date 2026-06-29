import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_TOKEN_KEY } from './lib/constants';

/**
 * Next.js 16 Proxy — Authentication Guard
 *
 * In Next.js 16, "Middleware" was renamed to "Proxy". The file must be named
 * `proxy.ts` (or `proxy.js`) and the default export must be named `proxy`.
 * The behaviour is identical to the former middleware.ts convention.
 *
 * Runs on the Node.js runtime BEFORE a page renders.
 * Reads the JWT token from cookies and:
 *   - Redirects unauthenticated users to /login
 *   - Redirects authenticated users away from /login or /register to /dashboard
 *
 * WHY COOKIES and not localStorage?
 * The proxy runs on the server. localStorage is browser-only.
 * authService.login() writes a SameSite=Strict cookie alongside localStorage
 * so this proxy can read it server-side.
 *
 * This is the single source of truth for route protection.
 * DO NOT duplicate auth guards inside individual pages.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;

  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // If unauthenticated and trying to access a protected page → send to login
  if (!token && !isPublicPath && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/register → send to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes EXCEPT:
   * - Next.js internal routes (_next/static, _next/image)
   * - favicon, public assets
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
