import { fireEvent, render, screen } from '@testing-library/react';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: '1',
    title: '제목',
    content: '내용',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('NoteItem 태그 배지', () => {
  const onSelect = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    onSelect.mockClear();
    onDelete.mockClear();
  });

  function renderItem(note: Note) {
    return render(
      <NoteItem note={note} isSelected={false} onSelect={onSelect} onDelete={onDelete} />,
    );
  }

  // 시나리오 1
  it('should 저장된 순서대로 태그마다 배지를 하나씩 렌더한다 when 노트에 태그가 있다', () => {
    const { container } = renderItem(makeNote({ tags: ['react', 'study'] }));

    const badges = Array.from(container.querySelectorAll('span')).filter((el) =>
      ['react', 'study'].includes(el.textContent ?? ''),
    );
    expect(badges.map((el) => el.textContent)).toEqual(['react', 'study']);
  });

  // 시나리오 2
  it('should onSelect를 노트 id로 호출한다 when 배지를 클릭한다', () => {
    renderItem(makeNote({ id: 'n1', tags: ['react'] }));

    fireEvent.click(screen.getByText('react'));

    expect(onSelect).toHaveBeenCalledWith('n1');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  // 시나리오 3
  it('should 배지 영역을 렌더하지 않는다 when tags가 빈 배열이다', () => {
    const { container } = renderItem(makeNote({ tags: [] }));

    expect(screen.getByText('내용')).toBeInTheDocument();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  // 시나리오 4
  it('should 배지 영역을 렌더하지 않고 에러가 없다 when tags 필드가 없다', () => {
    const { container } = renderItem(makeNote());

    expect(screen.getByText('내용')).toBeInTheDocument();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  // 시나리오 5
  it('should 모든 배지를 "+N" 접기 없이 렌더한다 when 태그가 많다', () => {
    const tags = Array.from({ length: 12 }, (_, i) => `tag${i}`);
    renderItem(makeNote({ tags }));

    tags.forEach((tag) => expect(screen.getByText(tag)).toBeInTheDocument());
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  // 시나리오 6
  it('should 배지를 버튼으로 렌더하지 않고 삭제 버튼의 stopPropagation을 유지한다 when 태그가 표시된다', () => {
    renderItem(makeNote({ id: 'n1', tags: ['react', 'study'] }));

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'react' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'study' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onDelete).toHaveBeenCalledWith('n1');
    expect(onSelect).not.toHaveBeenCalled();
  });

  // 시나리오 7
  it('should 중복 태그를 별도 배지로 렌더하고 에러가 없다 when 같은 문자열이 두 번 있다', () => {
    renderItem(makeNote({ tags: ['react', 'react'] }));

    expect(screen.getAllByText('react')).toHaveLength(2);
  });
});
