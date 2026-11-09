import { useNotes } from '../notes/NotesContext';
import { useTagFilter } from '../tags/useTagFilter';
import { NoteList } from '../notes/NoteList';
import { TagFilter } from '../tags/TagFilter';

interface SidebarProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ selectedNoteId, onSelect }: SidebarProps) {
  const { notes, loading, error } = useNotes();
  const { tags, selectedTag, filteredNotes, toggleTag } = useTagFilter(notes);

  return (
    <>
      {!loading && !error && (
        <TagFilter tags={tags} selectedTag={selectedTag} onToggle={toggleTag} />
      )}
      <NoteList notes={filteredNotes} selectedNoteId={selectedNoteId} onSelect={onSelect} />
    </>
  );
}
