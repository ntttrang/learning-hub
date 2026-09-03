import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { useSubjectDataStore } from '../engines/subject-store';
import App from '../App';
import { parseHash } from './router';
import { Compare } from '../ui/Compare';
import { DocResolverProvider, registryResolver } from '../ui/doc-context';
import { LabIndex } from '../ui/LabIndex';
import { LabViewer } from '../ui/LabViewer';
import { LearnIndex } from '../ui/LearnIndex';
import { LessonViewer } from '../ui/LessonViewer';

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
  document.documentElement.removeAttribute('data-theme');
});

describe('hub views', () => {
  it('hub home shows the hero, mascot, and subject cards', () => {
    render(<App />);
    expect(screen.getByText('One hub for every subject you study')).toBeInTheDocument();
    expect(
      document.querySelectorAll('img[src="brand/captain-corgi-hub-avatar.png"]').length,
    ).toBeGreaterThan(0);
    for (const code of ['FX-100', 'DP-800', 'GH-200', 'GH-900', 'GH-600']) {
      expect(screen.getByRole('heading', { name: code, level: 3 })).toBeInTheDocument();
    }
    expect(document.querySelector('img[src="github-agentic.png"]')).toBeInTheDocument();
    expect(document.querySelector('img[src="github-foundations.svg"]')).toBeInTheDocument();
    expect(document.querySelector('img[src="sql-ai-developer.jpeg"]')).toBeInTheDocument();
  });

  it('reports installed packs and placeholders honestly', () => {
    render(<App />);
    expect(screen.queryAllByText('Pack not installed')).toHaveLength(0); // every roadmap placeholder now installs
    expect(screen.getAllByText('Installed')).toHaveLength(5); // fixture + gh-200 + gh-900 + gh-600 + dp-800
  });

  it('cards and rail links point at subject workspaces', () => {
    render(<App />);
    const dpLinks = screen
      .getAllByRole('link', { name: /DP-800/ })
      .filter((link) => link.getAttribute('href') === '#/subject/dp-800');
    expect(dpLinks).toHaveLength(2); // rail + card
    const fixtureLinks = screen
      .getAllByRole('link', { name: /FX-100/ })
      .filter((link) => link.getAttribute('href') === '#/subject/fixture');
    expect(fixtureLinks).toHaveLength(2); // rail + card
  });

  it('renders the DP-800 workspace from the hash', () => {
    window.location.hash = '#/subject/dp-800';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'DP-800 study hub' })).toBeInTheDocument();
    expect(screen.queryByText('This pack is not in the hub yet')).not.toBeInTheDocument();
  });

  it('renders the installed GH-900 workspace with its six content modes', () => {
    window.location.hash = '#/subject/gh-900';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'GH-900 study hub' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Learn',
      'Labs',
      'Practice',
      'Exams',
      'Notes',
      'Revision',
    ]);
    expect(screen.queryByText('DP-800 study hub')).not.toBeInTheDocument();
  });

  it('renders the installed GH-200 workspace with its seven content modes', () => {
    window.location.hash = '#/subject/gh-200';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'GH-200 study hub' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Learn',
      'Labs',
      'Practice',
      'Exams',
      'Compare',
      'Notes',
      'Revision',
    ]);
  });

  it('renders GH-200 compare mode with both comparison datasets', () => {
    window.location.hash = '#/subject/gh-200/compare';
    render(<App />);
    expect(screen.getByText('GitHub Actions vs Jenkins')).toBeInTheDocument();
    expect(screen.getByText('GitHub Actions vs AWS CI/CD services')).toBeInTheDocument();
  });

  it('renders an Unknown subject state instead of a blank page', () => {
    window.location.hash = '#/subject/not-a-subject';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Unknown subject' })).toBeInTheDocument();
  });

  it('falls back to hub home for unknown hashes', () => {
    window.location.hash = '#/nope';
    render(<App />);
    expect(screen.getByText('One hub for every subject you study')).toBeInTheDocument();
  });

  it('clicking a subject card navigates to its workspace', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'GH-900, 0% complete' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'GH-900 study hub' })).toBeInTheDocument(),
    );
  });

  it('keeps the four-mode theme toggle available after the shell mounts', () => {
    render(<App />);
    for (const label of ['Auto', 'Light', 'Dark', 'Night']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });
});

