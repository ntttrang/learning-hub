/**
 * Phase 7 end-to-end sweep — the fixture pack driven through the real App:
 * home → subject card → workspace, one flowing test per enabled mode, and the
 * cross-mode journey (bookmark + note taken in a lesson surface in the Notes
 * tab). Assertions stay on roles and labels, never DOM structure, so unrelated
 * UI tweaks do not break the sweep.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { useSubjectDataStore } from './engines/subject-store';

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = '';
});

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
  window.location.hash = '';
});

describe('app flow: fixture pack end to end', () => {
  it('home → fixture card → workspace with every enabled mode as a live tab', async () => {
    render(<App />);
    const cardLink = screen
      .getAllByRole('link', { name: /FX-100/ })
      .find((link) => link.getAttribute('href') === '#/subject/fixture')!;
    fireEvent.click(cardLink);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'FX-100 study hub' })).toBeInTheDocument(),
    );
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Learn',
      'Labs',
      'Practice',
      'Exams',
      'Compare',
      'Notes',
    ]);
  });

  it('learn: a lesson renders its blocks, knowledge check, and notes panel', async () => {
    window.location.hash = '#/subject/fixture/learn';
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Storage models/ }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument(),
    );
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument(); // knowledge check
    expect(
      screen.getByRole('textbox', { name: 'Notes for Storage models' }),
    ).toBeInTheDocument(); // lesson-embedded notes
  });

  it('labs: the lab viewer renders the pack’s lab', async () => {
    window.location.hash = '#/subject/fixture/labs';
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Explore a lakehouse table/ }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Explore a lakehouse table' })).toBeInTheDocument(),
    );
  });

  it('practice: a scoped run mounts through the practice index', async () => {
    window.location.hash = '#/subject/fixture/practice';
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Everything, shuffled/ }));

    await waitFor(() => expect(screen.getByText(/Question 1 of /)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeInTheDocument();
  });

  it('exams: the index leads into a sitting that serves real questions', async () => {
    window.location.hash = '#/subject/fixture/exams';
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /Practice set/ }));

    // Wait on the intro contract itself — the exam title also appears as an
    // index-card heading, so a heading query would pass before navigation.
    await waitFor(() => expect(screen.getByText('Before you begin')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Begin — 15 minutes/ }));
    await waitFor(() => expect(screen.getByText(/Question 1 of 4/)).toBeInTheDocument());
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('compare: the comparison table renders with its sample tabs', () => {
    window.location.hash = '#/subject/fixture/compare';
    render(<App />);
    expect(screen.getByText('Three engines, one lake')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toContain('DuckDB');
  });

  it('notes: the tab renders honest empty states before any user data exists', async () => {
    window.location.hash = '#/subject/fixture/learn';
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));

    await waitFor(() => expect(window.location.hash).toBe('#/subject/fixture/notes'));
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
  });

  it('an unsaved draft never bleeds into the next lesson', async () => {
    window.location.hash = '#/subject/fixture/learn/storage-models';
    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument(),
    );

    // Type a draft but do not save it.
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes for Storage models' }), {
      target: { value: 'Half a thought about files.' },
    });
    expect(screen.getByRole('button', { name: /Save note/ })).toBeEnabled();

    // Hop to the next lesson via the footer link.
    fireEvent.click(screen.getByRole('link', { name: /Next/ }));
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Notes for Query shapes' })).toBeInTheDocument(),
    );

    // The next lesson's editor starts clean — the draft died with the route,
    // and nothing was saved under either lesson's id.
    expect(screen.getByRole('textbox', { name: 'Notes for Query shapes' })).toHaveValue('');
    expect(screen.getByRole('button', { name: /Save note/ })).toBeDisabled();
    const data = useSubjectDataStore.getState().subjects.fixture;
    expect(data?.notes).toHaveLength(0);
  });

  it('cross-mode journey: a lesson bookmark and note surface in the Notes tab', async () => {
    window.location.hash = '#/subject/fixture/learn/storage-models';
    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument(),
    );

    // Bookmark from the lesson header.
    fireEvent.click(screen.getByRole('button', { name: 'Bookmark' }));
    expect(screen.getByRole('button', { name: 'Bookmarked' })).toBeInTheDocument();

    // Take a note on the lesson.
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes for Storage models' }), {
      target: { value: 'One lake, three engines.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save note/ }));

    // Hop to the Notes tab — both artifacts are there.
    fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));
    await waitFor(() => expect(window.location.hash).toBe('#/subject/fixture/notes'));
    expect(screen.getByText('One lake, three engines.')).toBeInTheDocument();
    // The note card and the bookmark card each link back into the lesson.
    const lessonLinks = screen.getAllByRole('link', { name: /Storage models/ });
    expect(lessonLinks).toHaveLength(2);
    for (const link of lessonLinks) {
      expect(link.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
    }
  });
});
