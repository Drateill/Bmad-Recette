import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getCurrentUser } from '../services/authService';

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

        // Redirect to recipes page
        navigate('/recipes', { replace: true });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center space-y-4">
        {error ? (
          <>
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
            <p className="text-sm text-gray-600">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-700">Completing sign in...</h2>
            <p className="text-sm text-gray-600">Please wait while we set up your account.</p>
          </>
        )}
      </div>
    </div>
  );
}
