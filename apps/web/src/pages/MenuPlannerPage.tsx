const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const meals = ['Breakfast', 'Lunch', 'Dinner'];

const sampleMenu = {
  Mon: {
    Dinner: 'Lemon Herb Salmon',
  },
  Tue: {
    Lunch: 'Mediterranean Bowl',
  },
  Thu: {
    Dinner: 'Tomato Basil Pasta',
  },
};

export default function MenuPlannerPage() {
  const isLoading = false;
  const hasError = false;
  const hasMenu = true;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Menu Planner
            </p>
            <h3 className="text-2xl font-semibold text-text-primary">
              Plan your week in minutes
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Drag and drop to rearrange meals or auto-generate a balanced menu.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-muted"
            >
              Save menu
            </button>
            <button
              type="button"
              className="rounded-full bg-brand-secondary px-4 py-2 text-sm font-semibold text-text-inverse"
            >
              Auto-generate
            </button>
            <button
              type="button"
              className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse"
            >
              Generate shopping list
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated shadow-soft">
          {isLoading && (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"></div>
              <p className="text-sm text-text-muted">Loading menu...</p>
            </div>
          )}

          {hasError && (
            <div className="p-6 text-sm text-brand-error">
              Unable to load the menu calendar. Try again shortly.
            </div>
          )}

          {!isLoading && !hasError && !hasMenu && (
            <div className="p-6 text-center text-sm text-text-muted">
              No menus yet. Start by auto-generating your first week.
            </div>
          )}

          {!isLoading && !hasError && hasMenu && (
            <>
              <div className="grid grid-cols-8 border-b border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                <div className="px-4 py-3">Meal</div>
                {weekDays.map((day) => (
                  <div key={day} className="px-4 py-3 text-center">
                    {day}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-border-subtle">
                {meals.map((meal) => (
                  <div key={meal} className="grid grid-cols-8">
                    <div className="flex items-center border-r border-border-subtle px-4 py-4 text-sm font-semibold text-text-secondary">
                      {meal}
                    </div>
                    {weekDays.map((day) => {
                      const item = (sampleMenu as Record<string, Record<string, string>>)[day]?.[meal];
                      return (
                        <div
                          key={`${day}-${meal}`}
                          className="border-r border-border-subtle px-3 py-3"
                        >
                          {item ? (
                            <div className="rounded-xl border border-border-subtle bg-surface-base p-3 text-xs font-semibold text-text-primary shadow-sm">
                              <p>{item}</p>
                              <button
                                type="button"
                                className="mt-2 text-[11px] text-brand-primary"
                              >
                                Regenerate
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="flex w-full items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-base py-6 text-xs font-semibold text-text-muted transition-colors hover:border-brand-primary"
                            >
                              + Add meal
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-soft">
            <h4 className="text-sm font-semibold text-text-secondary">Menu summary</h4>
            <div className="mt-4 space-y-3 text-sm text-text-muted">
              <div className="flex items-center justify-between">
                <span>Total meals</span>
                <span className="font-semibold text-text-primary">21</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated cost</span>
                <span className="font-semibold text-text-primary">€64</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Balance score</span>
                <span className="font-semibold text-brand-secondary">Good</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-soft">
            <h4 className="text-sm font-semibold text-text-secondary">
              Generation controls
            </h4>
            <p className="mt-2 text-sm text-text-muted">
              Keep variety high and avoid repeating main ingredients within 3 days.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-muted"
            >
              Adjust constraints
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
