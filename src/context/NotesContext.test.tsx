import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotesProvider, useNotes } from './NotesContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <NotesProvider>{children}</NotesProvider>
);

const serverNote = {
  id: '1',
  title: '제목',
  content: '내용',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  tags: ['React', 'Vue'],
};

describe('NotesProvider', () => {
  const fetchMock = vi.fn();

  // GET은 빈 목록, POST는 postResponse로 응답한다
  const mockFetch = (postResponse: { ok: boolean; body?: unknown }) => {
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: postResponse.ok, json: async () => postResponse.body });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  };

  const renderLoaded = async () => {
    const hook = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    return hook;
  };

  const getPostBody = () => {
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    return JSON.parse(post![1].body as string);
  };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('createNote', () => {
    // 이슈 11 시나리오 5
    it('should api.createNote에 { title, content, tags }를 전달한다 when 세 번째 인자로 tags를 넘길 때', async () => {
      mockFetch({ ok: true, body: serverNote });
      const { result } = await renderLoaded();

      await act(() => result.current.createNote('제목', '내용', ['React', 'Vue']));

      expect(getPostBody()).toMatchObject({
        title: '제목',
        content: '내용',
        tags: ['React', 'Vue'],
      });
    });

    // 이슈 11 시나리오 6
    it('should 서버 응답(tags 포함) 노트를 notes 상태에 추가한다 when 생성에 성공할 때', async () => {
      mockFetch({ ok: true, body: serverNote });
      const { result } = await renderLoaded();

      await act(() => result.current.createNote('제목', '내용', ['React', 'Vue']));

      expect(result.current.notes).toEqual([serverNote]);
    });

    // 이슈 11 시나리오 7
    it('should 기존처럼 동작한다 when tags 인자를 생략할 때', async () => {
      const noTagsNote = { ...serverNote, tags: undefined };
      mockFetch({ ok: true, body: noTagsNote });
      const { result } = await renderLoaded();

      await act(() => result.current.createNote('제목', '내용'));

      expect(getPostBody()).toMatchObject({ title: '제목', content: '내용' });
      expect(result.current.notes).toHaveLength(1);
    });

    // 이슈 11 시나리오 8
    it('should notes 상태를 바꾸지 않고 에러를 호출자에게 전파한다 when api.createNote가 실패할 때', async () => {
      mockFetch({ ok: false });
      const { result } = await renderLoaded();

      await expect(act(() => result.current.createNote('제목', '내용', ['React']))).rejects.toThrow(
        'Failed to create note',
      );
      expect(result.current.notes).toEqual([]);
    });
  });
});
