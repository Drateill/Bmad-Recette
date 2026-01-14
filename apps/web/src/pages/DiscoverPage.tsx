import { useState } from 'react';

const initialIngredients = [
  'Cherry tomatoes',
  'Basil',
  'Mozzarella',
  'Olive oil',
  'Garlic',
];

const matchGroups = [
  {
    title: '100% Match',
    badge: '✅',
    description: 'Ready to cook right now',
    tone: 'success',
    items: [
      {
        id: 'caprese',
        title: 'Caprese Salad',
        detail: '15 min · 4 servings',
        note: 'Cook now',
      },
      {
        id: 'bruschetta',
        title: 'Tomato Bruschetta',
        detail: '20 min · 6 servings',
        note: 'Cook now',
      },
    ],
  },
  {
    title: '80-99% Match',
    badge: '🟡',
    description: 'Missing 1-2 items',
    tone: 'warning',
    items: [
      {
        id: 'pasta',
        title: 'Basil Pasta',
        detail: '35 min · 4 servings',
        note: 'Need: pasta, parmesan',
      },
    ],
  },
  {
    title: '50-79% Match',
    badge: '🟠',
    description: 'Plan a pantry run',
    tone: 'accent',
    items: [
      {
        id: 'pizza',
        title: 'Margherita Pizza',
        detail: '60 min · 2 servings',
        note: 'Need: dough, yeast, flour',
      },
    ],
  },
];

const toneStyles: Record<string, string> = {
  success: 'border-brand-success text-brand-success',
  warning: 'border-brand-warning text-brand-warning',
  accent: 'border-brand-accent text-brand-accent',
};

export default function DiscoverPage() {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const isLoading = false;
  const hasError = false;
  const showMatches = ingredients.length > 0;

  const removeIngredient = (name: string) => {
    setIngredients((prev) => prev.filter((item) => item !== name));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Discover by Ingredients
            </p>
            <h3 className="text-2xl font-semibold text-text-primary">
              Cook with what you already have
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Add or remove ingredients to refresh match results instantly.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-muted"
          >
            Edit inventory
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ingredients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-sm text-text-muted">
              Your pantry is empty. Add ingredients to see matches.
            </div>
          ) : (
            ingredients.map((ingredient) => (
              <button
                key={ingredient}
                type="button"
                onClick={() => removeIngredient(ingredient)}
                className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-elevated"
              >
                {ingredient}
                <span aria-hidden="true">×</span>
              </button>
            ))
          )}
        </div>
      </section>

      {isLoading && (
        <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 text-center shadow-soft">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"></div>
          <p className="mt-3 text-sm text-text-muted">Loading matches...</p>
        </section>
      )}

      {hasError && (
        <section className="rounded-2xl border border-brand-error/40 bg-brand-error/10 p-6 text-sm text-brand-error">
          Something went wrong while loading matches. Try again in a moment.
        </section>
      )}

      {!isLoading && !hasError && showMatches && matchGroups.map((group) => (
        <section
          key={group.title}
          className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold text-text-primary">
                {group.badge} {group.title}
              </h4>
              <p className="text-sm text-text-muted">{group.description}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[group.tone]}`}
            >
              {group.items.length} recipes
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border-subtle bg-surface-base p-4 transition-transform duration-base hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-base font-semibold text-text-primary">
                      {item.title}
                    </h5>
                    <p className="text-xs text-text-muted">{item.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-text-inverse"
                  >
                    View
                  </button>
                </div>
                <p className="mt-3 text-xs text-text-secondary">{item.note}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
