import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useTagCategories } from '../hooks/useTagCategories';
import RecipeCard from '../components/recipes/RecipeCard';
import EmptyState from '../components/recipes/EmptyState';
import SearchBar from '../components/filters/SearchBar';
import SortDropdown from '../components/filters/SortDropdown';
import TagFilterSidebar from '../components/filters/TagFilterSidebar';
import PaginationControls from '../components/shared/PaginationControls';

export default function RecipeLibrary() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    searchParams.get('tagIds')?.split(',').filter(Boolean) || []
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (searchQuery) params.set('q', searchQuery);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (selectedTagIds.length > 0) {
      params.set('tagIds', selectedTagIds.join(','));
    }
    setSearchParams(params, { replace: true });
  }, [page, searchQuery, sortBy, sortOrder, selectedTagIds, setSearchParams]);

  const { data, isLoading, error } = useRecipes({
    page,
    limit: 20,
    sortBy: sortBy as 'title' | 'createdAt' | 'prepTime' | 'cookTime' | 'rating',
    sortOrder,
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    q: searchQuery || undefined,
  });

  const { data: tagCategories = [] } = useTagCategories();

  const handleCreateRecipe = () => {
    navigate('/recipes/new');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedTagIds([]);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tagMap = new Map<string, { id: string; name: string; color?: string | null }>();
  tagCategories.forEach((category) => {
    category.tags?.forEach((tag) => {
      tagMap.set(tag.id, {
        id: tag.id,
        name: tag.name,
        color: tag.color,
      });
    });
  });

  const recipes = data?.data || [];
  const pagination = data?.pagination;
  const hasNoRecipes =
    !isLoading &&
    !error &&
    recipes.length === 0 &&
    !searchQuery &&
    selectedTagIds.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              My Recipes
            </p>
            <h3 className="text-2xl font-semibold text-text-primary">Recipe Library</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Browse your collection or create something new.
            </p>
          </div>
          <button
            onClick={handleCreateRecipe}
            className="inline-flex items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-text-inverse"
          >
            + Create recipe
          </button>
        </div>
      </section>

      {hasNoRecipes ? (
        <EmptyState onCreateRecipe={handleCreateRecipe} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <TagFilterSidebar
              categories={tagCategories}
              selectedTagIds={selectedTagIds}
              onTagToggle={handleTagToggle}
              onClearAll={handleClearFilters}
            />
          </aside>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-elevated p-4 shadow-soft md:flex-row md:items-center">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search recipes, tags, ingredients..."
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SortDropdown
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onChange={handleSortChange}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      viewMode === 'grid'
                        ? 'bg-brand-primary text-text-inverse'
                        : 'border border-border-subtle text-text-secondary'
                    }`}
                    aria-label="Grid view"
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      viewMode === 'list'
                        ? 'bg-brand-primary text-text-inverse'
                        : 'border border-border-subtle text-text-secondary'
                    }`}
                    aria-label="List view"
                  >
                    List
                  </button>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="rounded-full border border-border-subtle px-3 py-2 text-xs font-semibold text-text-secondary lg:hidden"
                >
                  Filters {selectedTagIds.length > 0 && `(${selectedTagIds.length})`}
                </button>
              </div>
            </div>

            {isSidebarOpen && (
              <div className="lg:hidden">
                <TagFilterSidebar
                  categories={tagCategories}
                  selectedTagIds={selectedTagIds}
                  onTagToggle={handleTagToggle}
                  onClearAll={handleClearFilters}
                />
              </div>
            )}

            {isLoading && (
              <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 text-center shadow-soft">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"></div>
                <p className="mt-3 text-sm text-text-muted">Loading recipes...</p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-brand-error/40 bg-brand-error/10 p-4">
                <p className="text-sm text-brand-error">
                  Failed to load recipes. Please try again.
                </p>
              </div>
            )}

            {!isLoading && !error && recipes.length > 0 && (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-4'
                  }
                >
                  {recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      viewMode={viewMode}
                      tags={recipe.tagIds.map((tagId) => tagMap.get(tagId)!).filter(Boolean)}
                    />
                  ))}
                </div>

                {pagination && (
                  <PaginationControls
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}

            {!isLoading &&
              !error &&
              recipes.length === 0 &&
              (searchQuery || selectedTagIds.length > 0) && (
                <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 text-center shadow-soft">
                  <p className="text-sm text-text-secondary">
                    No recipes match those filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTagIds([]);
                    }}
                    className="mt-4 text-xs font-semibold text-brand-primary"
                  >
                    Clear filters
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
