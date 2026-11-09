import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { NotesProvider } from '../notes/NotesContext';
import { Note } from '../types/note';

const makeNote = (id: string, title: string, tags?: string[]): Note => ({
  id,
  title,
  content: `${title} 내용`,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...(tags ? { tags } : {}),
});

const notes = [
  makeNote('1', '리액트 노트', ['react', 'study']),
  makeNote('2', '뷰 노트', ['vue']),
  makeNote('3', '리액트 두번째', ['react']),
];

const stubNotesFetch = (data: Note[]) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) })),
  );

const renderSidebar = (onSelect = vi.fn(), selectedNoteId: string | null = null) =>
  render(
    <NotesProvider>
      <Sidebar selectedNoteId={selectedNoteId} onSelect={onSelect} />
    </NotesProvider>,
  );

describe('Sidebar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 시나리오 22
  it('should 노트 목록 위에 태그 칩을 보여 준다 when 태그가 있는 노트를 불러왔다', async () => {
    stubNotesFetch(notes);
    renderSidebar();

    const chip = await screen.findByRole('button', { name: 'react' });
    const firstCard = await screen.findByRole('heading', { name: '리액트 노트' });

    expect(screen.getByRole('button', { name: 'study' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'vue' })).toBeInTheDocument();
    expect(chip.compareDocumentPosition(firstCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // 시나리오 23
  it('should 그 태그가 달린 노트만 보여 주고 "노트 N개"를 갱신한다 when 칩을 클릭한다', async () => {
    stubNotesFetch(notes);
    renderSidebar();
    await screen.findByText('노트 3개');

    await userEvent.click(await screen.findByRole('button', { name: 'react' }));

    expect(screen.getByText('노트 2개')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '리액트 노트' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '리액트 두번째' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '뷰 노트' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'react' })).toHaveAttribute('aria-pressed', 'true');
  });

  // 시나리오 24
  it('should 필터를 다른 태그로 교체하고 이전 칩을 해제한다 when 다른 칩을 클릭한다', async () => {
    stubNotesFetch(notes);
    renderSidebar();
    await userEvent.click(await screen.findByRole('button', { name: 'react' }));

    await userEvent.click(screen.getByRole('button', { name: 'vue' }));

    expect(screen.getByText('노트 1개')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '뷰 노트' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '리액트 노트' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'vue' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'react' })).toHaveAttribute('aria-pressed', 'false');
  });

  // 시나리오 25
  it('should 전체 노트를 다시 보여 주고 칩을 해제한다 when 선택된 칩을 다시 클릭한다', async () => {
    stubNotesFetch(notes);
    renderSidebar();
    const chip = await screen.findByRole('button', { name: 'react' });
    await userEvent.click(chip);

    await userEvent.click(screen.getByRole('button', { name: 'react' }));

    expect(screen.getByText('노트 3개')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '뷰 노트' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'react' })).toHaveAttribute('aria-pressed', 'false');
  });

  // 시나리오 26
  it('should 해당 노트 id로 onSelect를 호출한다 when 노트 카드를 클릭한다', async () => {
    stubNotesFetch(notes);
    const onSelect = vi.fn();
    renderSidebar(onSelect, '2');

    await userEvent.click(await screen.findByRole('heading', { name: '뷰 노트' }));

    expect(onSelect).toHaveBeenCalledWith('2');
  });

  // 시나리오 27
  it('should 태그 칩 없이 전체 목록을 유지한다 when 어떤 노트에도 태그가 없다', async () => {
    stubNotesFetch([makeNote('1', '태그 없는 노트'), makeNote('2', 'tags 필드 없는 노트', [])]);
    renderSidebar();

    expect(await screen.findByText('노트 2개')).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { pressed: false })).toHaveLength(0);
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  // 시나리오 28
  it('should 태그 칩을 보여 주지 않는다 when 노트를 불러오는 중이다', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    renderSidebar();

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { pressed: false })).toHaveLength(0);
  });

  // 시나리오 29
  it('should 태그 칩 없이 오류 문구를 보여 준다 when 노트 불러오기에 실패한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) })),
    );
    renderSidebar();

    expect(await screen.findByText('오류: Failed to fetch notes')).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { pressed: false })).toHaveLength(0);
  });
});
