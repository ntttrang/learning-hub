import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { useSubjectDataStore } from '../engines/subject-store';
import type { Note } from '../sdk/types';
import { Notes } from './Notes';

const { index } = loadSubjectWithIndex('fixture');

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-lesson-storage-models',
    lessonId: 'lesson-storage-models',
    title: 'Storage models',
    body: 'Files are the primitive.',
    updated: '2026-08-20T10:00:00.000Z',
    ...overrides,
  };
}

function draw(notes: Note[] = [], bookmarks: string[] = []) {
  useSubjectDataStore.setState({
    subjects: {
      fixture: { lessons: {}, completedLabs: [], quizAttempts: [], examAttempts: [], srs: {}, notes, bookmarks },
    },
  });
  return render(<Notes subjectId="fixture" index={index} />);
}

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
});

describe('Notes tab', () => {
  it('renders honest empty states for both sections', () => {
    draw();
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Browse lessons' })).toHaveLength(2);
  });

  it('lists notes with their lesson links and delete action', () => {
    draw([note(), note({ id: 'note-2', lessonId: 'lesson-query-shapes', title: 'Query engine', body: 'Second note' })]);

    // The fixture lesson-1 carries the storage-models slug.
    const lessonLink = screen.getByRole('link', { name: /Storage models/ });
    expect(lessonLink.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
    expect(screen.getByText('Files are the primitive.')).toBeInTheDocument();
    expect(screen.getAllByText(/Saved /)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Delete note for Storage models' }));
    expect(useSubjectDataStore.getState().subjects.fixture?.notes).toHaveLength(1);
  });

  it('degrades away a note whose lesson left the pack', () => {
    draw([note({ lessonId: 'ghost-lesson' })]);
    // The card still renders with its title, but no orphan lesson link.
    expect(screen.getByText('Storage models')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Storage models/ })).toBeNull();
  });

  it('lists bookmarked lessons with Learn links and an un-bookmark action', () => {
    draw([], ['lesson-storage-models', 'ghost-lesson']);

    const link = screen.getByRole('link', { name: /Storage models/ });
    expect(link.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
    // Unknown bookmark ids degrade away rather than rendering an empty card.
    expect(screen.queryByText(/ghost-lesson/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark for Storage models' }));
    // The unknown id stays in the store (it is user data) but renders nothing.
    expect(useSubjectDataStore.getState().subjects.fixture?.bookmarks).toEqual(['ghost-lesson']);
  });
});
