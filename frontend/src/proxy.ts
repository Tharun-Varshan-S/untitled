import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_TOKEN_KEY } from './lib/constants';

/**
 * Next.js Proxy (formerly Middleware) — Authentication Guard
 *
 * Runs on the Edge Runtime BEFORE a page renders.
 * Reads the JWT token from cookies and:
 *   - Redirects unauthenticated users to /login
 *   - Redirects authenticated users away from /login or /register to /dashboard
 *
 * WHY COOKIES and not localStorage?
 * This proxy runs on the server/edge. localStorage is browser-only.
 * authService.login() sets a JS-accessible cookie alongside localStorage
 * so this proxy can read it.
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
