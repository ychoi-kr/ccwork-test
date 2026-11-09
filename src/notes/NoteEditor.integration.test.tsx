import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import { NotesProvider } from './NotesContext';

const note = {
  id: '1',
  title: '제목',
  content: '내용',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  tags: ['React'],
};

describe('NoteEditor + NotesProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 시나리오 39
  it('should PATCH 본문에 tags를 포함해 요청한다 when 실제 Context를 거쳐 태그를 추가하고 저장한다', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            init?.method === 'PATCH' ? { ...note, ...JSON.parse(init.body as string) } : [note],
          ),
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    // 실제 앱처럼 목록이 로드된 뒤 노트를 선택한다
    const ui = (selectedNoteId: string | null) => (
      <NotesProvider>
        <NoteEditor selectedNoteId={selectedNoteId} isCreating={false} onDone={vi.fn()} />
      </NotesProvider>
    );
    const { rerender } = render(ui(null));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    rerender(ui('1'));
    await screen.findByText('React');

    const tagInput = document.querySelector('input[maxlength="15"]') as HTMLInputElement;
    await userEvent.type(tagInput, 'Vue{Enter}');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
      expect(patch).toBeDefined();
      expect(patch![0]).toContain('/notes/1');
      expect(JSON.parse(patch![1]!.body as string)).toMatchObject({
        title: '제목',
        content: '내용',
        tags: ['React', 'Vue'],
      });
    });
  });
});
