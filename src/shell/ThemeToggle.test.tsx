import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useHubStore } from '../engines/store';
import { THEME_KEY } from '../engines/theme';
import ThemeToggle from './ThemeToggle';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  useHubStore.setState({ theme: 'auto' });
});

describe('ThemeToggle', () => {
  it('renders the four modes', () => {
    render(<ThemeToggle />);
    for (const label of ['Auto', 'Light', 'Dark', 'Night']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('marks the active mode', () => {
    useHubStore.setState({ theme: 'dark' });
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Night' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('clicking Night applies it to the document and persists it', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Night' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('night');
  });

  it('shadows the OS-resolved concrete mode when set to auto', () => {
    render(<ThemeToggle />);
    // jsdom reports a light OS scheme, so the ring lands on Light — the
    // concrete mode auto resolves to — never on the Auto button itself.
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute(
      'data-auto-shadow',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Auto' })).not.toHaveAttribute(
      'data-auto-shadow',
    );
    expect(screen.getByRole('button', { name: 'Dark' })).not.toHaveAttribute(
      'data-auto-shadow',
    );
  });
});
