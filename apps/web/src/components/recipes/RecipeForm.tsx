import { useState } from 'react';
import type { CreateRecipeDto, RecipeDetail, UpdateRecipeDto } from '@bmad/shared/types';

interface RecipeFormProps {
  recipe?: RecipeDetail;
  mode?: 'create' | 'edit';
  onSubmit: (data: CreateRecipeDto | UpdateRecipeDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RecipeForm({
  recipe,
  mode = recipe ? 'edit' : 'create',
  onSubmit,
  onCancel,
  isLoading = false,
}: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [prepTime, setPrepTime] = useState(recipe?.prepTime.toString() || '');
  const [cookTime, setCookTime] = useState(recipe?.cookTime.toString() || '');
  const [servings, setServings] = useState(recipe?.servings.toString() || '');
  const [source, setSource] = useState(recipe?.source || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    const prepTimeNum = parseInt(prepTime);
    if (isNaN(prepTimeNum) || prepTimeNum < 0) {
      newErrors.prepTime = 'Prep time must be a positive number';
    }

    const cookTimeNum = parseInt(cookTime);
    if (isNaN(cookTimeNum) || cookTimeNum < 0) {
      newErrors.cookTime = 'Cook time must be a positive number';
    }

    const servingsNum = parseInt(servings);
    if (isNaN(servingsNum) || servingsNum < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (mode === 'edit') {
      if (!recipe) {
        return;
      }

      const updateData: UpdateRecipeDto = {
        title,
        description: description.trim() || null,
        prepTime: parseInt(prepTime),
        cookTime: parseInt(cookTime),
        servings: parseInt(servings),
        source: source.trim() || null,
        version: recipe.version,
      };

      try {
        await onSubmit(updateData);
      } catch (error) {
        console.error('Failed to update recipe:', error);
      }
      return;
    }

    const createData: CreateRecipeDto = {
      title,
      description: description.trim() || undefined,
      prepTime: parseInt(prepTime),
      cookTime: parseInt(cookTime),
      servings: parseInt(servings),
      source: source.trim() || undefined,
      ingredients: [],
      steps: [],
    };

    try {
      await onSubmit(createData);
    } catch (error) {
      console.error('Failed to create recipe:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Recipe Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full rounded-lg border bg-surface-elevated px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.title ? 'border-brand-error' : 'border-border-subtle'
          }`}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-brand-error">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border-subtle bg-surface-elevated px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          disabled={isLoading}
        />
      </div>

      {/* Time and Servings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="prepTime"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Prep Time (minutes) *
          </label>
          <input
            type="number"
            id="prepTime"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            min="0"
            className={`w-full rounded-lg border bg-surface-elevated px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary ${
              errors.prepTime ? 'border-brand-error' : 'border-border-subtle'
            }`}
            disabled={isLoading}
          />
          {errors.prepTime && (
            <p className="mt-1 text-sm text-brand-error">{errors.prepTime}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="cookTime"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Cook Time (minutes) *
          </label>
          <input
            type="number"
            id="cookTime"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            min="0"
            className={`w-full rounded-lg border bg-surface-elevated px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary ${
              errors.cookTime ? 'border-brand-error' : 'border-border-subtle'
            }`}
            disabled={isLoading}
          />
          {errors.cookTime && (
            <p className="mt-1 text-sm text-brand-error">{errors.cookTime}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="servings"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Servings *
          </label>
          <input
            type="number"
            id="servings"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            min="1"
            className={`w-full rounded-lg border bg-surface-elevated px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary ${
              errors.servings ? 'border-brand-error' : 'border-border-subtle'
            }`}
            disabled={isLoading}
          />
          {errors.servings && (
            <p className="mt-1 text-sm text-brand-error">{errors.servings}</p>
          )}
        </div>
      </div>

      {/* Source */}
      <div>
        <label
          htmlFor="source"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Source
        </label>
        <input
          type="text"
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-surface-elevated px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          disabled={isLoading}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-wrap gap-4 justify-end border-t border-border-subtle pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border-subtle px-6 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-muted"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Recipe' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
