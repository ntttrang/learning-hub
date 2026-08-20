import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSubjectDataStore } from '../engines/subject-store';
import { LessonNotes } from './LessonNotes';

function draw(lessonId = 'lesson-1', lessonTitle = 'Storage models') {
  return render(<LessonNotes subjectId="fixture" lessonId={lessonId} lessonTitle={lessonTitle} />);
}

function storedNotes() {
  return useSubjectDataStore.getState().subjects.fixture?.notes ?? [];
}

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
});

describe('LessonNotes', () => {
  it('shows the saved body, the stamp, and a disabled Save until edited', () => {
    useSubjectDataStore.setState({
      subjects: {
        fixture: {
          lessons: {},
          completedLabs: [],
          quizAttempts: [],
          examAttempts: [],
          srs: {},
          notes: [
            {
              id: 'note-lesson-1',
              lessonId: 'lesson-1',
              title: 'Storage models',
              body: 'Files are the primitive.',
              updated: '2026-08-20T10:00:00.000Z',
            },
          ],
          bookmarks: [],
        },
      },
    });
    draw();

    const textarea = screen.getByRole('textbox', { name: 'Notes for Storage models' });
    expect(textarea).toHaveValue('Files are the primitive.');
    expect(screen.getByText(/Saved /)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save note/ })).toBeDisabled();
  });

  it('saving a draft upserts one note per lesson', () => {
    draw();
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes for Storage models' }), {
      target: { value: 'Parquet is columnar' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save note/ }));

    expect(storedNotes()).toHaveLength(1);
    expect(storedNotes()[0]).toMatchObject({
      id: 'note-lesson-1',
      lessonId: 'lesson-1',
      title: 'Storage models',
      body: 'Parquet is columnar',
    });
    // Committed: Save is disabled again until the next edit.
    expect(screen.getByRole('button', { name: /Save note/ })).toBeDisabled();
  });

  it('saving an emptied body deletes the note', () => {
    useSubjectDataStore.setState({
      subjects: {
        fixture: {
          lessons: {},
          completedLabs: [],
          quizAttempts: [],
          examAttempts: [],
          srs: {},
          notes: [
            {
              id: 'note-lesson-1',
              lessonId: 'lesson-1',
              title: 'Storage models',
              body: 'Old thought',
              updated: '2026-08-20T10:00:00.000Z',
            },
          ],
          bookmarks: [],
        },
      },
    });
    draw();

    fireEvent.change(screen.getByRole('textbox', { name: 'Notes for Storage models' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save note/ }));
    expect(storedNotes()).toHaveLength(0);
  });

  it('the Delete button removes the note and clears the draft', () => {
    useSubjectDataStore.setState({
      subjects: {
        fixture: {
          lessons: {},
          completedLabs: [],
          quizAttempts: [],
          examAttempts: [],
          srs: {},
          notes: [
            {
              id: 'note-lesson-1',
              lessonId: 'lesson-1',
              title: 'Storage models',
              body: 'Old thought',
              updated: '2026-08-20T10:00:00.000Z',
            },
          ],
          bookmarks: [],
        },
      },
    });
    draw();

    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    expect(storedNotes()).toHaveLength(0);
    expect(screen.getByRole('textbox', { name: 'Notes for Storage models' })).toHaveValue('');
  });
});
