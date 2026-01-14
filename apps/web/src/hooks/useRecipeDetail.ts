import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import type { RecipeDetail } from '@bmad/shared/types';

export function useRecipeDetail(recipeId: string | undefined) {
  return useQuery<RecipeDetail>({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      if (!recipeId) {
        throw new Error('Recipe ID is required');
      }
      const response = await apiClient.get(`/api/recipes/${recipeId}`);
      return response.data;
    },
    enabled: !!recipeId,
  });
}
