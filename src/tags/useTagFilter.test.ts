import { act, renderHook } from '@testing-library/react';
import { useTagFilter } from './useTagFilter';
import { Note } from '../types/note';

const makeNote = (id: string, tags?: string[]): Note => ({
  id,
  title: `노트 ${id}`,
  content: '',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...(tags ? { tags } : {}),
});

describe('useTagFilter', () => {
  // 시나리오 1
  it('should 중복 없이 가나다순으로 정렬된 tags를 반환한다 when 노트들이 서로 다른 태그를 가진다', () => {
    const notes = [makeNote('1', ['study', 'react']), makeNote('2', ['vue', 'react'])];

    const { result } = renderHook(() => useTagFilter(notes));

    expect(result.current.tags).toEqual(['react', 'study', 'vue']);
  });

  // 시나리오 2
  it('should selectedTag가 null이고 filteredNotes가 전체 노트다 when 태그를 한 번도 누르지 않았다', () => {
    const notes = [makeNote('1', ['react']), makeNote('2', ['vue'])];

    const { result } = renderHook(() => useTagFilter(notes));

    expect(result.current.selectedTag).toBeNull();
    expect(result.current.filteredNotes).toEqual(notes);
  });

  // 시나리오 3
  it('should selectedTag를 설정하고 그 태그가 달린 노트만 원래 순서로 남긴다 when 태그로 toggleTag를 호출한다', () => {
    const notes = [
      makeNote('1', ['react']),
      makeNote('2', ['vue']),
      makeNote('3', ['react', 'vue']),
    ];
    const { result } = renderHook(() => useTagFilter(notes));

    act(() => result.current.toggleTag('react'));

    expect(result.current.selectedTag).toBe('react');
    expect(result.current.filteredNotes.map((n) => n.id)).toEqual(['1', '3']);
  });

  // 시나리오 4
  it('should selectedTag와 filteredNotes를 교체한다 when 다른 태그로 toggleTag를 호출한다', () => {
    const notes = [makeNote('1', ['react']), makeNote('2', ['vue'])];
    const { result } = renderHook(() => useTagFilter(notes));
    act(() => result.current.toggleTag('react'));

    act(() => result.current.toggleTag('vue'));

    expect(result.current.selectedTag).toBe('vue');
    expect(result.current.filteredNotes.map((n) => n.id)).toEqual(['2']);
  });

  // 시나리오 5
  it('should selectedTag를 null로 되돌리고 전체 노트를 반환한다 when 이미 선택된 태그로 toggleTag를 호출한다', () => {
    const notes = [makeNote('1', ['react']), makeNote('2', ['vue'])];
    const { result } = renderHook(() => useTagFilter(notes));
    act(() => result.current.toggleTag('react'));

    act(() => result.current.toggleTag('react'));

    expect(result.current.selectedTag).toBeNull();
    expect(result.current.filteredNotes).toEqual(notes);
  });

  // 시나리오 6
  it('should tags 필드가 없는 노트를 태그 없는 노트로 취급한다 when 일부 노트에 tags가 없다', () => {
    const notes = [makeNote('1'), makeNote('2', ['react'])];

    const { result } = renderHook(() => useTagFilter(notes));

    expect(result.current.tags).toEqual(['react']);
    act(() => result.current.toggleTag('react'));
    expect(result.current.filteredNotes.map((n) => n.id)).toEqual(['2']);
  });

  // 시나리오 7
  it('should 빈 tags와 빈 filteredNotes를 반환한다 when notes가 빈 배열이다', () => {
    const { result } = renderHook(() => useTagFilter([]));

    expect(result.current.tags).toEqual([]);
    expect(result.current.filteredNotes).toEqual([]);
  });

  // 시나리오 8
  it('should 그 태그를 한 번만 나열한다 when 여러 노트가 같은 태그를 가진다', () => {
    const notes = [makeNote('1', ['react']), makeNote('2', ['react']), makeNote('3', ['react'])];

    const { result } = renderHook(() => useTagFilter(notes));

    expect(result.current.tags).toEqual(['react']);
  });

  // 시나리오 9
  it('should 한국어 로케일 순서로 정렬한다 when 한글과 영문 태그가 섞여 있다', () => {
    const notes = [makeNote('1', ['나다', 'vue']), makeNote('2', ['가나', 'react'])];

    const { result } = renderHook(() => useTagFilter(notes));

    expect(result.current.tags).toEqual(
      ['가나', '나다', 'react', 'vue'].sort((a, b) => a.localeCompare(b, 'ko')),
    );
  });

  // 시나리오 10
  it('should selectedTag를 설정하고 filteredNotes가 빈 배열이다 when 어떤 노트에도 없는 태그로 toggleTag를 호출한다', () => {
    const notes = [makeNote('1', ['react'])];
    const { result } = renderHook(() => useTagFilter(notes));

    act(() => result.current.toggleTag('없는태그'));

    expect(result.current.selectedTag).toBe('없는태그');
    expect(result.current.filteredNotes).toEqual([]);
  });
});
