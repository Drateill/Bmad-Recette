import { useCallback, useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import type { TagCategory } from '@bmad/shared/types/tag.types';

interface UseTagCategoriesResult {
  categories: TagCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetch tag categories with nested tags for filtering UI.
 */
export function useTagCategories(enabled: boolean): UseTagCategoriesResult {
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/tags/categories');
      setCategories(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchCategories();
    }
  }, [enabled, fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories,
  };
}
