/**
 * Auth API Hooks
 * React Query hooks for authentication
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import type {
  AdminPasswordChangeRequest,
  AdminPasswordResetConfirmRequest,
  AdminPasswordResetRequest,
  LoginRequest,
  UpdateProfileRequest,
} from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';

// ============================================
// Query Keys
// ============================================

const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  permissions: () => [...authKeys.all, 'permissions'] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Get current authenticated user
 */
export function useCurrentUser(options?: {
  enabled?: boolean;
  retry?: boolean;
  refetchOnMount?: boolean | 'always';
}) {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      // Always return a value (null is valid, undefined is not)
      return user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    // Allow fresh fetch on mount to get latest data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * Get current admin's profile
 * Only runs when user is authenticated
 */
export function useProfile(options?: { enabled?: boolean }) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authService.getProfile,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? !!user,
    retry: false,
  });
}

/**
 * Get current admin's permissions
 * Only runs when user is authenticated
 */
export function useMyPermissions(options?: { enabled?: boolean }) {
  const setPermissions = useAuthStore((state) => state.setPermissions);
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: authKeys.permissions(),
    queryFn: async () => {
      const permissions = await authService.getMyPermissions();
      setPermissions(permissions);
      return permissions;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? !!user,
    retry: false,
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { login: storeLogin, logout: storeLogout, setPermissions } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async (user) => {
      // Verify the user has admin privileges
      if (user.userType !== 'ADMIN' && user.userType !== 'SUPERADMIN') {
        // Wrong user type — log them out and show error
        try {
          await authService.logout();
        } catch {}
        toast.error('Access denied. This portal is for administrators only.', { duration: 4000 });
        return;
      }

      // Never trust the response identity until the HTTP-only session cookie is verified.
      let verifiedUser;
      try {
        verifiedUser = await authService.getCurrentUser();
      } catch {
        verifiedUser = null;
      }

      if (
        !verifiedUser ||
        (verifiedUser.userType !== 'ADMIN' && verifiedUser.userType !== 'SUPERADMIN')
      ) {
        storeLogout();
        queryClient.removeQueries({ queryKey: authKeys.all });
        authService.logout().catch(() => undefined);
        toast.error('The session could not be verified. Please sign in again.', {
          duration: 4000,
        });
        return;
      }

      // A new identity must never inherit cached data from a previous session.
      queryClient.clear();
      storeLogin(verifiedUser);
      queryClient.setQueryData(authKeys.me(), verifiedUser);

      // Fetch and cache permissions (don't block navigation)
      authService
        .getMyPermissions()
        .then((permissions) => {
          setPermissions(permissions);
          queryClient.setQueryData(authKeys.permissions(), permissions);
        })
        .catch(() => setPermissions([]));

      toast.success('Login successful', { duration: 1200 });

      // Navigate to dashboard
      router.replace('/dashboard');
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear every identity and domain query only after the server has
      // invalidated the HTTP-only session. Redirecting first races the login
      // guard against logout and can bounce the same session back into the
      // dashboard.
      logout();
      queryClient.clear();
      router.replace('/login');
      router.refresh();
      toast.success('Logged out successfully', { duration: 1200 });
    },
  });
}

/**
 * Accept invite mutation
 * Used when new admin accepts their invitation via email link
 */
export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { login: storeLogin, logout: storeLogout, setPermissions } = useAuthStore();

  return useMutation({
    mutationFn: authService.acceptInvite,
    onSuccess: async () => {
      let verifiedUser;
      try {
        verifiedUser = await authService.getCurrentUser();
      } catch {
        verifiedUser = null;
      }

      if (
        !verifiedUser ||
        (verifiedUser.userType !== 'ADMIN' && verifiedUser.userType !== 'SUPERADMIN')
      ) {
        storeLogout();
        queryClient.removeQueries({ queryKey: authKeys.all });
        authService.logout().catch(() => undefined);
        toast.error('Your account was activated, but the session could not be verified.', {
          duration: 4000,
        });
        router.replace('/login');
        return;
      }

      queryClient.clear();
      storeLogin(verifiedUser);
      queryClient.setQueryData(authKeys.me(), verifiedUser);

      // Fetch and cache permissions (don't block navigation)
      authService
        .getMyPermissions()
        .then((permissions) => {
          setPermissions(permissions);
          queryClient.setQueryData(authKeys.permissions(), permissions);
        })
        .catch(() => setPermissions([]));

      toast.success('Welcome! Your account has been activated', { duration: 2000 });

      // Navigate to dashboard
      router.replace('/dashboard');
    },
  });
}

export function useRequestAdminPasswordReset() {
  return useMutation({
    mutationFn: (data: AdminPasswordResetRequest) => authService.requestAdminPasswordReset(data),
  });
}

export function useConfirmAdminPasswordReset() {
  return useMutation({
    mutationFn: (data: AdminPasswordResetConfirmRequest) =>
      authService.confirmAdminPasswordReset(data),
  });
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: (data: AdminPasswordChangeRequest) => authService.changeAdminPassword(data),
    onSuccess: () => toast.success('Password changed successfully'),
    onError: (error) => toast.error(getFriendlyErrorMessage(error)),
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => authService.updateProfile(data),
    onSuccess: () => {
      // Invalidate all relevant queries so UI is always fresh
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      queryClient.invalidateQueries({ queryKey: authKeys.permissions() });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
    },
  });
}
