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
 * API response is the source of truth
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  const { data: user, isLoading, isError } = useCurrentUser();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Sync user from API to store
    if (user && !isLoading) {
      setUser(user);
    } else if (!isLoading && !user) {
      setUser(null);
    }
  }, [user, isLoading, setUser]);

  useEffect(() => {
    // Only redirect if we're certain the user is not authenticated
    if (!hasRedirected && !isLoading) {
      // Check if user is not authenticated (no user from API and error occurred)
      if (!user && isError) {
        setHasRedirected(true);
        router.replace('/login');
      }
    }
  }, [user, isLoading, isError, router, hasRedirected]);

  // Show loading state during initial check
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Only render if we have user data from API
  if (user) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
