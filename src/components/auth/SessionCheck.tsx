'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const PUBLIC_PATHS = ['/login', '/auth/login', '/'];

/**
 * SessionCheck - Client-side auth fallback
 * Now less aggressive since middleware handles server-side redirects
 * Only handles client-side navigation edge cases
 */
export function SessionCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const hasRedirected = useRef(false);
  
  // Use only the Zustand store for auth checks (synchronous and reliable)
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Reset redirect flag when pathname changes
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    // Don't redirect if already redirected
    if (hasRedirected.current) return;

    // Only redirect after client-side navigation (middleware handles page loads)
    // Add a small delay to avoid competing with middleware
    const timeoutId = setTimeout(() => {
      // If not authenticated and NOT on login page, redirect to login
      if (!isAuthenticated && !isPublicPath) {
        hasRedirected.current = true;
        router.replace('/login');
        return;
      }

      // If authenticated and on login page, redirect to dashboard
      if (isAuthenticated && isPublicPath && pathname !== '/') {
        hasRedirected.current = true;
        router.replace('/dashboard');
      }
    }, 50); // Small delay to avoid race with middleware

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isPublicPath, pathname, router]);

  return null;
}
