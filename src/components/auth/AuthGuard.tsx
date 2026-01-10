"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/hooks';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard
 * Redirects to login if user is not authenticated
 * Works reliably in both local and production environments
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user: storeUser } = useAuthStore();
  const { data: user, isLoading, isError } = useCurrentUser();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    // and we haven't already redirected
    if (!hasRedirected && !isLoading) {
      // Check both store state and query result
      const notAuthenticated = (!isAuthenticated && !storeUser) || (isError && !user);
      
      if (notAuthenticated) {
        console.log('[AuthGuard] User not authenticated, redirecting to login');
        setHasRedirected(true);
        router.replace('/login');
      }
    }
  }, [user, isLoading, isError, isAuthenticated, storeUser, router, hasRedirected]);

  // Show loading state while checking auth
  if (isLoading || (!user && !isError)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Only render children if authenticated
  if ((user || storeUser) && isAuthenticated) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
