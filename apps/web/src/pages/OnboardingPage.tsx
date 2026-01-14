import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getOnboardingProgress,
  isOnboardingComplete,
  setOnboardingComplete,
  setOnboardingProgress,
} from '../utils/onboarding';

const steps = [
  {
    id: 1,
    title: 'Welcome to BMad Recette',
    description: 'Plan meals, manage recipes, and shop smarter in under 5 minutes.',
  },
  {
    id: 2,
    title: 'Choose your primary goal',
    description: 'We will tailor your experience based on what matters most.',
  },
  {
    id: 3,
    title: 'Add your first recipe',
    description: 'Start with a quick entry, scan, or skip for now.',
  },
  {
    id: 4,
    title: 'Quick feature tour',
    description: 'Meet the core areas you will use every week.',
  },
];

const goalOptions = [
  { id: 'save-time', title: 'Save time', detail: 'Generate menus in minutes.' },
  { id: 'reduce-waste', title: 'Reduce waste', detail: 'Use ingredients you already have.' },
  { id: 'organize', title: 'Organize recipes', detail: 'Digitize your recipe collection.' },
];

const entryOptions = [
  { id: 'manual', title: 'Manual entry', detail: 'Type in a recipe quickly.' },
  { id: 'scan', title: 'Scan a recipe', detail: 'Capture a photo for OCR.' },
  { id: 'skip', title: 'Skip for now', detail: 'Load sample recipes instead.' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const storedProgress = useMemo(getOnboardingProgress, []);
  const [step, setStep] = useState(storedProgress.step || 1);
  const [goal, setGoal] = useState(storedProgress.goal || 'save-time');
  const [entryChoice, setEntryChoice] = useState(
    storedProgress.firstRecipeChoice || 'manual'
  );

  useEffect(() => {
    if (isOnboardingComplete()) {
      navigate('/recipes', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    setOnboardingProgress({ step, goal, firstRecipeChoice: entryChoice });
  }, [step, goal, entryChoice]);

  const currentStep = steps.find((item) => item.id === step) || steps[0];

  const handleNext = () => {
    if (step < steps.length) {
      setStep((prev) => prev + 1);
      return;
    }
    setOnboardingComplete();
    navigate('/recipes');
  };

  const handleSkip = () => {
    setOnboardingComplete();
    navigate('/recipes');
  };

  return (
    <div className="min-h-screen bg-surface-base px-4 py-10 text-text-primary">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">
              Onboarding
            </p>
            <h1 className="text-3xl font-semibold">{currentStep.title}</h1>
            <p className="mt-2 text-sm text-text-secondary">
              {currentStep.description}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
          >
            Skip
          </button>
        </div>

        <div className="flex gap-2">
          {steps.map((item) => (
            <span
              key={item.id}
              className={`h-2 flex-1 rounded-full ${
                item.id <= step ? 'bg-brand-primary' : 'bg-surface-muted'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
            <p className="text-sm text-text-secondary">
              In the next few screens, we will personalize your dashboard and show you
              how to build menus, discover recipes, and keep shopping lists in sync.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border-subtle bg-surface-base p-4">
                <p className="text-sm font-semibold">5-minute setup</p>
                <p className="mt-1 text-xs text-text-muted">
                  Finish onboarding quickly and start cooking today.
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-base p-4">
                <p className="text-sm font-semibold">Personalized flows</p>
                <p className="mt-1 text-xs text-text-muted">
                  Tailor the home screen based on your goals.
                </p>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="grid gap-4 md:grid-cols-3">
            {goalOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setGoal(option.id)}
                className={`rounded-2xl border px-5 py-6 text-left transition-transform duration-base ${
                  goal === option.id
                    ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                    : 'border-border-subtle bg-surface-elevated text-text-secondary'
                }`}
              >
                <p className="text-sm font-semibold">{option.title}</p>
                <p className="mt-2 text-xs text-text-muted">{option.detail}</p>
              </button>
            ))}
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-4 md:grid-cols-3">
            {entryOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setEntryChoice(option.id)}
                className={`rounded-2xl border px-5 py-6 text-left transition-transform duration-base ${
                  entryChoice === option.id
                    ? 'border-brand-secondary bg-brand-secondary/10 text-text-primary'
                    : 'border-border-subtle bg-surface-elevated text-text-secondary'
                }`}
              >
                <p className="text-sm font-semibold">{option.title}</p>
                <p className="mt-2 text-xs text-text-muted">{option.detail}</p>
              </button>
            ))}
            <div className="md:col-span-3 rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-sm text-text-secondary">
              Tip: You can always add recipes later from the + button in the library.
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="grid gap-4 md:grid-cols-2">
            {['My Recipes', 'Discover', 'Menu Planner', 'Shopping Lists'].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-border-subtle bg-surface-elevated p-5"
              >
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-2 text-xs text-text-muted">
                  {label === 'My Recipes' && 'Organize, tag, and edit your collection.'}
                  {label === 'Discover' && 'Find matches based on ingredients you have.'}
                  {label === 'Menu Planner' && 'Generate weekly menus with balance.'}
                  {label === 'Shopping Lists' && 'Track progress and share with others.'}
                </p>
              </div>
            ))}
          </section>
        )}

        <div className="flex flex-wrap justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            className="rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary"
            disabled={step === 1}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-text-inverse"
          >
            {step === steps.length ? 'Finish onboarding' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
