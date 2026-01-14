import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getCurrentUser } from '../services/authService';
import { isOnboardingComplete } from '../utils/onboarding';

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAccessToken, setUser, clearAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Extract token from URL query param
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        setError('Authentication failed. No token received.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Store access token
        setAccessToken(token);

        // Fetch user profile
        const user = await getCurrentUser();
        setUser(user);

        // Remove token from URL (security)
        window.history.replaceState({}, document.title, '/auth/success');

        // Redirect to onboarding or recipes
        navigate(isOnboardingComplete() ? '/recipes' : '/onboarding', {
          replace: true,
        });
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError('Failed to complete authentication. Please try signing in with email/password.');
        clearAuth();
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setAccessToken, setUser, clearAuth]);

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        {error ? (
          <>
            <div className="rounded-xl border border-brand-error/40 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">
              {error}
            </div>
            <p className="text-sm text-text-muted">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"></div>
            <h2 className="text-xl font-semibold text-text-primary">Completing sign in...</h2>
            <p className="text-sm text-text-muted">
              Please wait while we set up your account.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
