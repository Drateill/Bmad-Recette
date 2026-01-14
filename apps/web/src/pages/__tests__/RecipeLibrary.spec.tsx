import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecipeLibrary from '../RecipeLibrary';
import * as useRecipesHook from '../../hooks/useRecipes';
import * as useTagCategoriesHook from '../../hooks/useTagCategories';

// Mock the hooks
vi.mock('../../hooks/useRecipes');
vi.mock('../../hooks/useTagCategories');
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { firstName: 'Test', id: 'test-user-id' },
    logout: vi.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('RecipeLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recipe library page', () => {
    vi.spyOn(useRecipesHook, 'useRecipes').mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useTagCategoriesHook, 'useTagCategories').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<RecipeLibrary />);

    expect(screen.getByText('Recipe Library')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument();
  });

  it('displays empty state when no recipes', () => {
    vi.spyOn(useRecipesHook, 'useRecipes').mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useTagCategoriesHook, 'useTagCategories').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<RecipeLibrary />);

    expect(screen.getByText('Start your recipe library')).toBeInTheDocument();
    expect(screen.getByText('Create your first recipe')).toBeInTheDocument();
  });

  it('displays recipes in grid view', async () => {
    const mockRecipes = [
      {
        id: '1',
        title: 'Test Recipe 1',
        description: 'Description 1',
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        servings: 4,
        rating: 4.5,
        primaryPhoto: null,
        tagIds: [],
      },
      {
        id: '2',
        title: 'Test Recipe 2',
        description: 'Description 2',
        prepTime: 15,
        cookTime: 25,
        totalTime: 40,
        servings: 6,
        rating: 5,
        primaryPhoto: null,
        tagIds: [],
      },
    ];

    vi.spyOn(useRecipesHook, 'useRecipes').mockReturnValue({
      data: {
        data: mockRecipes,
        pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useTagCategoriesHook, 'useTagCategories').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<RecipeLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe 1')).toBeInTheDocument();
      expect(screen.getByText('Test Recipe 2')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    vi.spyOn(useRecipesHook, 'useRecipes').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.spyOn(useTagCategoriesHook, 'useTagCategories').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<RecipeLibrary />);

    expect(screen.getByText('Loading recipes...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    vi.spyOn(useRecipesHook, 'useRecipes').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    vi.spyOn(useTagCategoriesHook, 'useTagCategories').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<RecipeLibrary />);

    expect(
      screen.getByText('Failed to load recipes. Please try again.')
    ).toBeInTheDocument();
  });
});
