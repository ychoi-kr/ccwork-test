import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import type { Note } from '../types/note';

const mockUpdateNote = vi.fn();
const mockCreateNote = vi.fn();
let mockNotes: Note[] = [];

vi.mock('./NotesContext', () => ({
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

    // 시나리오 36
    it("should 기존 태그 뒤에 새 태그를 붙여 tags: ['React', 'Vue']로 호출한다 when tags: ['React']인 노트에서 Vue를 추가하고 저장한다", async () => {
      const { container } = renderEditor();

      await userEvent.type(getTagInput(container), 'Vue{Enter}');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledWith('1', {
        title: '제목',
        content: '내용',
        tags: ['React', 'Vue'],
      });
    });

    // 시나리오 37
    it('should 저장 버튼을 다시 활성화한다 when updateNote가 throw한다', async () => {
      mockUpdateNote.mockRejectedValue(new Error('Failed to update note'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderEditor();

      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
      consoleError.mockRestore();
    });

    // 시나리오 38
    it('should 같은 tags로 updateNote를 다시 호출한다 when 저장 실패 후 저장을 다시 누른다', async () => {
      mockUpdateNote.mockRejectedValue(new Error('Failed to update note'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = renderEditor();
      await userEvent.type(getTagInput(container), 'Vue{Enter}');

      await userEvent.click(screen.getByRole('button', { name: '저장' }));
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledTimes(2);
      expect(mockUpdateNote).toHaveBeenNthCalledWith(
        2,
        '1',
        expect.objectContaining({ tags: ['React', 'Vue'] }),
      );
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

  describe('태그 삭제', () => {
    beforeEach(() => {
      mockNotes = [makeNote({ tags: ['React', 'Vue', 'Node'] })];
    });

    const clickRemove = (name: string) =>
      userEvent.click(screen.getByRole('button', { name: `${name} 태그 삭제` }));

    // TAG-3 시나리오 17
    it('should 해당 태그 칩만 사라지고 남은 태그 순서가 유지된다 when 태그 3개가 있는 노트에서 가운데 태그의 X를 클릭한다', async () => {
      renderEditor();

      await clickRemove('Vue');

      expect(screen.queryByText('Vue')).not.toBeInTheDocument();
      const chips = screen.getAllByText(/^(React|Node)$/);
      expect(chips.map((c) => c.textContent)).toEqual(['React', 'Node']);
    });

    // TAG-3 시나리오 18
    it('should 삭제된 태그가 빠진 tags로 updateNote(id, { title, content, tags })를 호출한다 when 태그를 삭제한 뒤 저장한다', async () => {
      renderEditor();

      await clickRemove('Vue');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledWith('1', {
        title: '제목',
        content: '내용',
        tags: ['React', 'Node'],
      });
    });

    // TAG-3 시나리오 19
    it('should 키보드(Tab, Enter)로 태그를 삭제할 수 있다 when X 버튼에 포커스를 옮겨 Enter를 누른다', async () => {
      renderEditor();
      const removeButton = screen.getByRole('button', { name: 'React 태그 삭제' });

      // 제목 입력창에서 Tab으로 첫 번째 X 버튼까지 이동한다
      screen.getByPlaceholderText('제목').focus();
      await userEvent.tab();
      expect(removeButton).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });

    // TAG-3 시나리오 20
    it('should updateNote와 서버 요청을 호출하지 않는다 when 태그를 삭제하고 아직 저장하지 않았다', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      renderEditor();

      await clickRemove('Vue');

      expect(mockUpdateNote).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    // TAG-3 시나리오 21
    it('should tags가 빈 배열인 채로 updateNote를 호출한다 when 모든 태그를 삭제한 뒤 저장한다', async () => {
      renderEditor();

      await clickRemove('React');
      await clickRemove('Vue');
      await clickRemove('Node');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledWith('1', expect.objectContaining({ tags: [] }));
    });

    // TAG-3 시나리오 22
    it('should 저장되지 않고 폼 상태만 변한다 when X 버튼을 클릭한다', async () => {
      const { onDone } = renderEditor();

      await clickRemove('Vue');

      expect(onDone).not.toHaveBeenCalled();
      expect(mockUpdateNote).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText('제목')).toHaveValue('제목');
      expect(screen.getByPlaceholderText('내용을 입력하세요...')).toHaveValue('내용');
    });

    // TAG-3 시나리오 23
    it('should console.error만 남기고 삭제된 폼 상태를 유지한다 when 태그 삭제 후 저장했는데 updateNote가 실패한다', async () => {
      const error = new Error('Failed to update note');
      mockUpdateNote.mockRejectedValue(error);
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderEditor();

      await clickRemove('Vue');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(consoleError).toHaveBeenCalledWith('Failed to save note:', error);
      expect(screen.queryByText('Vue')).not.toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node')).toBeInTheDocument();
      consoleError.mockRestore();
    });
  });
  describe('생성 모드 handleSave', () => {
    const renderCreating = () => {
      const onDone = vi.fn();
      const utils = render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={onDone} />);
      return { onDone, ...utils };
    };

    beforeEach(() => {
      mockCreateNote.mockResolvedValue(undefined);
    });

    // 이슈 11 시나리오 9
    it('should createNote(title, content, tags)를 호출한다 when 생성 모드에서 태그를 추가하고 저장을 누를 때', async () => {
      const { container } = renderCreating();

      await userEvent.type(screen.getByPlaceholderText('제목'), '새 제목');
      await userEvent.type(screen.getByPlaceholderText('내용을 입력하세요...'), '새 내용');
      await userEvent.type(getTagInput(container), 'React{Enter}');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockCreateNote).toHaveBeenCalledWith('새 제목', '새 내용', ['React']);
    });

    // 이슈 11 시나리오 10
    it('should 태그 추가 순서대로 tags를 전달한다 when 태그를 여러 개 추가하고 저장할 때', async () => {
      const { container } = renderCreating();

      await userEvent.type(screen.getByPlaceholderText('제목'), '새 제목');
      await userEvent.type(getTagInput(container), 'React{Enter}');
      await userEvent.type(getTagInput(container), 'Vue{Enter}');
      await userEvent.type(getTagInput(container), 'Node{Enter}');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockCreateNote).toHaveBeenCalledWith('새 제목', '', ['React', 'Vue', 'Node']);
    });

    // 이슈 11 시나리오 11
    it('should createNote(title, content, [])를 호출한다 when 태그 없이 저장할 때', async () => {
      renderCreating();

      await userEvent.type(screen.getByPlaceholderText('제목'), '새 제목');
      await userEvent.type(screen.getByPlaceholderText('내용을 입력하세요...'), '새 내용');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(mockCreateNote).toHaveBeenCalledWith('새 제목', '새 내용', []);
    });

    // 이슈 11 시나리오 12
    it('should console.error만 남기고 제목·내용·태그 입력을 유지한다 when createNote가 실패할 때', async () => {
      const error = new Error('Failed to create note');
      mockCreateNote.mockRejectedValue(error);
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container, onDone } = renderCreating();

      await userEvent.type(screen.getByPlaceholderText('제목'), '새 제목');
      await userEvent.type(screen.getByPlaceholderText('내용을 입력하세요...'), '새 내용');
      await userEvent.type(getTagInput(container), 'React{Enter}');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));

      expect(consoleError).toHaveBeenCalledWith('Failed to save note:', error);
      expect(onDone).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText('제목')).toHaveValue('새 제목');
      expect(screen.getByPlaceholderText('내용을 입력하세요...')).toHaveValue('새 내용');
      expect(screen.getByText('React')).toBeInTheDocument();
      consoleError.mockRestore();
    });
  });
});
