import type { RecipeDetail } from '@bmad/shared/types';
import StarRating from '../shared/StarRating';
import TagBadges from '../shared/TagBadges';

interface RecipeHeroProps {
  recipe: RecipeDetail;
}

export default function RecipeHero({ recipe }: RecipeHeroProps) {
  const primaryPhoto = recipe.photos.find((p) => p.isPrimary);
  const photoUrl = primaryPhoto?.s3Url || primaryPhoto?.thumbnailUrl;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated shadow-soft">
      {/* Hero Image */}
      {photoUrl ? (
        <div className="w-full h-64 md:h-96 bg-surface-muted">
          <img
            src={photoUrl}
            alt={recipe.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-64 md:h-96 bg-surface-muted flex items-center justify-center">
          <svg
            className="w-24 h-24 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Recipe Metadata */}
      <div className="p-6">
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          {recipe.title}
        </h1>

        {recipe.description && (
          <p className="text-text-secondary mb-4">{recipe.description}</p>
        )}

        {/* Tags */}
        {/* TODO: Tags will be populated when Story 2.2 is implemented */}
        <div className="mb-4">
          <TagBadges tags={[]} />
        </div>

        {/* Rating */}
        {recipe.rating !== null && (
          <div className="mb-4">
            <StarRating rating={recipe.rating} />
          </div>
        )}

        {/* Time and Servings Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-subtle">
          <div>
            <p className="text-sm text-text-muted">Prep Time</p>
            <p className="text-lg font-semibold text-text-primary">
              {recipe.prepTime} min
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Cook Time</p>
            <p className="text-lg font-semibold text-text-primary">
              {recipe.cookTime} min
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Total Time</p>
            <p className="text-lg font-semibold text-text-primary">
              {recipe.totalTime} min
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Servings</p>
            <p className="text-lg font-semibold text-text-primary">
              {recipe.servings}
            </p>
          </div>
        </div>

        {/* Source */}
        {recipe.source && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-sm text-text-muted">Source</p>
            <p className="text-text-secondary">{recipe.source}</p>
          </div>
        )}
      </div>
    </div>
  );
}
