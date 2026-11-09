import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { Note } from './types/note';

const makeNote = (id: string, title: string, tags: string[]): Note => ({
  id,
  title,
  content: `${title} 내용`,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  tags,
});

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 시나리오 30
  it('should 편집기가 편집 중인 노트를 그대로 보여 준다 when 칩이 그 노트를 목록에서 숨긴다', async () => {
    const data = [makeNote('1', '리액트 노트', ['react']), makeNote('2', '뷰 노트', ['vue'])];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) })),
    );
    render(<App />);
    await userEvent.click(await screen.findByRole('heading', { name: '리액트 노트' }));
    expect(screen.getByDisplayValue('리액트 노트')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'vue' }));

    expect(screen.queryByRole('heading', { name: '리액트 노트' })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('리액트 노트')).toBeInTheDocument();
  });

  // 시나리오 31
  it('should 입력 중인 제목과 새 노트 폼을 유지한다 when 새 노트 작성 중에 칩을 클릭한다', async () => {
    const data = [makeNote('1', '리액트 노트', ['react']), makeNote('2', '뷰 노트', ['vue'])];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) })),
    );
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: '+ 새 노트' }));
    await userEvent.type(screen.getByPlaceholderText('제목'), '작성 중인 제목');

    await userEvent.click(await screen.findByRole('button', { name: 'vue' }));

    expect(screen.getByText('새 노트')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('제목')).toHaveValue('작성 중인 제목');
    expect(screen.getByText('노트 1개')).toBeInTheDocument();
  });
});
