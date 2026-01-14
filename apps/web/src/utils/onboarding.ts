const ONBOARDING_COMPLETE_KEY = 'bmad-onboarding-complete';
const ONBOARDING_PROGRESS_KEY = 'bmad-onboarding-progress';

export interface OnboardingProgress {
  step: number;
  goal?: string;
  firstRecipeChoice?: string;
}

export const isOnboardingComplete = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
};

export const setOnboardingComplete = () => {
  window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  window.localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
};

export const resetOnboarding = () => {
  window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  window.localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
};

export const getOnboardingProgress = (): OnboardingProgress => {
  if (typeof window === 'undefined') {
    return { step: 1 };
  }

  const stored = window.localStorage.getItem(ONBOARDING_PROGRESS_KEY);
  if (!stored) {
    return { step: 1 };
  }

  try {
    return JSON.parse(stored) as OnboardingProgress;
  } catch {
    return { step: 1 };
  }
};

export const setOnboardingProgress = (progress: OnboardingProgress) => {
  window.localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(progress));
};
