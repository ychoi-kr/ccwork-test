import { useState } from 'react';

export function useTags(initialTags: string[]) {
  const [tags, setTags] = useState(initialTags);

  const addTag = (raw: string) => setTags((prev) => [...prev, raw.trim()]);
  const resetTags = (next: string[]) => setTags(next);

  return { tags, addTag, resetTags };
}
