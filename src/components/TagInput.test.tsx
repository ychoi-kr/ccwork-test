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
});
