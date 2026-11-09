import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import type { Note } from '../types/note';

const mockUpdateNote = vi.fn();
const mockCreateNote = vi.fn();
let mockNotes: Note[] = [];

vi.mock('../context/NotesContext', () => ({
  useNotes: () => ({
    notes: mockNotes,
    loading: false,
    error: null,
    createNote: mockCreateNote,
    updateNote: mockUpdateNote,
    deleteNote: vi.fn(),
  }),
}));

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: '제목',
  content: '내용',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

// 태그 입력창은 maxLength 15인 input으로 식별한다 (시그니처 문서: <input maxLength={15}>)
const getTagInput = (container: HTMLElement) =>
  container.querySelector('input[maxlength="15"]') as HTMLInputElement;

const renderEditor = (props: Partial<Parameters<typeof NoteEditor>[0]> = {}) => {
  const onDone = vi.fn();
  const utils = render(
    <NoteEditor selectedNoteId="1" isCreating={false} onDone={onDone} {...props} />,
  );
  return { onDone, ...utils };
};

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateNote.mockResolvedValue(undefined);
    mockNotes = [makeNote({ tags: ['React'] })];
  });

  // 시나리오 19
  it('should 선택 노트의 tags를 칩으로 표시한다 when tags: ["React"]인 노트를 선택한다', () => {
    renderEditor();

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  // 시나리오 20
  it('should 오류 없이 빈 태그로 표시한다 when tags 필드가 없는 기존 노트를 선택한다', () => {
    mockNotes = [makeNote()];

    const { container } = renderEditor();

    expect(getTagInput(container)).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  // 시나리오 21
  it('should 기존 칩을 유지하고 새 태그를 맨 뒤에 붙인다 when tags: ["React"]인 노트에서 Vue를 입력하고 Enter를 누른다', async () => {
    const { container } = renderEditor();

    await userEvent.type(getTagInput(container), 'Vue{Enter}');

    const chips = screen.getAllByText(/^(React|Vue)$/);
    expect(chips.map((c) => c.textContent)).toEqual(['React', 'Vue']);
  });

  // 시나리오 22
  it('should 태그 칩과 입력창이 보인다 when 편집 화면을 연다', () => {
    const { container } = renderEditor();

    expect(getTagInput(container)).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  describe('handleSave', () => {
    // 시나리오 23
    it('should updateNote(id, { title, content, tags })로 호출한다 when React, Vue 태그를 추가하고 저장한다', async () => {
      mockNotes = [makeNote()];
      const { container } = renderEditor();
      const tagInput = getTagInput(container);

      await userEvent.type(tagInput, 'React{Enter}');
      await userEvent.type(tagInput, 'Vue{Enter}');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledWith('1', {
        title: '제목',
        content: '내용',
        tags: ['React', 'Vue'],
      });
    });

    // 시나리오 24
    it('should 공백이 제거된 태그를 전달한다 when " React "를 추가하고 저장한다', async () => {
      mockNotes = [makeNote()];
      const { container } = renderEditor();

      await userEvent.type(getTagInput(container), ' React {Enter}');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ tags: ['React'] }),
      );
    });

    // 시나리오 25
    it('should 미확정 텍스트를 제외하고 tags 상태만 전달한다 when 태그 React가 있고 입력창에 Vu가 남은 채 저장한다', async () => {
      const { container } = renderEditor();

      await userEvent.type(getTagInput(container), 'Vu');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ tags: ['React'] }),
      );
    });

    // 시나리오 26
    it('should tags: []를 전달한다 when tags가 없는 기존 노트를 태그 추가 없이 저장한다', async () => {
      mockNotes = [makeNote()];
      renderEditor();

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledWith('1', expect.objectContaining({ tags: [] }));
    });

    // 시나리오 28
    it('should onDone을 호출한다 when updateNote가 성공한다', async () => {
      const { onDone } = renderEditor();

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(onDone).toHaveBeenCalled();
    });

    // 시나리오 29
    it("should console.error('Failed to save note:', e)만 남기고 onDone을 호출하지 않는다 when updateNote가 throw한다", async () => {
      const error = new Error('Failed to update note');
      mockUpdateNote.mockRejectedValue(error);
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { onDone } = renderEditor();

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(consoleError).toHaveBeenCalledWith('Failed to save note:', error);
      expect(onDone).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    // 시나리오 30
    it('should 태그를 포함한 폼 상태를 유지한다 when updateNote가 throw한다', async () => {
      mockUpdateNote.mockRejectedValue(new Error('Failed to update note'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = renderEditor();

      await userEvent.type(getTagInput(container), 'Vue{Enter}');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Vue')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('제목')).toHaveValue('제목');
      consoleError.mockRestore();
    });
  });

  // 시나리오 27
  it('should Enter로 저장이 호출되지 않는다 when 태그 입력창에서 Enter를 누른다', async () => {
    const { container } = renderEditor();

    await userEvent.type(getTagInput(container), 'Vue{Enter}');

    expect(mockUpdateNote).not.toHaveBeenCalled();
  });

  // 시나리오 31
  it('should 이전 노트의 태그를 지우고 새 노트의 tags로 교체한다 when 다른 노트를 선택한다', () => {
    mockNotes = [makeNote({ id: '1', tags: ['React'] }), makeNote({ id: '2', tags: ['Vue'] })];
    const { rerender } = renderEditor({ selectedNoteId: '1' });

    rerender(<NoteEditor selectedNoteId="2" isCreating={false} onDone={vi.fn()} />);

    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  // 시나리오 32
  it('should 태그를 비운다 when 생성 모드로 전환한다', () => {
    const { rerender } = renderEditor();

    rerender(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);

    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });
});
