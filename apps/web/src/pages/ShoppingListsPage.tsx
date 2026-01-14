const activeLists = [
  { id: 'weekly', name: 'Weekly Shop', progress: '12/24', created: 'Today' },
  { id: 'party', name: 'Dinner Party', progress: '4/18', created: '2 days ago' },
];

const items = [
  { id: '1', name: 'Cherry tomatoes', qty: '2 cups', section: 'Produce' },
  { id: '2', name: 'Mozzarella', qty: '200g', section: 'Dairy' },
  { id: '3', name: 'Basil', qty: '1 bunch', section: 'Produce' },
  { id: '4', name: 'Olive oil', qty: '250ml', section: 'Pantry' },
];

export default function ShoppingListsPage() {
  const isLoading = false;
  const hasError = false;
  const hasLists = activeLists.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Shopping Lists
            </p>
            <h3 className="text-2xl font-semibold text-text-primary">
              Stay organized while you shop
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Switch between list views and track progress in real time.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse"
          >
            New list
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 shadow-soft">
            <h4 className="text-sm font-semibold text-text-secondary">Active lists</h4>
            <div className="mt-4 space-y-3">
              {!hasLists && (
                <p className="text-sm text-text-muted">No active lists yet.</p>
              )}
              {activeLists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  className="w-full rounded-xl border border-border-subtle bg-surface-base p-4 text-left transition-colors hover:border-brand-primary"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-text-primary">
                      {list.name}
                    </h5>
                    <span className="text-xs text-text-muted">{list.created}</span>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">{list.progress} items</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 shadow-soft">
            <h4 className="text-sm font-semibold text-text-secondary">Past lists</h4>
            <p className="mt-2 text-sm text-text-muted">No archived lists yet.</p>
          </div>
        </aside>

        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
          {isLoading && (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"></div>
              <p className="text-sm text-text-muted">Loading list...</p>
            </div>
          )}

          {hasError && (
            <div className="text-sm text-brand-error">
              Unable to load this list. Please try again.
            </div>
          )}

          {!isLoading && !hasError && hasLists && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-text-primary">Weekly Shop</h4>
                  <p className="text-sm text-text-muted">12 of 24 items checked</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
                  >
                    By aisle
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
                  >
                    By recipe
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
                  >
                    Alphabetical
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-base px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-muted">
                        {item.qty} · {item.section}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="rounded-full border border-border-subtle px-3 py-1 text-xs font-semibold text-text-secondary"
                      >
                        Have it
                      </button>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border-subtle text-brand-secondary"
                        aria-label={`Mark ${item.name} as purchased`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-4 border-t border-border-subtle pt-4">
                <button
                  type="button"
                  className="rounded-full border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary"
                >
                  Clear checked
                </button>
                <button
                  type="button"
                  className="rounded-full bg-brand-secondary px-4 py-2 text-xs font-semibold text-text-inverse"
                >
                  Mark all done
                </button>
              </div>
            </>
          )}

          {!isLoading && !hasError && !hasLists && (
            <p className="text-sm text-text-muted">Create your first list to get started.</p>
          )}
        </div>
      </section>
    </div>
  );
}
