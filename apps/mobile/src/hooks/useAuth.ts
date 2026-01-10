import { useEffect } from 'react';
import { useAuthStore } from '@bmad/shared/stores/authStore';
import * as authService from '../services/authService';
import * as SecureStorage from '../utils/secureStorage';

/**
 * Initialize mobile-specific auth store implementations
 * This hook sets up the platform-specific login, register, logout, and refresh implementations
 */
export function initializeAuth() {
  const store = useAuthStore.getState();

  // Override login with mobile implementation
  store.login = async (email: string, password: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const { user, accessToken, refreshToken } = await authService.login(email, password);

      // Store tokens securely
      await SecureStorage.setTokens(accessToken, refreshToken);

      // Update store
      store.setUser(user);
      store.setTokens(accessToken, refreshToken);
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed';
      store.setError(errorMessage);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  // Override register with mobile implementation
  store.register = async (email: string, password: string, firstName: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const { user, accessToken, refreshToken } = await authService.register(
        email,
        password,
        firstName
      );

      // Store tokens securely
      await SecureStorage.setTokens(accessToken, refreshToken);

      // Update store
      store.setUser(user);
      store.setTokens(accessToken, refreshToken);
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed';
      store.setError(errorMessage);
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  // Override logout with mobile implementation
  store.logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens and state regardless of API result
      await SecureStorage.clearTokens();
      store.clearAuth();
    }
  };

  // Override refreshAccessToken with mobile implementation
  store.refreshAccessToken = async () => {
    try {
      const refreshToken = await SecureStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { accessToken } = await authService.refreshAccessToken(refreshToken);
      
      await SecureStorage.setAccessToken(accessToken);
      store.setAccessToken(accessToken);
    } catch (error) {
      // Refresh failed, clear auth
      await SecureStorage.clearTokens();
      store.clearAuth();
      throw error;
    }
  };
}

/**
 * Hook to restore auth state on app start
 */
export function useAuthRestore() {
  useEffect(() => {
    async function restoreAuth() {
      try {
        const accessToken = await SecureStorage.getAccessToken();
        const refreshToken = await SecureStorage.getRefreshToken();

        if (accessToken && refreshToken) {
          // Set tokens in store first (needed for API call)
          useAuthStore.getState().setTokens(accessToken, refreshToken);

          // Fetch user profile to validate tokens and restore user state
          try {
            const user = await authService.getProfile();
            useAuthStore.getState().setUser(user);
          } catch (profileError) {
            // Tokens are invalid or expired, clear them
            console.error('Failed to fetch profile, tokens invalid:', profileError);
            await SecureStorage.clearTokens();
            useAuthStore.getState().clearAuth();
          }
        }
      } catch (error) {
        console.error('Failed to restore auth:', error);
        await SecureStorage.clearTokens();
        useAuthStore.getState().clearAuth();
      }
    }

    restoreAuth();
  }, []);
}
