import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BreakdownBar } from './BreakdownBar';

describe('BreakdownBar', () => {
  it('renders label, caption, count, and the accessible bar', () => {
    render(<BreakdownBar label="D1 · Core concepts" caption="35-40%" correct={3} total={4} />);

    expect(screen.getByText('D1 · Core concepts')).toBeInTheDocument();
    expect(screen.getByText('35-40%')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('75');
    expect(bar.getAttribute('aria-label')).toBe('D1 · Core concepts: 3 of 4 correct');
  });

  it('degrades honestly at zero total', () => {
    render(<BreakdownBar label="Empty domain" correct={0} total={0} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});
