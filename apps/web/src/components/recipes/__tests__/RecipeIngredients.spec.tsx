import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeIngredients from '../RecipeIngredients';
import type { RecipeIngredient } from '@bmad/shared/types';

const mockIngredients: RecipeIngredient[] = [
  {
    id: 'ing-1',
    recipeId: 'recipe-1',
    ingredientId: 'ingredient-1',
    ingredientName: 'Flour',
    quantity: 2,
    unit: 'cups',
    notes: null,
    sortOrder: 1,
  },
  {
    id: 'ing-2',
    recipeId: 'recipe-1',
    ingredientId: 'ingredient-2',
    ingredientName: 'Sugar',
    quantity: 1,
    unit: 'cup',
    notes: 'Granulated',
    sortOrder: 2,
  },
  {
    id: 'ing-3',
    recipeId: 'recipe-1',
    ingredientId: null,
    ingredientName: 'Salt',
    quantity: 0.5,
    unit: 'tsp',
    notes: null,
    sortOrder: 3,
  },
];

describe('RecipeIngredients', () => {
  it('renders all ingredients in order', () => {
    render(
      <RecipeIngredients ingredients={mockIngredients} servings={4} />
    );

    expect(screen.getByText(/2.00 cups/)).toBeInTheDocument();
    expect(screen.getByText(/flour/i)).toBeInTheDocument();
    expect(screen.getByText(/1.00 cup/)).toBeInTheDocument();
    expect(screen.getByText(/sugar/i)).toBeInTheDocument();
    expect(screen.getByText(/0.50 tsp/)).toBeInTheDocument();
    expect(screen.getByText(/salt/i)).toBeInTheDocument();
  });

  it('displays ingredient notes when present', () => {
    render(
      <RecipeIngredients ingredients={mockIngredients} servings={4} />
    );

    expect(screen.getByText('Granulated')).toBeInTheDocument();
  });

  it('displays serving count', () => {
    render(
      <RecipeIngredients ingredients={mockIngredients} servings={4} />
    );

    expect(screen.getByText(/for 4 servings/i)).toBeInTheDocument();
  });

  it('allows checking and unchecking ingredients', () => {
    render(
      <RecipeIngredients ingredients={mockIngredients} servings={4} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];

    expect(firstCheckbox).not.toBeChecked();

    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();

    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).not.toBeChecked();
  });

  it('applies strikethrough styling to checked ingredients', () => {
    render(
      <RecipeIngredients ingredients={mockIngredients} servings={4} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    const firstIngredientLabel = firstCheckbox.parentElement?.querySelector('span');

    expect(firstIngredientLabel).not.toHaveClass('line-through');

    fireEvent.click(firstCheckbox);
    expect(firstIngredientLabel).toHaveClass('line-through');
  });

  it('adjusts quantities based on multiplier', () => {
    render(
      <RecipeIngredients
        ingredients={mockIngredients}
        servings={4}
        adjustmentMultiplier={2}
      />
    );

    expect(screen.getByText(/4.00 cups/)).toBeInTheDocument();
    expect(screen.getByText(/2.00 cup/)).toBeInTheDocument();
    expect(screen.getByText(/1.00 tsp/)).toBeInTheDocument();
    expect(screen.getByText(/for 8 servings/i)).toBeInTheDocument();
  });

  it('displays message when no ingredients', () => {
    render(<RecipeIngredients ingredients={[]} servings={4} />);

    expect(screen.getByText(/no ingredients listed/i)).toBeInTheDocument();
  });

  it('sorts ingredients by sortOrder', () => {
    const unsortedIngredients: RecipeIngredient[] = [
      {
        id: 'ing-3',
        recipeId: 'recipe-1',
        ingredientId: null,
        ingredientName: 'Salt',
        quantity: 0.5,
        unit: 'tsp',
        notes: null,
        sortOrder: 3,
      },
      {
        id: 'ing-1',
        recipeId: 'recipe-1',
        ingredientId: 'ingredient-1',
        ingredientName: 'Flour',
        quantity: 2,
        unit: 'cups',
        notes: null,
        sortOrder: 1,
      },
      {
        id: 'ing-2',
        recipeId: 'recipe-1',
        ingredientId: 'ingredient-2',
        ingredientName: 'Sugar',
        quantity: 1,
        unit: 'cup',
        notes: null,
        sortOrder: 2,
      },
    ];

    render(
      <RecipeIngredients ingredients={unsortedIngredients} servings={4} />
    );

    const labels = screen
      .getAllByRole('checkbox')
      .map((cb) => cb.parentElement?.textContent || '');

    expect(labels[0]).toContain('Flour');
    expect(labels[1]).toContain('Sugar');
    expect(labels[2]).toContain('Salt');
  });
});
