interface TagBadgesProps {
  tags: Array<{ id: string; name: string; color?: string | null }>;
  maxVisible?: number;
}

export default function TagBadges({ tags, maxVisible = 3 }: TagBadgesProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: tag.color || 'rgba(var(--color-secondary-light), 0.25)',
            color: tag.color ? '#fff' : 'rgb(var(--color-text-secondary))',
          }}
        >
          {tag.name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-text-secondary">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
