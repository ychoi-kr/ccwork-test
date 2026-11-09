import { useTagInput } from '../hooks/useTagInput';

interface TagInputProps {
  tags: string[];
  onAdd: (raw: string) => void;
  onRemove: (tag: string) => void;
}

// onRemove는 TAG-3(삭제)에서 사용한다
export function TagInput({ tags, onAdd }: TagInputProps) {
  const { text, onChange, onKeyDown } = useTagInput(onAdd);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span key={tag} className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
          {tag}
        </span>
      ))}
      <input
        type="text"
        value={text}
        onChange={onChange}
        onKeyDown={onKeyDown}
        maxLength={15}
        className="bg-transparent border-none outline-none text-sm text-foreground"
      />
    </div>
  );
}
