import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeSteps from '../RecipeSteps';
import type { RecipeStep } from '@bmad/shared/types';

const mockSteps: RecipeStep[] = [
  {
    id: 'step-1',
    recipeId: 'recipe-1',
    stepNumber: 1,
    instruction: 'Preheat oven to 350°F',
    duration: 5,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'step-2',
    recipeId: 'recipe-1',
    stepNumber: 2,
    instruction: 'Mix dry ingredients',
    duration: 10,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'step-3',
    recipeId: 'recipe-1',
    stepNumber: 3,
    instruction: 'Serve and enjoy',
    duration: null,
    createdAt: new Date('2024-01-01'),
  },
];

describe('RecipeSteps', () => {
  it('renders all steps in order', () => {
    render(<RecipeSteps steps={mockSteps} />);

    expect(screen.getByText(/preheat oven to 350°F/i)).toBeInTheDocument();
    expect(screen.getByText(/mix dry ingredients/i)).toBeInTheDocument();
    expect(screen.getByText(/serve and enjoy/i)).toBeInTheDocument();
  });

  it('displays step numbers', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const stepNumbers = screen.getAllByText(/^[1-3]$/);
    expect(stepNumbers).toHaveLength(3);
  });

  it('displays duration when present', () => {
    render(<RecipeSteps steps={mockSteps} />);

    expect(screen.getByText(/5 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/10 minutes/i)).toBeInTheDocument();
  });

  it('does not display duration when null', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const durations = screen.queryAllByText(/minutes/i);
    expect(durations).toHaveLength(2);
  });

  it('has cooking mode toggle button', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const cookingModeButton = screen.getByRole('button', {
      name: /cooking mode/i,
    });
    expect(cookingModeButton).toBeInTheDocument();
  });

  it('enters cooking mode when button clicked', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const cookingModeButton = screen.getByRole('button', {
      name: /cooking mode/i,
    });
    fireEvent.click(cookingModeButton);

    expect(
      screen.getByRole('button', { name: /exit cooking mode/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('navigates between steps in cooking mode', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const cookingModeButton = screen.getByRole('button', {
      name: /cooking mode/i,
    });
    fireEvent.click(cookingModeButton);

    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();

    const previousButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(previousButton);

    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('disables previous button on first step', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const cookingModeButton = screen.getByRole('button', {
      name: /cooking mode/i,
    });
    fireEvent.click(cookingModeButton);

    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last step', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const cookingModeButton = screen.getByRole('button', {
      name: /cooking mode/i,
    });
    fireEvent.click(cookingModeButton);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
  });

  it('exits cooking mode', () => {
    render(<RecipeSteps steps={mockSteps} />);

    const cookingModeButton = screen.getByRole('button', {
      name: /cooking mode/i,
    });
    fireEvent.click(cookingModeButton);

    const exitButton = screen.getByRole('button', {
      name: /exit cooking mode/i,
    });
    fireEvent.click(exitButton);

    expect(
      screen.getByRole('button', { name: /^cooking mode$/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/step 1 of 3/i)).not.toBeInTheDocument();
  });

  it('displays message when no steps', () => {
    render(<RecipeSteps steps={[]} />);

    expect(
      screen.getByText(/no instructions available/i)
    ).toBeInTheDocument();
  });

  it('sorts steps by stepNumber', () => {
    const unsortedSteps: RecipeStep[] = [
      {
        id: 'step-3',
        recipeId: 'recipe-1',
        stepNumber: 3,
        instruction: 'Step Three',
        duration: null,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'step-1',
        recipeId: 'recipe-1',
        stepNumber: 1,
        instruction: 'Step One',
        duration: null,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'step-2',
        recipeId: 'recipe-1',
        stepNumber: 2,
        instruction: 'Step Two',
        duration: null,
        createdAt: new Date('2024-01-01'),
      },
    ];

    render(<RecipeSteps steps={unsortedSteps} />);

    const instructions = screen
      .getAllByText(/^Step (One|Two|Three)$/)
      .map((el) => el.textContent);

    expect(instructions[0]).toBe('Step One');
    expect(instructions[1]).toBe('Step Two');
    expect(instructions[2]).toBe('Step Three');
  });
});
