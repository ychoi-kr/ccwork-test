import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  const renderInput = (tags: string[], onAdd = vi.fn()) =>
    render(<TagInput tags={tags} onAdd={onAdd} onRemove={vi.fn()} />);

  // 시나리오 13
  it('should 태그 입력창과 전달받은 tags의 칩 목록을 렌더링한다 when tags가 ["React", "Vue"]이다', () => {
    renderInput(['React', 'Vue']);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  // 시나리오 14
  it('should 칩 없이 입력창만 렌더링한다 when tags가 []이다', () => {
    renderInput([]);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  // 시나리오 15
  it('should 칩을 tags 배열 순서대로 표시한다 when tags가 ["React", "Vue"]이다', () => {
    renderInput(['React', 'Vue']);

    const chips = screen.getAllByText(/^(React|Vue)$/);
    expect(chips.map((c) => c.textContent)).toEqual(['React', 'Vue']);
  });

  // 시나리오 16
  it('should 입력창에 maxLength 15를 설정한다 when 렌더링된다', () => {
    renderInput([]);

    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '15');
  });

  // 시나리오 17
  it('should onAdd를 입력값으로 호출하고 입력창을 비운다 when 입력창에 React를 입력하고 Enter를 누른다', async () => {
    const onAdd = vi.fn();
    renderInput([], onAdd);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'React{Enter}');

    expect(onAdd).toHaveBeenCalledWith('React');
    expect(input).toHaveValue('');
  });

  // 시나리오 18
  it('should 폼 submit을 일으키지 않는다 when 폼 안에서 Enter를 누른다', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <TagInput tags={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
        <button type="submit">제출</button>
      </form>,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'React' } });
    // keyDown의 기본 동작(submit)이 막혔는지 확인: fireEvent는 취소되지 않았을 때 true를 반환한다
    const notPrevented = fireEvent.keyDown(input, { key: 'Enter' });

    expect(notPrevented).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // 시나리오 35
  it('should 입력값을 15자로 제한한다 when 20자를 입력한다', async () => {
    renderInput([]);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'a'.repeat(20));

    expect(input).toHaveValue('a'.repeat(15));
  });

  describe('태그 삭제', () => {
    const renderWithRemove = (tags: string[], onRemove = vi.fn(), onAdd = vi.fn()) =>
      render(<TagInput tags={tags} onAdd={onAdd} onRemove={onRemove} />);

    // TAG-3 시나리오 7
    it('should 태그마다 X 버튼을 렌더링한다 when tags가 여러 개다', () => {
      renderWithRemove(['React', 'Vue', 'Node']);

      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    // TAG-3 시나리오 8
    it("should X 버튼의 접근 가능한 이름이 '{태그} 태그 삭제'이다 when tags에 'React'가 있다", () => {
      renderWithRemove(['React']);

      expect(screen.getByRole('button', { name: 'React 태그 삭제' })).toBeInTheDocument();
    });

    // TAG-3 시나리오 9
    it('should onRemove를 해당 태그 값으로 한 번 호출한다 when "Vue" 칩의 X 버튼을 클릭한다', async () => {
      const onRemove = vi.fn();
      renderWithRemove(['React', 'Vue'], onRemove);

      await userEvent.click(screen.getByRole('button', { name: 'Vue 태그 삭제' }));

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith('Vue');
    });

    // TAG-3 시나리오 10
    it('should onRemove를 호출한다 when X 버튼에 포커스를 두고 Enter를 누른다', async () => {
      const onRemove = vi.fn();
      renderWithRemove(['React'], onRemove);

      screen.getByRole('button', { name: 'React 태그 삭제' }).focus();
      await userEvent.keyboard('{Enter}');

      expect(onRemove).toHaveBeenCalledWith('React');
    });

    // TAG-3 시나리오 11
    it('should onRemove를 호출한다 when X 버튼에 포커스를 두고 Space를 누른다', async () => {
      const onRemove = vi.fn();
      renderWithRemove(['React'], onRemove);

      screen.getByRole('button', { name: 'React 태그 삭제' }).focus();
      await userEvent.keyboard(' ');

      expect(onRemove).toHaveBeenCalledWith('React');
    });

    // TAG-3 시나리오 12
    it('should Tab 이동으로 X 버튼에 포커스가 닿는다 when 키보드로 칩 영역을 탐색한다', async () => {
      renderWithRemove(['React']);

      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'React 태그 삭제' })).toHaveFocus();
    });

    // TAG-3 시나리오 13
    it('should X 버튼을 렌더링하지 않는다 when tags가 빈 배열이다', () => {
      renderWithRemove([]);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    // TAG-3 시나리오 14
    it("should 한글·공백 포함 태그도 '{태그} 태그 삭제' 이름의 버튼을 제공한다 when 태그가 '리액트 훅'이다", () => {
      renderWithRemove(['리액트 훅']);

      expect(screen.getByRole('button', { name: '리액트 훅 태그 삭제' })).toBeInTheDocument();
    });

    // TAG-3 시나리오 15
    it('should 폼 submit이 발생하지 않는다 when 폼 안에서 X 버튼을 클릭한다', async () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <TagInput tags={['React']} onAdd={vi.fn()} onRemove={vi.fn()} />
        </form>,
      );

      await userEvent.click(screen.getByRole('button', { name: 'React 태그 삭제' }));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    // TAG-3 시나리오 16
    it('should onAdd를 호출하지 않는다 when X 버튼을 클릭한다', async () => {
      const onAdd = vi.fn();
      renderWithRemove(['React'], vi.fn(), onAdd);

      await userEvent.click(screen.getByRole('button', { name: 'React 태그 삭제' }));

      expect(onAdd).not.toHaveBeenCalled();
    });
  });
});
