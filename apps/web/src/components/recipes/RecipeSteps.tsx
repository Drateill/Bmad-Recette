import { useState } from 'react';
import type { RecipeStep } from '@bmad/shared/types';

interface RecipeStepsProps {
  steps: RecipeStep[];
}

export default function RecipeSteps({ steps }: RecipeStepsProps) {
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  const toggleCookingMode = () => {
    if (currentStep === null) {
      setCurrentStep(1);
    } else {
      setCurrentStep(null);
    }
  };

  const nextStep = () => {
    if (currentStep !== null && currentStep < sortedSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep !== null && currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold text-text-primary">Instructions</h2>
        <button
          onClick={toggleCookingMode}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            currentStep !== null
              ? 'bg-brand-primary text-text-inverse hover:bg-brand-primary-dark'
              : 'bg-surface-muted text-text-secondary hover:bg-surface-elevated'
          }`}
        >
          {currentStep !== null ? 'Exit Cooking Mode' : 'Cooking Mode'}
        </button>
      </div>

      {currentStep !== null && (
        <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              Step {currentStep} of {sortedSteps.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={previousStep}
                disabled={currentStep === 1}
                className="rounded-full border border-border-subtle px-3 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === sortedSteps.length}
                className="rounded-full border border-border-subtle px-3 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <ol className="space-y-4">
        {sortedSteps.map((step) => {
          const isCurrentStep = currentStep === step.stepNumber;
          const isCompleted = currentStep !== null && currentStep > step.stepNumber;

          return (
            <li
              key={step.id}
              className={`flex gap-4 rounded-xl border border-border-subtle p-4 transition-colors ${
                isCurrentStep
                  ? 'bg-brand-primary/10 border-brand-primary'
                : isCompleted
                ? 'bg-surface-muted opacity-60'
                : 'bg-surface-base'
              }`}
            >
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                  isCurrentStep
                    ? 'bg-brand-primary text-text-inverse'
                    : isCompleted
                    ? 'bg-brand-success text-text-inverse'
                    : 'bg-surface-muted text-text-secondary'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.stepNumber
                )}
              </div>

              <div className="flex-1">
                <p
                  className={`text-text-secondary ${
                    isCurrentStep ? 'font-semibold text-lg text-text-primary' : ''
                  }`}
                >
                  {step.instruction}
                </p>
                {step.duration !== null && (
                  <p className="mt-2 text-xs text-text-muted">
                    <svg
                      className="inline w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {step.duration} minutes
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {sortedSteps.length === 0 && (
        <p className="text-text-muted text-center py-4">
          No instructions available
        </p>
      )}
    </div>
  );
}
