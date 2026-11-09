import { createNote, updateNote } from './notes';

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

describe('createNote', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 이슈 11 시나리오 1
  it('should POST 본문에 tags를 포함해 전송한다 when tags가 있는 노트를 전달할 때', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await createNote({ title: '제목', content: '내용', tags: ['React', 'Vue'] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3001/notes');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      title: '제목',
      content: '내용',
      tags: ['React', 'Vue'],
    });
  });

  // 이슈 11 시나리오 2
  it('should 본문에 tags 키를 넣지 않는다 when tags 없이 호출할 때', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await createNote({ title: '제목', content: '내용' });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('tags');
  });

  // 이슈 11 시나리오 3
  it('should tags를 빈 배열 그대로 전송한다 when tags가 []일 때', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await createNote({ title: '제목', content: '내용', tags: [] });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).tags).toEqual([]);
  });

  // 이슈 11 시나리오 4
  it("should Error('Failed to create note')를 throw한다 when 응답이 !res.ok일 때", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(createNote({ title: '제목', content: '내용' })).rejects.toThrow(
      'Failed to create note',
    );
  });
});
