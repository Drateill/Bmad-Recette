import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/authService';
import type { User } from '@bmad/shared/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, accessToken } = await authService.login(email, password);
          // Cast response user to User type (API returns partial user, add defaults for missing fields)
          const now = new Date();
          const fullUser: User = {
            ...user,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: now,
          };
          set({ user: fullUser, accessToken, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, firstName: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, accessToken } = await authService.register(email, password, firstName);
          // Cast response user to User type (API returns partial user, add defaults for missing fields)
          const fullUser: User = {
            ...user,
            updatedAt: user.createdAt,
            lastSyncedAt: user.createdAt,
          };
          set({ user: fullUser, accessToken, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ user: null, accessToken: null, isAuthenticated: false, error: null });
        }
      },

      refreshAccessToken: async () => {
        try {
          const { accessToken } = await authService.refreshAccessToken();
          set({ accessToken, isAuthenticated: true });
        } catch (error) {
          set({ user: null, accessToken: null, isAuthenticated: false });
          throw error;
        }
      },

      setAccessToken: (token: string) => {
        set({ accessToken: token, isAuthenticated: true });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, isAuthenticated: false, error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user, NOT tokens
    }
  )
);
