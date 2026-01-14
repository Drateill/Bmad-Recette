import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import type { RecipeListItem, RecipeFilterOptions } from '@bmad/shared/types/recipe.types';

interface UseRecipesResult {
  recipes: RecipeListItem[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  hasMore: boolean;
  page: number;
  fetchRecipes: (filters?: RecipeFilterOptions) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing recipe list
 * Supports pagination, filtering, and pull-to-refresh
 */
export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<RecipeFilterOptions>({});

  const fetchRecipes = useCallback(
    async (filters: RecipeFilterOptions = {}, pageNum = 1, append = false) => {
      try {
        if (!append) {
          setLoading(true);
        }
        setError(null);

        const params = {
          ...filters,
          limit: 20,
          offset: (pageNum - 1) * 20,
        };

        const response = await apiClient.get('/recipes', { params });
        const { data, pagination } = response.data;

        setRecipes((prev) => (append ? [...prev, ...data] : data));
        setPage(pageNum);
        setHasMore(pageNum < pagination.totalPages);
        setCurrentFilters(filters);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch recipes');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes(currentFilters, 1, false);
  }, [currentFilters, fetchRecipes]);

  const loadMore = useCallback(async () => {
    if (!loading && !refreshing && hasMore) {
      await fetchRecipes(currentFilters, page + 1, true);
    }
  }, [loading, refreshing, hasMore, currentFilters, page, fetchRecipes]);

  // Initial load
  useEffect(() => {
    fetchRecipes();
  }, []);

  return {
    recipes,
    loading,
    error,
    refreshing,
    hasMore,
    page,
    fetchRecipes,
    refresh,
    loadMore,
  };
}
