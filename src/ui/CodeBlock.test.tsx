import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeBlock } from './CodeBlock';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CodeBlock', () => {
  it('shows the language chip and data-language attribute', () => {
    const { container } = render(<CodeBlock code="SELECT 1" language="sql" />);
    expect(screen.getByText('sql').className).toBe('codeblock-lang');
    expect(container.querySelector('code')?.getAttribute('data-language')).toBe('sql');
  });

  it('prefers an explicit label over the language id', () => {
    render(<CodeBlock code="x" language="text" label="Terminal" />);
    expect(screen.getByText('Terminal')).toBeInTheDocument();
  });

  it('falls back to "code" without a language', () => {
    render(<CodeBlock code="plain" />);
    expect(screen.getByText('code')).toBeInTheDocument();
  });

  it('omits data-language and the language class when no language is given', () => {
    const { container } = render(<CodeBlock code="plain" />);
    const code = container.querySelector('code');
    expect(code?.getAttribute('data-language')).toBeNull();
    expect(code?.className).toBe('hljs');
  });

  it('highlights registered languages into hljs token spans', () => {
    const { container } = render(<CodeBlock code="SELECT id FROM t" language="sql" />);
    expect(container.querySelectorAll('.hljs-keyword').length).toBeGreaterThan(0);
    expect(container.querySelector('code')?.textContent).toBe('SELECT id FROM t');
  });

  it('renders unknown languages as plain text — never crashes', () => {
    const { container } = render(<CodeBlock code="garbled ~~~" language="not-a-language" />);
    expect(container.querySelectorAll('.hljs-keyword')).toHaveLength(0);
    expect(container.querySelector('code')?.textContent).toBe('garbled ~~~');
  });

  it('copies the code and confirms, then resets', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock code="SELECT 1" language="sql" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await act(async () => {}); // flush the clipboard microtask
    expect(writeText).toHaveBeenCalledWith('SELECT 1');
    expect(screen.getByText('Copied')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('survives a clipboard that throws', () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<CodeBlock code="SELECT 1" language="sql" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(screen.getByText('Copy')).toBeInTheDocument(); // still fine, just not copied
  });
});
