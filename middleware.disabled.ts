// Middleware disabled - using client-side authentication guards instead
// This approach works reliably in both local and production environments

// Old middleware code is preserved here for reference
// If you need to re-enable middleware in the future, rename this file to middleware.ts

import { middleware as authMiddleware } from './src/middleware/auth';
import { NextRequest } from 'next/server';

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
	],
};

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const hasCookies = request.cookies.size > 0;
	console.log('[Middleware]', { pathname, hasCookies });
	
	return authMiddleware(request);
}
