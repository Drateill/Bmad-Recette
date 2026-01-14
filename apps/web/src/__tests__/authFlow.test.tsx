import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AuthSuccessPage from '../pages/AuthSuccessPage';
import RecipesPage from '../pages/RecipesPage';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuthStore } from '../stores/authStore';
import * as authService from '../services/authService';
import type { User } from '@bmad/shared/types/auth';
import { ThemeProvider } from '../context/ThemeContext';
import AppShell from '../components/layout/AppShell';

// Mock auth service
vi.mock('../services/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('../hooks/useRecipes', () => ({
  useRecipes: () => ({
    data: { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 } },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../hooks/useTagCategories', () => ({
  useTagCategories: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

// Helper to create complete mock user
const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastSyncedAt: new Date('2024-01-01'),
  ...overrides,
});

// Helper to wrap with QueryClient
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{component}</ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    window.localStorage.setItem('bmad-onboarding-complete', 'true');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow and redirect to onboarding', async () => {
      const mockResponse = {
        user: createMockUser({ email: 'newuser@example.com', firstName: 'Jane' }),
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      vi.mocked(authService.register).mockResolvedValue(mockResponse);

      renderWithQueryClient(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<div>Onboarding</div>} />
            <Route
              path="/recipes"
              element={
                <ProtectedRoute>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Fill out registration form
      const firstNameInput = screen.getByLabelText('First Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Wait for API call and navigation
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          'newuser@example.com',
          'Password123',
          'Jane'
        );
      });

      // Should redirect to onboarding
      await waitFor(() => {
        expect(screen.getByText(/Onboarding/i)).toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    it('should complete full login flow and redirect to recipes', async () => {
      const mockResponse = {
        user: createMockUser({ email: 'user@example.com' }),
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      vi.mocked(authService.login).mockResolvedValue(mockResponse);

      renderWithQueryClient(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/recipes"
              element={
                <ProtectedRoute>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Fill out login form
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in$/i });
      fireEvent.click(submitButton);

      // Wait for API call and navigation
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('user@example.com', 'Password123');
      });

      // Should redirect to recipes page
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Recipe Library' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Protected Route', () => {
    it('should redirect unauthenticated users to login', async () => {
      renderWithQueryClient(
        <MemoryRouter initialEntries={['/recipes']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/recipes"
              element={
                <ProtectedRoute>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should be redirected to login page
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });
    });

    it('should allow authenticated users to access protected routes', async () => {
      // Set authenticated state
      useAuthStore.setState({
        user: createMockUser({ email: 'user@example.com' }),
        accessToken: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      renderWithQueryClient(
        <MemoryRouter initialEntries={['/recipes']}>
          <Routes>
            <Route
              path="/recipes"
              element={
                <ProtectedRoute>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should see recipes page
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Recipe Library' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Callback Flow', () => {
    it('should extract token from URL, fetch user, and redirect', async () => {
      const mockUser = createMockUser({ email: 'oauth@example.com', firstName: 'OAuth' });
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      renderWithQueryClient(
        <MemoryRouter initialEntries={['/auth/success?token=oauth-token-123']}>
          <Routes>
            <Route path="/auth/success" element={<AuthSuccessPage />} />
            <Route
              path="/recipes"
              element={
                <ProtectedRoute>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show loading state initially
      expect(screen.getByText(/Completing sign in/i)).toBeInTheDocument();

      // Wait for user fetch and redirect
      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Recipe Library' })
        ).toBeInTheDocument();
      });
    });

    it('should handle missing token in OAuth callback', async () => {
      renderWithQueryClient(
        <MemoryRouter initialEntries={['/auth/success']}>
          <Routes>
            <Route path="/auth/success" element={<AuthSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Authentication failed. No token received./i)).toBeInTheDocument();
      });
    });

    it('should handle OAuth error parameter', async () => {
      renderWithQueryClient(
        <MemoryRouter initialEntries={['/auth/success?error=access_denied']}>
          <Routes>
            <Route path="/auth/success" element={<AuthSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Authentication failed. Please try again./i)).toBeInTheDocument();
      });
    });
  });

  describe('Logout Flow', () => {
    it('should clear auth state and redirect to login on logout', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      // Set authenticated state
      useAuthStore.setState({
        user: createMockUser({ email: 'user@example.com' }),
        accessToken: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      renderWithQueryClient(
        <MemoryRouter initialEntries={['/recipes']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/recipes" element={<RecipesPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /log out/i });
      fireEvent.click(logoutButton);

      // Wait for logout and redirect
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      });

      // Auth state should be cleared
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });
});
