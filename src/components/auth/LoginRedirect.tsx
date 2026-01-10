"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/hooks';

interface LoginRedirectProps {
  children: React.ReactNode;
}

/**
 * Redirects authenticated users away from login page
 * Works reliably in both local and production environments
 */
export function LoginRedirect({ children }: LoginRedirectProps) {
  const router = useRouter();
  const { isAuthenticated, user: storeUser } = useAuthStore();
  const { data: user, isLoading } = useCurrentUser({ enabled: isAuthenticated });
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if we're certain the user IS authenticated
    // and we haven't already redirected
    if (!hasRedirected && !isLoading) {
      const authenticated = isAuthenticated && (user || storeUser);
      
      if (authenticated) {
        console.log('[LoginRedirect] User already authenticated, redirecting to dashboard');
        setHasRedirected(true);
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, isAuthenticated, storeUser, router, hasRedirected]);

  // Always render children (login form) - redirect happens in background
  return <>{children}</>;
}
