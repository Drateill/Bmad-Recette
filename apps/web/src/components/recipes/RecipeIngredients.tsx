import { useState } from 'react';
import type { RecipeIngredient } from '@bmad/shared/types';

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[];
  servings: number;
  adjustmentMultiplier?: number;
}

export default function RecipeIngredients({
  ingredients,
  servings,
  adjustmentMultiplier = 1,
}: RecipeIngredientsProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleIngredient = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sortedIngredients = [...ingredients].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Ingredients</h2>
          <p className="text-sm text-text-muted">
            For {Math.round(servings * adjustmentMultiplier)} servings
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-brand-secondary px-4 py-2 text-xs font-semibold text-text-inverse"
        >
          Add to shopping list
        </button>
      </div>

      <ul className="space-y-3">
        {sortedIngredients.map((ingredient) => {
          const isChecked = checkedItems.has(ingredient.id);
          const adjustedQuantity = ingredient.quantity * adjustmentMultiplier;

          return (
            <li key={ingredient.id} className="flex items-start">
              <label className="flex items-start cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleIngredient(ingredient.id)}
                  className="mt-1 h-4 w-4 rounded border-border-subtle text-brand-secondary focus:ring-brand-secondary"
                />
                <span
                  className={`ml-3 flex-1 ${
                    isChecked
                      ? 'line-through text-text-muted'
                      : 'text-text-secondary'
                  }`}
                >
                  <span className="font-medium">
                    {adjustedQuantity.toFixed(2)} {ingredient.unit}
                  </span>{' '}
                  {ingredient.ingredientName}
                  {ingredient.notes && (
                    <span className="text-sm text-text-muted block mt-1">
                      {ingredient.notes}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {sortedIngredients.length === 0 && (
        <p className="text-text-muted text-center py-4">
          No ingredients listed
        </p>
      )}
    </div>
  );
}
