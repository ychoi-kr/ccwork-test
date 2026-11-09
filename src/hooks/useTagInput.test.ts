import type { ChangeEvent, KeyboardEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useTagInput } from './useTagInput';

const changeEvent = (value: string) =>
  ({ target: { value } }) as unknown as ChangeEvent<HTMLInputElement>;

const keyEvent = (key: string) =>
  ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent<HTMLInputElement>;

describe('useTagInput', () => {
  describe('onChange', () => {
    // 시나리오 8
    it('should text를 입력값으로 갱신한다 when 입력창에 React를 입력한다', () => {
      const { result } = renderHook(() => useTagInput(vi.fn()));

      act(() => result.current.onChange(changeEvent('React')));

      expect(result.current.text).toBe('React');
    });
  });

  describe('onKeyDown', () => {
    // 시나리오 9
    it('should onAdd를 입력 텍스트로 호출하고 text를 비운다 when Enter를 누른다', () => {
      const onAdd = vi.fn();
      const { result } = renderHook(() => useTagInput(onAdd));
      act(() => result.current.onChange(changeEvent('React')));

      act(() => result.current.onKeyDown(keyEvent('Enter')));

      expect(onAdd).toHaveBeenCalledWith('React');
      expect(result.current.text).toBe('');
    });

    // 시나리오 10
    it('should preventDefault를 호출한다 when Enter를 누른다', () => {
      const { result } = renderHook(() => useTagInput(vi.fn()));
      const e = keyEvent('Enter');

      act(() => result.current.onKeyDown(e));

      expect(e.preventDefault).toHaveBeenCalled();
    });

    // 시나리오 11
    it('should onAdd와 preventDefault를 호출하지 않는다 when Enter가 아닌 키를 누른다', () => {
      const onAdd = vi.fn();
      const { result } = renderHook(() => useTagInput(onAdd));
      const e = keyEvent('a');

      act(() => result.current.onKeyDown(e));

      expect(onAdd).not.toHaveBeenCalled();
      expect(e.preventDefault).not.toHaveBeenCalled();
    });

    // 시나리오 12
    it('should 앞뒤 공백이 포함된 텍스트 그대로 onAdd에 전달한다 when " React "를 입력하고 Enter를 누른다', () => {
      const onAdd = vi.fn();
      const { result } = renderHook(() => useTagInput(onAdd));
      act(() => result.current.onChange(changeEvent(' React ')));

      act(() => result.current.onKeyDown(keyEvent('Enter')));

      expect(onAdd).toHaveBeenCalledWith(' React ');
    });
  });
});
