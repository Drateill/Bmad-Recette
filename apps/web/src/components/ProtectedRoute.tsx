import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isOnboardingComplete } from '../utils/onboarding';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowOnboarding?: boolean;
}

export default function ProtectedRoute({
  children,
  allowOnboarding = false,
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const onboardingComplete = isOnboardingComplete();
  if (
    !onboardingComplete &&
    !allowOnboarding &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
