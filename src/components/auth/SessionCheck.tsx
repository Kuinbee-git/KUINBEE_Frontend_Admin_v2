'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const PUBLIC_PATHS = ['/login', '/auth/login', '/', '/admin/accept-invite'];

/**
 * SessionCheck - Client-side auth guard
 * Single responsibility: Redirect unauthenticated users from protected routes
 * Does NOT handle authenticated users on public paths (useLogin handles that)
 */
export function SessionCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const hasRedirected = useRef(false);
  
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    // Reset redirect flag when pathname changes
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    // Don't redirect if already redirected
    if (hasRedirected.current) return;
    
    // Check if there's a user in localStorage (store might not be hydrated yet)
    // This prevents premature redirect during page refresh
    let hasStoredUser = false;
    try {
      const stored = localStorage.getItem('kuinbee-auth-storage');
      if (stored) {
        const state = JSON.parse(stored);
        if (state.state?.user) {
          hasStoredUser = true;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    // Only redirect UNAUTHENTICATED users away from PROTECTED routes
    // Trust stored data if store hasn't hydrated yet
    if (!user && !hasStoredUser && !isPublicPath) {
      hasRedirected.current = true;
      router.replace('/login');
    }
  }, [user, isPublicPath, pathname, router]);

  return null;
}
