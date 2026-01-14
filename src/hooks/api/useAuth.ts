/**
 * Auth API Hooks
 * React Query hooks for authentication
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import type { LoginRequest, UpdateProfileRequest, CreateAddressRequest, UpdateAddressRequest } from '@/types';

// ============================================
// Query Keys
// ============================================

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  permissions: () => [...authKeys.all, 'permissions'] as const,
  addresses: () => [...authKeys.all, 'addresses'] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Get current authenticated user
 */
export function useCurrentUser(options?: { enabled?: boolean; retry?: boolean; refetchOnMount?: boolean | 'always' }) {
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
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authService.getProfile,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? isAuthenticated,
    retry: false,
  });
}

/**
 * Get current admin's permissions
 * Only runs when user is authenticated
 */
export function useMyPermissions(options?: { enabled?: boolean }) {
  const { setPermissions, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.permissions(),
    queryFn: async () => {
      const permissions = await authService.getMyPermissions();
      setPermissions(permissions);
      return permissions;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled ?? isAuthenticated,
    retry: false,
  });
}

/**
 * Get current admin's addresses
 * Only runs when user is authenticated
 */
export function useAddresses(options?: { enabled?: boolean }) {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.addresses(),
    queryFn: authService.getAddresses,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? isAuthenticated,
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
  const { login: storeLogin, setPermissions } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async (user) => {
      // Update store first (this sets isAuthenticated = true)
      storeLogin(user);
      
      // Update query cache
      queryClient.setQueryData(authKeys.me(), user);
      
      // Fetch user data from /auth/me to verify session
      try {
        const verifiedUser = await authService.getCurrentUser();
        
        if (verifiedUser) {
          // Update store with verified user
          storeLogin(verifiedUser);
          queryClient.setQueryData(authKeys.me(), verifiedUser);
        }
      } catch (error) {
        // Continue anyway, we have the user from login response
      }
      
      // Fetch and cache permissions (don't block navigation)
      authService.getMyPermissions()
        .then(permissions => {
          setPermissions(permissions);
          queryClient.setQueryData(authKeys.permissions(), permissions);
        })
        .catch(() => setPermissions([]));
      
      toast.success('Login successful', { duration: 1200 });
      
      // Navigate to dashboard
      router.replace('/dashboard');
    },
    onError: (error: Error) => {
      console.error('[Login] Error:', error);
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
    mutationFn: async () => {
      // Clear local state immediately (optimistic)
      logout();
      queryClient.removeQueries({ queryKey: authKeys.all });
      
      // Navigate immediately
      router.replace('/login');
      toast.success('Logged out successfully', { duration: 1200 });
      
      // Call backend logout in background (don't wait for it)
      authService.logout().catch(() => {
        // Ignore errors - we're already logged out locally
      });
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
  const { login: storeLogin, setPermissions } = useAuthStore();

  return useMutation({
    mutationFn: authService.acceptInvite,
    onSuccess: async (user) => {
      // Update store (sets isAuthenticated = true)
      storeLogin(user);
      
      // Update query cache
      queryClient.setQueryData(authKeys.me(), user);
      
      // Fetch and cache permissions (don't block navigation)
      authService.getMyPermissions()
        .then(permissions => {
          setPermissions(permissions);
          queryClient.setQueryData(authKeys.permissions(), permissions);
        })
        .catch(() => setPermissions([]));
      
      toast.success('Welcome! Your account has been activated', { duration: 2000 });
      
      // Navigate to dashboard
      router.replace('/dashboard');
    },
    onError: (error: Error) => {
      console.error('[Accept Invite] Error:', error);
    },
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
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

/**
 * Create address mutation
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressRequest) => authService.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.addresses() });
      toast.success('Address added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add address');
    },
  });
}

/**
 * Update address mutation
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: UpdateAddressRequest }) =>
      authService.updateAddress(addressId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.addresses() });
      toast.success('Address updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update address');
    },
  });
}

/**
 * Delete address mutation
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => authService.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.addresses() });
      toast.success('Address deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });
}

// ============================================
// Auth Check Hook
// ============================================

/**
 * Check if user is authenticated
 * Use this in protected routes
 */
export function useAuthCheck() {
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useCurrentUser();

  return {
    isAuthenticated: !!user || !!data,
    isLoading,
    isError,
    user: user || data,
  };
}
