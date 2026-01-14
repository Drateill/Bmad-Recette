interface SortOption {
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SortDropdownProps {
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const sortOptions: SortOption[] = [
  { label: 'Most Recent', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Alphabetical (A-Z)', sortBy: 'title', sortOrder: 'asc' },
  { label: 'Alphabetical (Z-A)', sortBy: 'title', sortOrder: 'desc' },
  { label: 'Shortest Time', sortBy: 'prepTime', sortOrder: 'asc' },
  { label: 'Highest Rated', sortBy: 'rating', sortOrder: 'desc' },
];

export default function SortDropdown({
  currentSortBy,
  currentSortOrder,
  onChange,
}: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
        Sort by:
      </label>
      <select
        id="sort"
        value={`${currentSortBy}-${currentSortOrder}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split('-');
          onChange(sortBy, sortOrder as 'asc' | 'desc');
        }}
        className="block w-full rounded-full border border-border-subtle bg-surface-elevated px-3 py-2 text-sm text-text-primary shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        {sortOptions.map((option) => (
          <option
            key={`${option.sortBy}-${option.sortOrder}`}
            value={`${option.sortBy}-${option.sortOrder}`}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
