import { create } from 'zustand';
import type { User } from '../types/auth';

/**
 * Authentication State Interface
 * Shared between web and mobile applications
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

/**
 * Create the base auth store
 * Note: login, register, logout, and refreshAccessToken implementations
 * are platform-specific and should be provided via dependency injection
 * or overridden in platform-specific implementations
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
    }),

  setAccessToken: (accessToken) =>
    set({ accessToken }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    }),

  // Placeholder implementations - to be overridden by platform-specific code
  login: async (_email: string, _password: string) => {
    throw new Error('login() must be implemented in platform-specific code');
  },

  register: async (_email: string, _password: string, _firstName: string) => {
    throw new Error('register() must be implemented in platform-specific code');
  },

  logout: async () => {
    throw new Error('logout() must be implemented in platform-specific code');
  },

  refreshAccessToken: async () => {
    throw new Error('refreshAccessToken() must be implemented in platform-specific code');
  },
}));
