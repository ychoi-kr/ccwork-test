import { useState } from 'react';

export function useTagInput(onAdd: (raw: string) => void) {
  const [text, setText] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value);
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    onAdd(text);
    setText('');
  };

  return { text, onChange, onKeyDown };
}
