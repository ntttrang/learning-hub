import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import AppShell from './AppShell';

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
});

describe('AppShell', () => {
  it('shows the star and the wordmark in the rail brand', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(screen.getByRole('img', { name: 'Captain Corgi Hub' })).toBeInTheDocument();
    expect(document.querySelector('img[src="brand/icons/star.svg"]')).not.toBeNull();
  });

  it('shows the hub-crew avatar in the rail footer', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(
      document.querySelector('img[src="brand/captain-corgi-hub-avatar.png"]'),
    ).not.toBeNull();
  });

  it('breadcrumbs hub home and subject workspaces', () => {
    const home = render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(screen.getByText('Hub home', { selector: '.crumb' })).toBeInTheDocument();

    home.rerender(
      <AppShell route={{ view: 'subject', subjectId: 'gh-200' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(screen.getByText('GH-200 workspace')).toBeInTheDocument();

    home.rerender(
      <AppShell route={{ view: 'subject', subjectId: 'not-a-subject' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(screen.getByText('Subject workspace')).toBeInTheDocument();
  });

  it('marks the active subject link', () => {
    render(
      <AppShell route={{ view: 'subject', subjectId: 'gh-900' }}>
        <p>view</p>
      </AppShell>,
    );
    const active = screen.getByRole('link', { name: 'GH-900' });
    expect(active).toHaveClass('on');
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'DP-800' })).not.toHaveClass('on');
  });

  it('toggles the mobile navigation drawer', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    const menu = screen.getByRole('button', { name: 'Open navigation' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the hub home link as the current page on home', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(screen.getByRole('link', { name: 'Hub home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('closes the drawer with Escape', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    const menu = screen.getByRole('button', { name: 'Open navigation' });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('AppShell focus rescue', () => {
  it('parks focus on the main region when a route change unmounts the focused element', () => {
    const view = render(
      <AppShell route={{ view: 'home' }}>
        <a id="leaving-link" href="#/subject/fixture/learn">
          A content link
        </a>
      </AppShell>,
    );
    const link = document.getElementById('leaving-link') as HTMLAnchorElement;
    link.focus();
    expect(document.activeElement).toBe(link);

    // Simulate what a hash navigation does: the link unmounts, route changes.
    view.rerender(
      <AppShell route={{ view: 'subject', subjectId: 'fixture', mode: 'learn' }}>
        <p>The learn view</p>
      </AppShell>,
    );
    expect(document.activeElement?.tagName).toBe('MAIN');
  });

  it('never steals focus that survived on shell chrome', () => {
    const view = render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    const menuBtn = screen.getByRole('button', { name: 'Open navigation' });
    menuBtn.focus();

    view.rerender(
      <AppShell route={{ view: 'subject', subjectId: 'fixture', mode: 'learn' }}>
        <p>The learn view</p>
      </AppShell>,
    );
    expect(document.activeElement).toBe(menuBtn);
  });
});
