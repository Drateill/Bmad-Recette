import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-brand-error/10 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-brand-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-text-secondary text-center mb-4">
              We encountered an error while loading this page. Please try
              refreshing or go back to the home page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                Refresh Page
              </button>
              <a
                href="/recipes"
                className="rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-border-subtle"
              >
                Go to Home
              </a>
            </div>
            {this.state.error && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-text-muted hover:text-text-primary">
                  Error details
                </summary>
                <pre className="mt-2 rounded bg-surface-muted p-2 text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
