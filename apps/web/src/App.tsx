import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import { ThemeProvider } from './context/ThemeContext';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AuthSuccessPage = lazy(() => import('./pages/AuthSuccessPage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const RecipeCreatePage = lazy(() => import('./pages/RecipeCreatePage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const MenuPlannerPage = lazy(() => import('./pages/MenuPlannerPage'));
const ShoppingListsPage = lazy(() => import('./pages/ShoppingListsPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Suspense
            fallback={(
              <div className="min-h-screen bg-surface-base flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"></div>
              </div>
            )}
          >
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/success" element={<AuthSuccessPage />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute allowOnboarding>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/recipes" replace />} />
              <Route
                path="/recipes"
                element={
                  <ErrorBoundary>
                    <RecipesPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/recipes/new"
                element={
                  <ErrorBoundary>
                    <RecipeCreatePage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/recipes/:id"
                element={
                  <ErrorBoundary>
                    <RecipeDetail />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/discover"
                element={
                  <ErrorBoundary>
                    <DiscoverPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/menu"
                element={
                  <ErrorBoundary>
                    <MenuPlannerPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/shopping"
                element={
                  <ErrorBoundary>
                    <ShoppingListsPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/account"
                element={
                  <ErrorBoundary>
                    <AccountPage />
                  </ErrorBoundary>
                }
              />
            </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
