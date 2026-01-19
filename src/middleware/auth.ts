import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/auth/login', '/admin/accept-invite'];

// Protected paths that require authentication
const PROTECTED_PATHS = ['/dashboard'];

/**
 * Check if user has auth cookies (fast check, no API call)
 * Full auth validation happens client-side via React Query
 */
function hasAuthCookies(request: NextRequest): boolean {
  // Check for session cookie existence (fast, no network call)
  const sessionCookie = request.cookies.get('sid') ||                    // Your backend uses 'sid'
                        request.cookies.get('connect.sid') || 
                        request.cookies.get('session') ||
                        request.cookies.get('auth_token');
  
  // Log for debugging (visible in Vercel logs)
  console.log('[Auth Middleware] Cookie check:', { 
    hasSid: !!request.cookies.get('sid'),
    hasSessionCookie: !!sessionCookie,
    allCookieNames: Array.from(request.cookies.getAll()).map(c => c.name)
  });
  
  return !!sessionCookie;
}

/**
 * Middleware for server-side authentication checks
 * Uses fast cookie check instead of API call to avoid blocking
 * Full validation happens client-side
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path requires auth
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // Skip auth check for root path (will be handled by client-side redirect)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Fast cookie-based auth check (no API call)
  const hasAuth = hasAuthCookies(request);

  // Redirect users without auth cookies away from protected routes
  if (isProtectedPath && !hasAuth) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Redirect users with auth cookies away from login page
  if (isPublicPath && hasAuth && pathname !== '/') {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  // Allow access to all other routes
  return NextResponse.next();
}


