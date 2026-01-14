import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecipeDetail from '../RecipeDetail';
import * as useRecipeDetailHook from '../../hooks/useRecipeDetail';
import type { RecipeDetail as RecipeDetailType } from '@bmad/shared/types';

// Mock useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'recipe-123' }),
    useNavigate: () => vi.fn(),
  };
});

const mockRecipe: RecipeDetailType = {
  id: 'recipe-123',
  userId: 'user-1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  prepTime: 15,
  cookTime: 30,
  totalTime: 45,
  servings: 4,
  rating: 4,
  source: 'Test Kitchen',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  version: 1,
  ingredients: [
    {
      id: 'ing-1',
      recipeId: 'recipe-123',
      ingredientId: null,
      ingredientName: 'Flour',
      quantity: 2,
      unit: 'cups',
      notes: null,
      sortOrder: 1,
    },
  ],
  steps: [
    {
      id: 'step-1',
      recipeId: 'recipe-123',
      stepNumber: 1,
      instruction: 'Mix ingredients',
      duration: 5,
      createdAt: new Date('2024-01-01'),
    },
  ],
  photos: [
    {
      id: 'photo-1',
      recipeId: 'recipe-123',
      s3Url: 'https://example.com/photo.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      isPrimary: true,
      fileSize: 1024,
      width: 800,
      height: 600,
      uploadedAt: new Date('2024-01-01'),
    },
  ],
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('RecipeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.spyOn(useRecipeDetailHook, 'useRecipeDetail').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderWithProviders(<RecipeDetail />);

    expect(screen.getByText(/loading recipe/i)).toBeInTheDocument();
  });

  it('displays recipe details when loaded', async () => {
    vi.spyOn(useRecipeDetailHook, 'useRecipeDetail').mockReturnValue({
      data: mockRecipe,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<RecipeDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    expect(screen.getByText('A delicious test recipe')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Test Kitchen')).toBeInTheDocument();
  });

  it('displays error state when recipe fails to load', () => {
    vi.spyOn(useRecipeDetailHook, 'useRecipeDetail').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load recipe'),
    } as any);

    renderWithProviders(<RecipeDetail />);

    expect(screen.getByText(/error loading recipe/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to load recipe/i)).toBeInTheDocument();
  });

  it('displays recipe without optional fields', async () => {
    const recipeWithoutOptionals: RecipeDetailType = {
      ...mockRecipe,
      description: null,
      rating: null,
      source: null,
      photos: [],
    };

    vi.spyOn(useRecipeDetailHook, 'useRecipeDetail').mockReturnValue({
      data: recipeWithoutOptionals,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<RecipeDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    expect(screen.queryByText('A delicious test recipe')).not.toBeInTheDocument();
  });
});
