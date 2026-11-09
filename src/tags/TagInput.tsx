import { useTagInput } from './useTagInput';

interface TagInputProps {
  tags: string[];
  onAdd: (raw: string) => void;
  onRemove: (tag: string) => void;
}

const MAX_TAG_LENGTH = 15;

export function TagInput({ tags, onAdd, onRemove }: TagInputProps) {
  const { text, onChange, onKeyDown } = useTagInput(onAdd);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="group bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
        >
          <span>{tag}</span>
          <button
            type="button"
            aria-label={`${tag} 태그 삭제`}
            onClick={() => onRemove(tag)}
            className="cursor-pointer opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        aria-label="태그 입력"
        value={text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        maxLength={MAX_TAG_LENGTH}
        className="bg-transparent border-none outline-none text-sm text-foreground"
      />
    </div>
  );
}
