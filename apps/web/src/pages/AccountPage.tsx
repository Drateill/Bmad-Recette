import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/shared/ThemeToggle';
import { resetOnboarding, setOnboardingComplete } from '../utils/onboarding';

export default function AccountPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Account</p>
          <h3 className="text-2xl font-semibold text-text-primary">Your settings</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Manage appearance, onboarding, and data preferences.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
          <h4 className="text-lg font-semibold text-text-primary">Appearance</h4>
          <p className="mt-2 text-sm text-text-secondary">
            Choose light, dark, or automatic theme syncing.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
          <h4 className="text-lg font-semibold text-text-primary">Onboarding</h4>
          <p className="mt-2 text-sm text-text-secondary">
            Revisit the guided setup or reset your progress anytime.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                resetOnboarding();
                navigate('/onboarding');
              }}
              className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse"
            >
              Start onboarding
            </button>
            <button
              type="button"
              onClick={() => {
                setOnboardingComplete();
                navigate('/recipes');
              }}
              className="rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary"
            >
              Skip for now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
