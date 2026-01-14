import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import type { RecipeDetail } from '@bmad/shared/types/recipe.types';

interface UseRecipeDetailResult {
  recipe: RecipeDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for fetching a single recipe with full details
 * @param recipeId - The ID of the recipe to fetch
 */
export function useRecipeDetail(recipeId: string): UseRecipeDetailResult {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/recipes/${recipeId}`);
      setRecipe(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch recipe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]);

  return {
    recipe,
    loading,
    error,
    refresh: fetchRecipe,
  };
}
