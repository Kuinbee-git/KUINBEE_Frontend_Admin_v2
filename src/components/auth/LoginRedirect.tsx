'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const { data: currentUser, isLoading } = useCurrentUser();
  const isAdminIdentity =
    currentUser?.userType === 'ADMIN' || currentUser?.userType === 'SUPERADMIN';

  useEffect(() => {
    if (!isLoading && isAdminIdentity) router.replace('/dashboard');
  }, [isAdminIdentity, isLoading, router]);

  if (isLoading || isAdminIdentity) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-surface)]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          aria-label="Checking existing session"
        />
      </div>
    );
  }

  return <>{children}</>;
}
