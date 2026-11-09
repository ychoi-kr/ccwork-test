import { useState } from 'react';
import { NotesProvider } from './notes/NotesContext';
import { Layout } from './layout/Layout';
import { Sidebar } from './layout/Sidebar';
import { NoteEditor } from './notes/NoteEditor';

function App() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsCreating(true);
  };

  const handleDone = () => {
    setIsCreating(false);
    // 저장 후 선택 상태는 유지
  };

  return (
    <NotesProvider>
      <Layout
        onNewNote={handleNewNote}
        sidebar={<Sidebar selectedNoteId={selectedNoteId} onSelect={handleSelectNote} />}
        main={
          <NoteEditor selectedNoteId={selectedNoteId} isCreating={isCreating} onDone={handleDone} />
        }
      />
    </NotesProvider>
  );
}

export default App;
