import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecipeCard from '../RecipeCard';
import type { RecipeListItem } from '@bmad/shared/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockRecipe: RecipeListItem = {
  id: '123',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  prepTime: 10,
  cookTime: 20,
  totalTime: 30,
  servings: 4,
  rating: 4.5,
  primaryPhoto: null,
  tagIds: [],
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RecipeCard', () => {
  it('renders recipe card in grid view', () => {
    renderWithRouter(
      <RecipeCard recipe={mockRecipe} viewMode="grid" tags={[]} />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('A delicious test recipe')).toBeInTheDocument();
    expect(screen.getByText(/30 min/)).toBeInTheDocument();
    expect(screen.getByText('🍽️ 4')).toBeInTheDocument();
  });

  it('renders recipe card in list view', () => {
    renderWithRouter(
      <RecipeCard recipe={mockRecipe} viewMode="list" tags={[]} />
    );

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('A delicious test recipe')).toBeInTheDocument();
    expect(screen.getByText(/Total: 30 min/)).toBeInTheDocument();
    expect(screen.getByText(/Servings: 4/)).toBeInTheDocument();
  });

  it('navigates to recipe detail on click', () => {
    renderWithRouter(
      <RecipeCard recipe={mockRecipe} viewMode="grid" tags={[]} />
    );

    const card = screen.getByText('Test Recipe').closest('div')?.parentElement;
    if (card) {
      fireEvent.click(card);
    }

    expect(mockNavigate).toHaveBeenCalledWith('/recipes/123');
  });

  it('displays rating', () => {
    renderWithRouter(
      <RecipeCard recipe={mockRecipe} viewMode="grid" tags={[]} />
    );

    expect(screen.getByText('(4.5)')).toBeInTheDocument();
  });

  it('displays no rating when rating is null', () => {
    const recipeWithoutRating = { ...mockRecipe, rating: null };
    renderWithRouter(
      <RecipeCard recipe={recipeWithoutRating} viewMode="grid" tags={[]} />
    );

    expect(screen.getByText('No rating')).toBeInTheDocument();
  });

  it('displays tags', () => {
    const tags = [
      { id: '1', name: 'Vegetarian', color: '#22c55e' },
      { id: '2', name: 'Quick', color: '#3b82f6' },
    ];

    renderWithRouter(
      <RecipeCard recipe={mockRecipe} viewMode="grid" tags={tags} />
    );

    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Quick')).toBeInTheDocument();
  });
});
