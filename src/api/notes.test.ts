import { updateNote } from './notes';

describe('updateNote', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 시나리오 33
  it('should Error("Failed to update note")를 throw한다 when 응답이 !res.ok이다', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(updateNote('1', { title: '제목' })).rejects.toThrow('Failed to update note');
  });

  // 시나리오 34
  it('should PATCH 본문에 title, content, tags를 포함한다 when tags를 넘겨 호출한다', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await updateNote('1', { title: '제목', content: '내용', tags: ['React', 'Vue'] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/notes/1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toMatchObject({
      title: '제목',
      content: '내용',
      tags: ['React', 'Vue'],
    });
  });
});
