import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import type { RecipeListResponse } from '@bmad/shared/types';

export interface RecipeFilters {
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'createdAt' | 'prepTime' | 'cookTime' | 'rating';
  sortOrder?: 'asc' | 'desc';
  tagIds?: string[];
  q?: string;
  maxTotalTime?: number;
}

export function useRecipes(filters: RecipeFilters = {}) {
  return useQuery<RecipeListResponse>({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add all filter parameters
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.tagIds && filters.tagIds.length > 0) {
        params.append('tagIds', filters.tagIds.join(','));
      }
      if (filters.q) params.append('q', filters.q);
      if (filters.maxTotalTime) {
        params.append('maxTotalTime', filters.maxTotalTime.toString());
      }

      const response = await apiClient.get<RecipeListResponse>(
        `/api/recipes?${params.toString()}`
      );
      return response.data;
    },
  });
}
