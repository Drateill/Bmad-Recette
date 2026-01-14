import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import type { TagCategory } from '@bmad/shared/types';

export function useTagCategories() {
  return useQuery<TagCategory[]>({
    queryKey: ['tagCategories'],
    queryFn: async () => {
      const response = await apiClient.get<TagCategory[]>('/api/tag-categories');
      return response.data;
    },
    staleTime: Infinity, // Categories don't change often
  });
}
