import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import RecipeForm from '../components/recipes/RecipeForm';
import apiClient from '../services/apiClient';
import type { CreateRecipeDto, RecipeDetail } from '@bmad/shared/types';

export default function RecipeCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CreateRecipeDto) => {
      const response = await apiClient.post('/api/recipes', data);
      return response.data as RecipeDetail;
    },
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      if (recipe?.id) {
        navigate(`/recipes/${recipe.id}`);
        return;
      }
      navigate('/recipes');
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Create Recipe
            </p>
            <h3 className="text-2xl font-semibold text-text-primary">
              Add a new recipe
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Start with essentials and add ingredients and steps later.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/recipes')}
            className="rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-muted"
          >
            Back to library
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <RecipeForm
          mode="create"
          onSubmit={(data) => createMutation.mutateAsync(data as CreateRecipeDto)}
          onCancel={() => navigate('/recipes')}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  );
}
