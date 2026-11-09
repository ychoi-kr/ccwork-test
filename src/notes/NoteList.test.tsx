import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteList } from './NoteList';
import { useNotes } from './NotesContext';
import { Note } from '../types/note';

vi.mock('./NotesContext', () => ({
  useNotes: vi.fn(),
}));

const makeNote = (id: string, title: string): Note => ({
  id,
  title,
  content: `${title} 내용`,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  tags: [],
});

describe('NoteList', () => {
  const deleteNote = vi.fn();

  // Context의 notes는 일부러 다른 값을 줘서 목록이 props에서 오는지 구분한다
  const mockContext = (overrides: { loading?: boolean; error?: string | null } = {}) => {
    vi.mocked(useNotes).mockReturnValue({
      notes: [makeNote('99', '컨텍스트 노트')],
      loading: false,
      error: null,
      createNote: vi.fn(),
      updateNote: vi.fn(),
      deleteNote,
      ...overrides,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext();
  });

  // 시나리오 17
  it('should 전달받은 notes와 notes 길이 기준의 "노트 N개"를 렌더링한다 when notes props를 넘긴다', () => {
    const notes = [makeNote('1', '첫 노트'), makeNote('2', '둘째 노트')];

    render(<NoteList notes={notes} selectedNoteId={null} onSelect={vi.fn()} />);

    expect(screen.getByText('첫 노트')).toBeInTheDocument();
    expect(screen.getByText('둘째 노트')).toBeInTheDocument();
    expect(screen.getByText('노트 2개')).toBeInTheDocument();
    expect(screen.queryByText('컨텍스트 노트')).not.toBeInTheDocument();
  });

  // 시나리오 18
  it('should "노트가 없습니다"를 보여 준다 when notes props가 빈 배열이다', () => {
    render(<NoteList notes={[]} selectedNoteId={null} onSelect={vi.fn()} />);

    expect(screen.getByText('노트가 없습니다')).toBeInTheDocument();
  });

  // 시나리오 19
  it('should 목록 대신 로딩 문구를 보여 준다 when loading이 true이다', () => {
    mockContext({ loading: true });

    render(
      <NoteList notes={[makeNote('1', '첫 노트')]} selectedNoteId={null} onSelect={vi.fn()} />,
    );

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    expect(screen.queryByText('첫 노트')).not.toBeInTheDocument();
  });

  // 시나리오 20
  it('should 목록 대신 오류 문구를 보여 준다 when error가 설정되어 있다', () => {
    mockContext({ error: 'Failed to fetch notes' });

    render(
      <NoteList notes={[makeNote('1', '첫 노트')]} selectedNoteId={null} onSelect={vi.fn()} />,
    );

    expect(screen.getByText('오류: Failed to fetch notes')).toBeInTheDocument();
    expect(screen.queryByText('첫 노트')).not.toBeInTheDocument();
  });

  // 시나리오 21
  it('should 해당 노트 id로 deleteNote를 호출한다 when 삭제 버튼을 클릭한다', async () => {
    deleteNote.mockResolvedValue(undefined);
    render(
      <NoteList notes={[makeNote('1', '첫 노트')]} selectedNoteId={null} onSelect={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(deleteNote).toHaveBeenCalledWith('1');
  });
});
