import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../schemas/authSchemas';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuthStore();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      const from = (location.state as any)?.from?.pathname || '/recipes';
      navigate(from, { replace: true });
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-surface-base px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
            BMad Recette
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text-primary">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Your personal recipe management solution
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-xl border border-brand-error/40 bg-brand-error/10 px-4 py-3 text-sm text-brand-error">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 block w-full rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-text-primary shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-brand-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1 block w-full rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-text-primary shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-brand-error">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
              <span className="bg-surface-base px-2 text-text-muted">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/auth/google`;
              }}
              className="inline-flex w-full items-center justify-center rounded-full border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-muted"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="ml-2">Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/auth/apple`;
              }}
              className="inline-flex w-full items-center justify-center rounded-full border border-border-subtle bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="ml-2">Apple</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-primary">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
