import { middleware as authMiddleware } from './src/middleware/auth';
import { NextRequest } from 'next/server';

export const config = {
	// Only match dashboard and login routes for clarity
	matcher: ['/dashboard/:path*', '/login', '/auth/login'],
};

export async function middleware(request: NextRequest) {
	// Debug log to verify middleware runs
	console.log('MIDDLEWARE RUNNING:', request.nextUrl.pathname);
	// Always call the auth middleware
	return authMiddleware(request);
}
