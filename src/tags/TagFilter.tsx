interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onToggle: (tag: string) => void;
}

export function TagFilter({ tags, selectedTag, onToggle }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      {tags.map((tag) => {
        const isSelected = tag === selectedTag;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(tag)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${
              isSelected ? 'bg-foreground text-card' : 'bg-muted text-muted-foreground'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
