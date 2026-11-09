import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagFilter } from './TagFilter';

describe('TagFilter', () => {
  // 시나리오 11
  it('should 태그마다 버튼 하나를 렌더링한다 when tags가 비어 있지 않다', () => {
    render(<TagFilter tags={['react', 'study']} selectedTag={null} onToggle={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'react' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'study' })).toBeInTheDocument();
  });

  // 시나리오 12
  it('should 선택된 태그 칩에만 aria-pressed true를 설정한다 when selectedTag가 tags 중 하나와 같다', () => {
    render(<TagFilter tags={['react', 'study']} selectedTag="react" onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'react' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'study' })).toHaveAttribute('aria-pressed', 'false');
  });

  // 시나리오 13
  it('should 해당 태그로 onToggle을 호출한다 when 칩을 클릭한다', async () => {
    const onToggle = vi.fn();
    render(<TagFilter tags={['react', 'study']} selectedTag={null} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: 'study' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('study');
  });

  // 시나리오 14
  it('should 모든 칩의 aria-pressed를 false로 설정한다 when selectedTag가 null이다', () => {
    render(<TagFilter tags={['react', 'study']} selectedTag={null} onToggle={vi.fn()} />);

    screen.getAllByRole('button').forEach((chip) => {
      expect(chip).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // 시나리오 15
  it('should 칩 옆에 노트 개수를 표시하지 않는다 when 태그들을 렌더링한다', () => {
    render(<TagFilter tags={['react', 'study']} selectedTag={null} onToggle={vi.fn()} />);

    screen.getAllByRole('button').forEach((chip) => {
      expect(chip.textContent).not.toMatch(/\d/);
    });
  });

  // 시나리오 16
  it('should 아무것도 렌더링하지 않는다 when tags가 빈 배열이다', () => {
    const { container } = render(<TagFilter tags={[]} selectedTag={null} onToggle={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
