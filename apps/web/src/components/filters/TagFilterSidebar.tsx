import { useState } from 'react';
import type { TagCategory } from '@bmad/shared/types';

interface TagFilterSidebarProps {
  categories: TagCategory[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearAll: () => void;
}

export default function TagFilterSidebar({
  categories,
  selectedTagIds,
  onTagToggle,
  onClearAll,
}: TagFilterSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const selectedCount = selectedTagIds.length;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Filters {selectedCount > 0 && `(${selectedCount})`}
        </h3>
        {selectedCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-dark"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.id);

          return (
            <div key={category.id} className="border-b border-border-subtle pb-4">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-sm font-medium text-text-primary">
                  {category.name}
                </span>
                <svg
                  className={`w-5 h-5 text-text-muted transition-transform ${
                    isCollapsed ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {!isCollapsed && category.tags && (
                <div className="mt-2 space-y-2">
                  {category.tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => onTagToggle(tag.id)}
                        className="h-4 w-4 rounded border-border-subtle text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="ml-2 text-sm text-text-secondary">
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
