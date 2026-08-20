import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('mounts the hub shell with the brand wordmark', () => {
    render(<App />);
    expect(screen.getByRole('img', { name: 'Captain Corgi Hub' })).toBeInTheDocument();
    expect(screen.getByText('Hub home', { selector: '.crumb' })).toBeInTheDocument();
  });
});
