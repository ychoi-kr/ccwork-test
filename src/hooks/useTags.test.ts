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

  describe('removeTag', () => {
    // TAG-3 시나리오 1
    it('should 지정한 태그만 제거하고 나머지 순서를 유지한다 when tags가 ["React","Vue","Node"]이고 "Vue"를 전달한다', () => {
      const { result } = renderHook(() => useTags(['React', 'Vue', 'Node']));

      act(() => result.current.removeTag('Vue'));

      expect(result.current.tags).toEqual(['React', 'Node']);
    });

    // TAG-3 시나리오 2
    it('should tags를 빈 배열로 만든다 when 마지막 남은 태그를 제거한다', () => {
      const { result } = renderHook(() => useTags(['React']));

      act(() => result.current.removeTag('React'));

      expect(result.current.tags).toEqual([]);
    });

    // TAG-3 시나리오 3
    it('should 값이 같은 항목을 모두 제거한다 when tags에 같은 값이 둘 이상 있다', () => {
      const { result } = renderHook(() => useTags(['React', 'Vue', 'React']));

      act(() => result.current.removeTag('React'));

      expect(result.current.tags).toEqual(['Vue']);
    });

    // TAG-3 시나리오 4
    it('should 대소문자가 다른 태그는 제거하지 않는다 when "react"를 전달했는데 tags에는 "React"만 있다', () => {
      const { result } = renderHook(() => useTags(['React']));

      act(() => result.current.removeTag('react'));

      expect(result.current.tags).toEqual(['React']);
    });

    // TAG-3 시나리오 5
    it('should 아무 변화도 오류도 없다 when tags에 없는 값을 전달한다', () => {
      const { result } = renderHook(() => useTags(['React', 'Vue']));

      expect(() => act(() => result.current.removeTag('Node'))).not.toThrow();

      expect(result.current.tags).toEqual(['React', 'Vue']);
    });

    // TAG-3 시나리오 6
    it('should 이후 addTag로 추가한 태그가 정상 반영된다 when 삭제 후 새 태그를 추가한다', () => {
      const { result } = renderHook(() => useTags(['React', 'Vue']));

      act(() => result.current.removeTag('React'));
      act(() => result.current.addTag('Node'));

      expect(result.current.tags).toEqual(['Vue', 'Node']);
    });
  });
});