describe('fixture workspace', () => {
  it('renders the installed fixture pack with live, registry-ordered tabs', () => {
    window.location.hash = '#/subject/fixture';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'FX-100 study hub' })).toBeInTheDocument();
    // Overview + every enabledModes tool, in registry order, all enabled.
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Learn',
      'Labs',
      'Practice',
      'Exams',
      'Compare',
      'Notes',
    ]);
    expect(tabs.every((tab) => !(tab as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.getByRole('tab', { selected: true, name: 'Overview' })).toBeInTheDocument();
  });

  it('shows the overview panel with stats and domains on landing', () => {
    window.location.hash = '#/subject/fixture';
    render(<App />);
    expect(screen.getByRole('region', { name: 'Subject overview' })).toBeInTheDocument();
    expect(screen.getByText('Course progress')).toBeInTheDocument();
    expect(screen.getByText('Domains')).toBeInTheDocument();
  });

  it('clicking a mode tab navigates to that mode route', async () => {
    window.location.hash = '#/subject/fixture';
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Learn' }));
    await waitFor(() => expect(window.location.hash).toBe('#/subject/fixture/learn'));
    expect(screen.getByText('Weight 35-40%')).toBeInTheDocument(); // learn index, not a placeholder
  });

  it('arrow keys move selection and DOM focus together', async () => {
    window.location.hash = '#/subject/fixture/learn';
    render(<App />);
    fireEvent.keyDown(screen.getByRole('tablist', { name: 'Subject modes' }), {
      key: 'ArrowRight',
    });
    await waitFor(() => expect(window.location.hash).toBe('#/subject/fixture/labs'));
    expect(document.activeElement?.textContent).toBe('Labs');
    expect(document.activeElement?.getAttribute('aria-selected')).toBe('true');
  });

  it('practice tab routes to the practice index with scope cards', () => {
    window.location.hash = '#/subject/fixture/practice';
    render(<App />);
    expect(screen.getByRole('tab', { selected: true, name: 'Practice' })).toBeInTheDocument();
    const all = screen.getByRole('link', { name: /Everything, shuffled/ });
    expect(all.getAttribute('href')).toBe('#/subject/fixture/practice/all');
    expect(screen.getByRole('link', { name: /Core concepts/ }).getAttribute('href')).toBe(
      '#/subject/fixture/practice/d1',
    );
    expect(screen.getByRole('link', { name: /Applied skills/ }).getAttribute('href')).toBe(
      '#/subject/fixture/practice/d2',
    );
  });

  it('practice run route mounts the quiz runner for the scoped bank', () => {
    window.location.hash = '#/subject/fixture/practice/d1';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Core concepts' })).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeInTheDocument();
    // The back link returns to the scope index.
    expect(screen.getByRole('link', { name: '← All scopes' }).getAttribute('href')).toBe(
      '#/subject/fixture/practice',
    );
  });

  it('unknown practice scope falls back honestly instead of a blank run', () => {
    window.location.hash = '#/subject/fixture/practice/nope';
    render(<App />);
    expect(screen.getByText('No questions in this scope')).toBeInTheDocument();
  });

  it('learn route renders the curriculum index and lesson round-trips through the lab', async () => {
    window.location.hash = '#/subject/fixture/learn';
    render(<App />);
    const lessonRow = screen.getByRole('link', { name: /Storage models/ });
    expect(lessonRow.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
    fireEvent.click(lessonRow);

    // Lesson viewer with its lab card and knowledge check.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument(),
    );
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    const labCard = screen.getByRole('link', { name: /Explore a lakehouse table/ });
    expect(labCard.getAttribute('href')).toBe('#/subject/fixture/labs/lab-explore');
    fireEvent.click(labCard);

    // Lab viewer links back to the lesson — the round-trip closes.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Explore a lakehouse table' })).toBeInTheDocument(),
    );
    const backToLesson = screen.getByRole('link', { name: 'Lesson: Storage models' });
    expect(backToLesson.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
  });

  it('labs route lists the pack’s labs', () => {
    window.location.hash = '#/subject/fixture/labs';
    render(<App />);
    expect(screen.getByRole('link', { name: 'Explore a lakehouse table' }).getAttribute('href')).toBe(
      '#/subject/fixture/labs/lab-explore',
    );
  });

  it('compare route renders the pack’s comparison with sample tabs', () => {
    window.location.hash = '#/subject/fixture/compare';
    render(<App />);
    expect(screen.getByText('Three engines, one lake')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toContain('DuckDB');
  });

  it('falls back to the overview for an unknown mode — never a blank page', () => {
    window.location.hash = '#/subject/fixture/not-a-mode';
    render(<App />);
    expect(screen.getByRole('region', { name: 'Subject overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { selected: true, name: 'Overview' })).toBeInTheDocument();
  });

  it('falls back to the overview for a valid tool the pack has not enabled', () => {
    window.location.hash = '#/subject/fixture/revision'; // real ToolId, not in enabledModes
    render(<App />);
    expect(screen.getByRole('region', { name: 'Subject overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { selected: true, name: 'Overview' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Revision' })).not.toBeInTheDocument();
  });

  it('shows the streak and a continue link from the last visited lesson', async () => {
    window.localStorage.setItem(
      'cc-subject-data',
      JSON.stringify({
        state: {
          version: 1,
          streak: { current: 3, longest: 7 },
          subjects: {
            fixture: {
              lastLessonId: 'lesson-query-shapes',
              lessons: {
                'lesson-query-shapes': { status: 'completed', lastVisited: '2026-08-19T00:00:00.000Z' },
              },
              completedLabs: [],
              quizAttempts: [],
              examAttempts: [],
            },
          },
        },
        version: 1,
      }),
    );
    await useSubjectDataStore.persist.rehydrate();
    window.location.hash = '#/subject/fixture';
    try {
      render(<App />);
      const streakStat = screen.getByText('Day streak').closest('.stat');
      expect(streakStat?.textContent).toContain('3');
      const continueLink = screen.getByRole('link', { name: /Continue where you left off/ });
      expect(continueLink.getAttribute('href')).toBe('#/subject/fixture/learn/query-shapes');
      expect(screen.getByText('Query shapes')).toBeInTheDocument();
    } finally {
      window.localStorage.clear();
      useSubjectDataStore.setState({ streak: { current: 0, longest: 0 }, subjects: {} });
    }
  });

  it('gives the installed DP-800 workspace all seven content modes', () => {
    window.location.hash = '#/subject/dp-800';
    render(<App />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Learn',
      'Labs',
      'Practice',
      'Exams',
      'Compare',
      'Notes',
      'Revision',
    ]);
    expect(screen.queryByText('This pack is not in the hub yet')).not.toBeInTheDocument();
  });

  it('every internal link the learn/labs/compare views render resolves to a real route', () => {
    const { content, index } = loadSubjectWithIndex('fixture');
    const subjectId = 'fixture';
    const enabled = new Set<string>(content.subject.enabledModes);

    // Draw each phase-5 surface, harvest its anchors, then unmount — multiple
    // render() calls in one test stay mounted otherwise.
    const harvested: string[] = [];
    const drawHarvest = (node: ReactNode) => {
      const view = render(node);
      for (const anchor of view.container.querySelectorAll<HTMLAnchorElement>('a[href^="#/subject/"]')) {
        harvested.push(anchor.getAttribute('href')!);
      }
      view.unmount();
    };

    try {
      drawHarvest(<LearnIndex subjectId={subjectId} content={content} index={index} />);
      drawHarvest(<LabIndex subjectId={subjectId} content={content} index={index} />);
      drawHarvest(<Compare subjectId={subjectId} content={content} />);
      drawHarvest(
        <DocResolverProvider resolveDoc={registryResolver(content.docs)}>
          <LessonViewer subjectId={subjectId} content={content} index={index} id="storage-models" />
        </DocResolverProvider>,
      );
      drawHarvest(
        <DocResolverProvider resolveDoc={registryResolver(content.docs)}>
          <LessonViewer subjectId={subjectId} content={content} index={index} id="query-shapes" />
        </DocResolverProvider>,
      );
      drawHarvest(<LabViewer subjectId={subjectId} content={content} index={index} id="lab-explore" />);
    } finally {
      const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
      useSubjectDataStore.setState({ subjects });
      window.localStorage.clear();
    }

    // A real harvest: 12 anchors across the six surfaces, collapsing to 6
    // distinct routes (the per-view back links target the same index routes).
    expect(harvested.length).toBeGreaterThanOrEqual(10);
    expect(new Set(harvested).size).toBeGreaterThanOrEqual(6);
    const deadEnds = harvested.filter((href) => {
      const route = parseHash(href);
      if (route.view !== 'subject' || route.subjectId !== subjectId) return true;
      if (route.mode !== undefined && !enabled.has(route.mode)) return true;
      const id = route.id;
      if (id === undefined) return false; // mode index routes always resolve
      switch (route.mode) {
        case 'learn':
          return !index.getLessonBySlug(id) && !index.getLesson(id);
        case 'labs':
          return !index.getLab(id);
        case 'compare':
          return !content.comparisons.some((cmp) => cmp.id === id);
        case 'practice':
          return id !== 'all' && !index.getDomain(id) && !index.getModule(id);
        default:
          return false; // placeholder modes have no item routes yet
      }
    });
    expect(deadEnds).toEqual([]);
  });
});
