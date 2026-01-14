import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import RecipeHero from '../components/recipes/RecipeHero';
import RecipeIngredients from '../components/recipes/RecipeIngredients';
import RecipeSteps from '../components/recipes/RecipeSteps';
import RecipeForm from '../components/recipes/RecipeForm';
import Modal from '../components/shared/Modal';
import PortionAdjustmentModal from '../components/recipes/PortionAdjustmentModal';
import DeleteConfirmationModal from '../components/recipes/DeleteConfirmationModal';
import apiClient from '../services/apiClient';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import type { UpdateRecipeDto } from '@bmad/shared/types';

const tabs = [
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'notes', label: 'Notes' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: recipe, isLoading, error } = useRecipeDetail(id);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('ingredients');

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateRecipeDto) => {
      const response = await apiClient.put(`/api/recipes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      setShowEditModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/recipes/${id}`);
    },
    onSuccess: () => {
      navigate('/recipes');
    },
  });

  const handleApplyPortion = (multiplier: number) => {
    setPortionMultiplier(multiplier);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-text-muted">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-elevated p-6 text-center shadow-soft">
          <h2 className="text-xl font-semibold text-brand-error mb-2">
            Error loading recipe
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            {error instanceof Error ? error.message : 'Recipe not found'}
          </p>
          <button
            onClick={() => navigate('/recipes')}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse"
          >
            Back to recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/recipes')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <span aria-hidden="true">←</span> Back to recipes
      </button>

      <RecipeHero recipe={recipe} />

      <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Portions
            </p>
            <p className="text-sm text-text-secondary">
              Current multiplier: <span className="font-semibold">x{portionMultiplier}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPortionModal(true)}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
          >
            Adjust portions
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-elevated shadow-soft">
        <div
          className="flex flex-wrap gap-2 border-b border-border-subtle px-6 py-4"
          role="tablist"
          aria-label="Recipe detail tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-text-inverse'
                  : 'text-text-secondary hover:bg-surface-muted'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'ingredients' && (
            <RecipeIngredients
              ingredients={recipe.ingredients}
              servings={recipe.servings}
              adjustmentMultiplier={portionMultiplier}
            />
          )}
          {activeTab === 'instructions' && <RecipeSteps steps={recipe.steps} />}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Notes</h3>
              <p className="text-sm text-text-secondary">
                {recipe.description ||
                  'Add cooking notes or source details to keep your recipe organized.'}
              </p>
              <div className="rounded-xl border border-dashed border-border-subtle bg-surface-base p-4 text-xs text-text-muted">
                Tip: Use the edit action to add personal notes and tags.
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-3 shadow-soft lg:bottom-6">
        <div className="text-xs text-text-muted">
          Actions for {recipe.title}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-text-inverse"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/menu')}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
          >
            Add to menu
          </button>
          <button
            className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
          >
            Share
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-full border border-brand-error px-4 py-2 text-xs font-semibold text-brand-error"
          >
            Delete
          </button>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Recipe"
        size="xl"
      >
        <RecipeForm
          recipe={recipe}
          mode="edit"
          onSubmit={(data) => updateMutation.mutateAsync(data as UpdateRecipeDto)}
          onCancel={() => setShowEditModal(false)}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <PortionAdjustmentModal
        isOpen={showPortionModal}
        onClose={() => setShowPortionModal(false)}
        currentServings={recipe.servings}
        onApply={handleApplyPortion}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        recipeName={recipe.title}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
