import { useState } from 'react';

export function useTags(initialTags: string[]) {
  const [tags, setTags] = useState(initialTags);

  const addTag = (raw: string) => setTags((prev) => [...prev, raw.trim()]);
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));
  const resetTags = (next: string[]) => setTags(next);

  return { tags, addTag, removeTag, resetTags };
}
