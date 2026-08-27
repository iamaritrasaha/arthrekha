import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ModeSwitch from './ModeSwitch';

describe('Understand and Analyse mode switch', () => {
  it('exposes a keyboard-accessible pressed state and preserves the callback context', () => {
    const onChange = vi.fn();
    render(<ModeSwitch mode="understand" onChange={onChange} />);
    expect(screen.getByRole('button', { name: /Understand/i }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Analyse/i }));
    expect(onChange).toHaveBeenCalledWith('analyse');
  });
});
