'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/hooks';
import { SESSION_EXPIRED_EVENT } from '@/lib/api/client';

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
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.logout);
  const { data: user, isLoading, isError, isFetching, refetch } = useCurrentUser();
  const isAdminIdentity = user?.userType === 'ADMIN' || user?.userType === 'SUPERADMIN';

  useEffect(() => {
    // Remove identity data persisted by older builds. The session cookie is now
    // the only durable authentication source.
    window.localStorage.removeItem('kuinbee-auth-storage');
  }, []);

  useEffect(() => {
    // Sync user from API to store
    if (user && isAdminIdentity && !isLoading) {
      setUser(user);
    } else if (!isLoading && !user) {
      setUser(null);
    }
  }, [isAdminIdentity, user, isLoading, setUser]);

  useEffect(() => {
    const handleExpiredSession = () => {
      clearAuth();
      queryClient.clear();
      router.replace('/login');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiredSession);
  }, [clearAuth, queryClient, router]);

  useEffect(() => {
    if (!isLoading && !isError && (!user || !isAdminIdentity)) {
      clearAuth();
      queryClient.clear();
      router.replace('/login');
    }
  }, [clearAuth, isAdminIdentity, isError, isLoading, queryClient, router, user]);

  // Show loading state during initial check
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" aria-label="Verifying session">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-surface)] p-4">
        <Alert className="max-w-lg border-[var(--status-error-border)] bg-[var(--bg-base)]">
          <AlertCircle className="h-4 w-4 text-[var(--status-error)]" aria-hidden="true" />
          <AlertTitle>Unable to verify your session</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>
              The admin service could not be reached. Your access has not been treated as signed
              out; retry when the service is available.
            </p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Checking…' : 'Retry session check'}
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  // Only render if we have user data from API
  if (user && isAdminIdentity) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
