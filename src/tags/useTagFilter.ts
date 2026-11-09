import { useState } from 'react';
import { Note } from '../types/note';

interface UseTagFilterResult {
  tags: string[];
  selectedTag: string | null;
  filteredNotes: Note[];
  toggleTag: (tag: string) => void;
}

export function useTagFilter(notes: Note[]): UseTagFilterResult {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 모든 노트의 태그를 중복 없이 모아 가나다순으로 정렬 (tags가 없는 노트는 빈 배열로 취급)
  const tags = [...new Set(notes.flatMap((note) => note.tags ?? []))].sort((a, b) =>
    a.localeCompare(b, 'ko'),
  );

  const filteredNotes =
    selectedTag === null ? notes : notes.filter((note) => note.tags?.includes(selectedTag));

  // 선택된 태그를 다시 누르면 해제, 다른 태그를 누르면 교체
  const toggleTag = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  return { tags, selectedTag, filteredNotes, toggleTag };
}
