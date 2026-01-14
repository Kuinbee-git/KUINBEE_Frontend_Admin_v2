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
  permissions: string[];
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setPermissions: (permissions: string[]) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      permissions: [],

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setPermissions: (permissions) => set({ permissions }),

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
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
