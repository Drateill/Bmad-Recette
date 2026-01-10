import { useAuthStore } from '@bmad/shared/stores/authStore';
import { initializeAuth } from '../useAuth';
import * as authService from '../../services/authService';
import * as SecureStorage from '../../utils/secureStorage';

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../utils/secureStorage');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockSecureStorage = SecureStorage as jest.Mocked<typeof SecureStorage>;

describe('useAuth - Mobile Auth Store Implementation', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mobile-specific auth implementations
    initializeAuth();
  });

  describe('login', () => {
    it('should successfully login and store tokens', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      };

      const mockTokens = {
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockAuthService.login.mockResolvedValue(mockTokens);
      mockSecureStorage.setTokens.mockResolvedValue(undefined);

      const store = useAuthStore.getState();
      await store.login('test@example.com', 'password123');

      // Verify API was called
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');

      // Verify tokens were stored securely
      expect(mockSecureStorage.setTokens).toHaveBeenCalledWith(
        'mock-access-token',
        'mock-refresh-token'
      );

      // Verify store state
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('mock-access-token');
      expect(state.refreshToken).toBe('mock-refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle login failure and set error', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };

      mockAuthService.login.mockRejectedValue(errorResponse);

      const store = useAuthStore.getState();

      await expect(store.login('test@example.com', 'wrong-password')).rejects.toEqual(
        errorResponse
      );

      // Verify error was set
      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.isLoading).toBe(false);

      // Verify tokens were NOT stored
      expect(mockSecureStorage.setTokens).not.toHaveBeenCalled();
    });

    it('should handle network error with fallback message', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      const store = useAuthStore.getState();

      await expect(store.login('test@example.com', 'password123')).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.error).toBe('Login failed');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should successfully register and store tokens', async () => {
      const mockUser = {
        id: '456',
        email: 'newuser@example.com',
        firstName: 'New',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      };

      const mockTokens = {
        user: mockUser,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.register.mockResolvedValue(mockTokens);
      mockSecureStorage.setTokens.mockResolvedValue(undefined);

      const store = useAuthStore.getState();
      await store.register('newuser@example.com', 'password123', 'New');

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        'New'
      );

      expect(mockSecureStorage.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle registration failure', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Email already exists',
          },
        },
      };

      mockAuthService.register.mockRejectedValue(errorResponse);

      const store = useAuthStore.getState();

      await expect(
        store.register('existing@example.com', 'password123', 'Test')
      ).rejects.toEqual(errorResponse);

      const state = useAuthStore.getState();
      expect(state.error).toBe('Email already exists');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should successfully logout and clear tokens', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });

      mockAuthService.logout.mockResolvedValue(undefined);
      mockSecureStorage.clearTokens.mockResolvedValue(undefined);

      const store = useAuthStore.getState();
      await store.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockSecureStorage.clearTokens).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear tokens even if API call fails', async () => {
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });

      mockAuthService.logout.mockRejectedValue(new Error('Network error'));
      mockSecureStorage.clearTokens.mockResolvedValue(undefined);

      const store = useAuthStore.getState();
      await store.logout();

      // Tokens should still be cleared
      expect(mockSecureStorage.clearTokens).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      mockSecureStorage.getRefreshToken.mockResolvedValue('old-refresh-token');
      mockAuthService.refreshAccessToken.mockResolvedValue({
        accessToken: 'new-access-token',
      });
      mockSecureStorage.setAccessToken.mockResolvedValue(undefined);

      const store = useAuthStore.getState();
      await store.refreshAccessToken();

      expect(mockSecureStorage.getRefreshToken).toHaveBeenCalled();
      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith('old-refresh-token');
      expect(mockSecureStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access-token');
    });

    it('should clear auth if no refresh token available', async () => {
      mockSecureStorage.getRefreshToken.mockResolvedValue(null);
      mockSecureStorage.clearTokens.mockResolvedValue(undefined);

      const store = useAuthStore.getState();

      await expect(store.refreshAccessToken()).rejects.toThrow('No refresh token available');

      expect(mockSecureStorage.clearTokens).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear auth if refresh fails', async () => {
      mockSecureStorage.getRefreshToken.mockResolvedValue('invalid-token');
      mockAuthService.refreshAccessToken.mockRejectedValue(new Error('Invalid token'));
      mockSecureStorage.clearTokens.mockResolvedValue(undefined);

      const store = useAuthStore.getState();

      await expect(store.refreshAccessToken()).rejects.toThrow();

      expect(mockSecureStorage.clearTokens).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
