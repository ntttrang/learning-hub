import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import TopbarSearch from './TopbarSearch';

beforeEach(() => {
  window.location.hash = '';
});

describe('TopbarSearch', () => {
  it('focuses the input on ⌘K from anywhere', () => {
    render(<TopbarSearch />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('finds a subject by code prefix and navigates on Enter', () => {
    render(<TopbarSearch />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'gh-2' } });

    const option = screen.getByRole('option', { name: /GH-200/ });
    expect(option).toHaveAttribute('href', '#/subject/gh-200');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(window.location.hash).toBe('#/subject/gh-200');
    // Navigating closes the popover and clears the query.
    expect(screen.queryByRole('option')).toBeNull();
  });

  it('shows an honest empty state for a query that matches nothing', () => {
    render(<TopbarSearch />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzz-no-such-thing' } });
    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });

  it('shows nothing for a blank query', () => {
    render(<TopbarSearch />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '   ' } });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
