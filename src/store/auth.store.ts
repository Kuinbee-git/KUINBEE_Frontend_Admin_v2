/**
 * Authentication Store (Zustand)
 * Global auth state management
 * Uses HTTP-only cookies for auth (no client-side tokens)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setPermissions: (permissions: string[]) => void;
  setLoading: (loading: boolean) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
  
  /** @deprecated Token auth not used - kept for backward compatibility */
  token: string | null;
  /** @deprecated */
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),
      
      setPermissions: (permissions) => set({ permissions }),
      
      setLoading: (isLoading) => set({ isLoading }),

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          permissions: [],
        }),
    }),
    {
      name: 'kuinbee-auth-storage',
      partialize: (state) => ({ 
        // Only persist user, not loading states
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
    }
  )
);
