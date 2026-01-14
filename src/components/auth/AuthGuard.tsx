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
  const { isAuthenticated, user: storeUser, setUser } = useAuthStore();
  const { data: user, isLoading, isError } = useCurrentUser();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Sync user from query to store if available
    if (user && !isLoading) {
      setUser(user);
      setIsInitialLoad(false);
    } else if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [user, isLoading, setUser]);

  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    // Wait for initial load to complete and don't redirect if we have storeUser
    if (!hasRedirected && !isLoading && !isInitialLoad) {
      // If we have a user in store, trust it (don't redirect)
      if (storeUser) {
        return;
      }
      
      // Check if user is not authenticated (no user from API and error occurred)
      if (!user && isError) {
        setHasRedirected(true);
        router.replace('/login');
      }
    }
  }, [user, isLoading, isError, storeUser, router, hasRedirected, isInitialLoad]);

  // Show loading state during initial check
  if (isLoading || isInitialLoad) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If we have user data from either source OR isAuthenticated flag is set, render children
  // This handles the case where the store has isAuthenticated but user object is temporarily missing
  if (user || storeUser || isAuthenticated) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
