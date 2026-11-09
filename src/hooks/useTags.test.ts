import { act, renderHook } from '@testing-library/react';
import { useTags } from './useTags';

describe('useTags', () => {
  // 시나리오 1
  it('should 초기 태그 배열을 tags로 노출한다 when initialTags가 ["React"]로 주어진다', () => {
    const { result } = renderHook(() => useTags(['React']));

    expect(result.current.tags).toEqual(['React']);
  });

  // 시나리오 6
  it('should 빈 배열로 시작한다 when initialTags가 []이다', () => {
    const { result } = renderHook(() => useTags([]));

    expect(result.current.tags).toEqual([]);
  });

  describe('addTag', () => {
    // 시나리오 2
    it('should 태그를 배열 맨 뒤에 추가한다 when 기존 태그 React가 있고 Vue를 추가한다', () => {
      const { result } = renderHook(() => useTags(['React']));

      act(() => result.current.addTag('Vue'));

      expect(result.current.tags).toEqual(['React', 'Vue']);
    });

    // 시나리오 3
    it('should 추가한 순서대로 유지한다 when React, Vue를 차례로 추가한다', () => {
      const { result } = renderHook(() => useTags([]));

      act(() => result.current.addTag('React'));
      act(() => result.current.addTag('Vue'));

      expect(result.current.tags).toEqual(['React', 'Vue']);
    });

    // 시나리오 4
    it('should 앞뒤 공백을 제거한 값을 추가한다 when " React "를 추가한다', () => {
      const { result } = renderHook(() => useTags([]));

      act(() => result.current.addTag(' React '));

      expect(result.current.tags).toEqual(['React']);
    });
  });

  describe('resetTags', () => {
    // 시나리오 5
    it('should 상태를 전달받은 배열로 교체한다 when resetTags(["Vue"])를 호출한다', () => {
      const { result } = renderHook(() => useTags(['React']));

      act(() => result.current.resetTags(['Vue']));

      expect(result.current.tags).toEqual(['Vue']);
    });

    // 시나리오 7
    it('should 태그를 비운다 when resetTags([])를 호출한다', () => {
      const { result } = renderHook(() => useTags(['React']));

      act(() => result.current.resetTags([]));

      expect(result.current.tags).toEqual([]);
    });
  });
});
