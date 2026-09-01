/**
 * Authentication Store (Zustand)
 * Global auth state management
 * Uses HTTP-only cookies for auth (no client-side tokens)
 */

import { create } from 'zustand';
import type { AuthUser } from '@/types';
import { normalizePermissions, type Permission } from '@/lib/constants/permissions';

interface AuthState {
  user: AuthUser | null;
  permissions: Permission[];

  // Actions
  setUser: (user: AuthUser | null) => void;
  setPermissions: (permissions: Permission[]) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  permissions: [],

  // Authentication is recovered only from the HTTP-only session cookie.
  // Persisting identity claims creates a stale, misleading shell after expiry.
  setUser: (user) => set(user ? { user } : { user: null, permissions: [] }),

  setPermissions: (permissions) => set({ permissions: normalizePermissions(permissions) }),

  login: (user) => set({ user }),

  logout: () =>
    set({
      user: null,
      permissions: [],
    }),
}));
