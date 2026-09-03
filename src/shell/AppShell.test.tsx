import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import AppShell from './AppShell';
import { emptySubjectData, useSubjectDataStore } from '../engines/subject-store';

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
  useSubjectDataStore.setState({
    streak: { current: 0, longest: 0 },
    achievements: [],
    subjects: {},
  });
});

describe('AppShell', () => {
  it('shows the star and the wordmark in the rail brand', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(screen.getByRole('img', { name: 'Captain Corgi Learning Hub' })).toBeInTheDocument();
    expect(document.querySelector('.brand .wordmark')).not.toBeNull();
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

  it('marks the active subject link', () => {
    render(
      <AppShell route={{ view: 'subject', subjectId: 'gh-900' }}>
        <p>view</p>
      </AppShell>,
    );
    const active = screen.getByRole('link', { name: /GH-900/ });
    expect(active).toHaveClass('on');
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /DP-800/ })).not.toHaveClass('on');
  });

  it('shows completion percentages on every subject link', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    const subjects = screen.getAllByRole('link', { name: /complete$/ });
    expect(subjects.length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /DP-800, 0% complete/ })).toBeInTheDocument();
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

  it('shows the hub streak count in the header', () => {
    useSubjectDataStore.setState({ streak: { current: 4, longest: 9 } });
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    const chip = screen.getByTitle('4-day learning streak');
    expect(chip).toHaveTextContent('4');
  });

  it('renders the theme switcher inside the topbar', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(document.querySelector('.topbar .cc-theme-toggle')).not.toBeNull();
  });

  it('shows the topbar search', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    expect(screen.getByRole('combobox', { name: 'Search the hub' })).toBeInTheDocument();
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

describe('AppShell review rail link', () => {
  const dueDeck = (count: number) => ({
    fixture: {
      ...emptySubjectData(),
      srs: Object.fromEntries(
        Array.from({ length: count }, (_, i) => [
          `q-${i}`,
          {
            questionId: `q-${i}`,
            box: 1,
            due: new Date(Date.now() - 86_400_000).toISOString(),
            lastSeen: new Date().toISOString(),
            timesCorrect: 0,
            timesWrong: 1,
          },
        ]),
      ),
    },
  });

  it('hides the badge when nothing is due', () => {
    render(
      <AppShell route={{ view: 'home' }}>
        <p>view</p>
      </AppShell>,
    );
    const link = screen.getByRole('link', { name: 'Spaced review' });
    expect(link).toHaveAttribute('href', '#/review');
    expect(document.querySelector('.navi-badge')).toBeNull();
  });

  it('shows the due count as a badge and in the accessible name', () => {
    useSubjectDataStore.setState({ subjects: dueDeck(3) });
    render(
      <AppShell route={{ view: 'review' }}>
        <p>view</p>
      </AppShell>,
    );
    const link = screen.getByRole('link', { name: 'Spaced review — 3 due' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
