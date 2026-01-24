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
      permissions: [],

      setUser: (user) => set({ user }),
      
      setPermissions: (permissions) => set({ permissions }),

      login: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          permissions: [],
        }),
    }),
    {
      name: 'kuinbee-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        permissions: state.permissions,
      }),
      skipHydration: false,
    }
  )
);
