import { useNavigate } from 'react-router-dom';
import type { RecipeListItem } from '@bmad/shared/types';
import StarRating from '../shared/StarRating';
import TagBadges from '../shared/TagBadges';

interface RecipeCardProps {
  recipe: RecipeListItem;
  viewMode: 'grid' | 'list';
  tags?: Array<{ id: string; name: string; color?: string | null }>;
}

export default function RecipeCard({
  recipe,
  viewMode,
  tags = [],
}: RecipeCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/recipes/${recipe.id}`);
  };

  const placeholderImage =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" /%3E%3C/svg%3E';

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleClick}
        className="flex cursor-pointer gap-4 rounded-2xl border border-border-subtle bg-surface-elevated p-4 shadow-soft transition-transform duration-base hover:-translate-y-1"
      >
        <img
          src={recipe.primaryPhoto?.thumbnailUrl || placeholderImage}
          alt={recipe.title}
          loading="lazy"
          className="h-32 w-32 flex-shrink-0 rounded-xl object-cover bg-surface-muted"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-primary truncate">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="text-sm text-text-secondary line-clamp-2 mt-1">
              {recipe.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-text-muted">
            <span>Total: {recipe.totalTime} min</span>
            <span>Servings: {recipe.servings}</span>
          </div>
          <div className="mt-2">
            <StarRating rating={recipe.rating} size="sm" />
          </div>
          <div className="mt-2">
            <TagBadges tags={tags} maxVisible={3} />
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={handleClick}
      className="cursor-pointer overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated shadow-soft transition-transform duration-base hover:-translate-y-1"
    >
      <div className="aspect-video w-full overflow-hidden bg-surface-muted">
        <img
          src={recipe.primaryPhoto?.thumbnailUrl || placeholderImage}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-text-primary truncate">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mt-1">
            {recipe.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-4 text-sm text-text-muted">
          <span>⏱️ {recipe.totalTime} min</span>
          <span>🍽️ {recipe.servings}</span>
        </div>
        <div className="mt-2">
          <StarRating rating={recipe.rating} size="sm" />
        </div>
        <div className="mt-3">
          <TagBadges tags={tags} maxVisible={3} />
        </div>
      </div>
    </div>
  );
}
