import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryAdapter } from './storage';
import {
  createSubjectDataStore,
  SUBJECT_DATA_STORE_KEY,
  useSubjectDataStore,
  type SubjectDataState,
} from './subject-store';
import type { SubjectUserData } from '../sdk/types';

type Store = ReturnType<typeof createSubjectDataStore>;

function freshStore(): { store: Store; adapter: ReturnType<typeof createMemoryAdapter> } {
  const adapter = createMemoryAdapter();
  return { store: createSubjectDataStore(adapter), adapter };
}

const quizAttempt = (id: string) => ({
  id,
  scope: 'review',
  date: '2026-08-01T10:00:00.000Z',
  total: 2,
  correct: 1,
  questionResults: [
    { questionId: 'q-single', correct: false },
    { questionId: 'q-fill', correct: true },
  ],
});

const examAttempt = (id: string) => ({
  id,
  examId: 'exam-practice',
  date: '2026-08-02T10:00:00.000Z',
  durationSeconds: 600,
  timed: true,
  scaledScore: 750,
  passed: true,
  perDomain: [{ domainId: 'd1', correct: 1, total: 2 }],
  answers: {},
  results: [{ questionId: 'q-order', correct: false }],
});

describe('subject-data store: namespacing', () => {
  let store: Store;
  beforeEach(() => {
    ({ store } = freshStore());
  });

  it('writes under subject A never touch subject B', () => {
    const s = store.getState();
    s.markLesson('subject-a', 'lesson-1', 'completed');
    s.toggleBookmark('subject-a', 'lesson-1');
    s.completeLab('subject-a', 'lab-1');
    s.markLesson('subject-b', 'lesson-1', 'in-progress');

    const subjects = store.getState().subjects;
    expect(subjects['subject-a']).toMatchObject({
      lessons: { 'lesson-1': { status: 'completed' } },
      bookmarks: ['lesson-1'],
      completedLabs: ['lab-1'],
    });
    expect(subjects['subject-b'].lessons['lesson-1'].status).toBe('in-progress');
    expect(subjects['subject-b'].bookmarks).toEqual([]);
    expect(subjects['subject-b'].completedLabs).toEqual([]);
  });

  it('interleaved writes leave both slices correct', () => {
    const s = store.getState();
    s.upsertNote('a', { id: 'n1', title: 'A note', body: 'x', updated: '2026-08-01T00:00:00.000Z' });
    s.upsertNote('b', { id: 'n1', title: 'B note', body: 'y', updated: '2026-08-01T00:00:00.000Z' });
    s.upsertNote('a', { id: 'n1', title: 'A note v2', body: 'x2', updated: '2026-08-02T00:00:00.000Z' });
    s.deleteNote('b', 'n1');

    const subjects = store.getState().subjects;
    expect(subjects['a'].notes.map((n) => n.title)).toEqual(['A note v2']);
    expect(subjects['b'].notes).toEqual([]);
  });

  it('visitLesson seeds in-progress and records lastLessonId per subject', () => {
    const s = store.getState();
    s.visitLesson('a', 'lesson-1');
    s.visitLesson('b', 'lesson-9');
    expect(store.getState().subjects['a']).toMatchObject({
      lastLessonId: 'lesson-1',
      lessons: { 'lesson-1': { status: 'in-progress' } },
    });
    expect(store.getState().subjects['b'].lastLessonId).toBe('lesson-9');
  });

  it('recordQuiz ingests SRS only into that subject and caps the log', () => {
    const s = store.getState();
    s.recordQuiz('a', quizAttempt('qa-1'));
    const a = store.getState().subjects['a'];
    expect(Object.keys(a.srs)).toEqual(['q-single']); // only the miss is tracked
    expect(a.quizAttempts).toHaveLength(1);

    for (let i = 0; i < 210; i++) {
      store.getState().recordQuiz('a', quizAttempt(`qa-${i + 2}`));
    }
    expect(store.getState().subjects['a'].quizAttempts).toHaveLength(200);
    expect(store.getState().subjects['b']).toBeUndefined();
  });

  it('recordExam ingests SRS and bumps the shared hub streak', () => {
    const s = store.getState();
    s.recordExam('a', examAttempt('ea-1'));
    const state = store.getState();
    expect(Object.keys(state.subjects['a'].srs)).toContain('q-order');
    expect(state.subjects['a'].examAttempts).toHaveLength(1);
    expect(state.streak.current).toBe(1);
    expect(state.version).toBe(1);
  });

  it('resetSubject clears one slice only', () => {
    const s = store.getState();
    s.markLesson('a', 'lesson-1', 'completed');
    s.markLesson('b', 'lesson-1', 'completed');
    store.getState().resetSubject('a');
    const subjects = store.getState().subjects;
    expect(subjects['a'].lessons).toEqual({});
    expect(subjects['b'].lessons['lesson-1'].status).toBe('completed');
  });
});

describe('subject-data store: importLegacyData bulk merge', () => {
  let store: Store;
  beforeEach(() => {
    ({ store } = freshStore());
  });

  it('existing keys win, new keys append, deterministic ids dedup — never clobber', () => {
    const current: SubjectUserData = {
      lessons: { 'lesson-1': { status: 'in-progress', lastVisited: '2026-08-19T00:00:00.000Z' } },
      completedLabs: ['lab-1'],
      quizAttempts: [],
      examAttempts: [examAttempt('legacy-x-0')],
      srs: {},
      notes: [],
      bookmarks: [],
    };
    store.setState({ subjects: { s1: current } });

    store.getState().importLegacyData('s1', {
      lessons: {
        'lesson-1': { status: 'completed', lastVisited: '2020-01-01T00:00:00.000Z' },
        'lesson-2': { status: 'completed', lastVisited: '2020-01-02T00:00:00.000Z' },
      },
      completedLabs: ['lab-1', 'lab-2'],
      examAttempts: [examAttempt('legacy-x-0'), examAttempt('legacy-x-1')],
    });

    const data = store.getState().subjects['s1'];
    expect(data.lessons['lesson-1']).toEqual({
      status: 'in-progress',
      lastVisited: '2026-08-19T00:00:00.000Z',
    });
    expect(data.lessons['lesson-2']).toEqual({
      status: 'completed',
      lastVisited: '2020-01-02T00:00:00.000Z',
    });
    expect(data.completedLabs).toEqual(['lab-1', 'lab-2']);
    expect(data.examAttempts.map((attempt) => attempt.id)).toEqual(['legacy-x-0', 'legacy-x-1']);
  });

  it('imports without bumping the streak or ingesting SRS — no synthetic activity', () => {
    store.getState().importLegacyData('fresh', { examAttempts: [examAttempt('legacy-y-0')] });
    const state = store.getState();
    expect(state.streak).toEqual({ current: 0, longest: 0 });
    expect(state.subjects['fresh'].srs).toEqual({});
    expect(state.subjects['fresh'].examAttempts).toHaveLength(1);
  });
});

describe('subject-data store: persistence round-trip', () => {  it('rehydrates from the adapter on a fresh store instance', async () => {
    const { store: writer, adapter } = freshStore();
    writer.getState().markLesson('fixture', 'lesson-storage-models', 'completed');
    writer.getState().recordQuiz('fixture', quizAttempt('qa-1'));
    writer.getState().upsertNote('fixture', {
      id: 'note-lesson-storage-models',
      lessonId: 'lesson-storage-models',
      title: 'Storage models',
      body: 'Files are the primitive.',
      updated: '2026-08-20T10:00:00.000Z',
    });
    writer.getState().toggleBookmark('fixture', 'lesson-storage-models');

    // New store over the same adapter: the persist middleware rehydrates.
    const reader = createSubjectDataStore(adapter);
    await vi.waitFor(() => {
      expect(reader.persist.hasHydrated()).toBe(true);
    });
    const subjects = reader.getState().subjects;
    expect(subjects['fixture'].lessons['lesson-storage-models'].status).toBe('completed');
    expect(subjects['fixture'].srs['q-single']).toBeDefined();
    expect(reader.getState().streak.current).toBeGreaterThanOrEqual(1);
    // Notes and bookmarks ride the same slice — the Notes tab survives reload.
    expect(subjects['fixture'].notes[0]?.body).toBe('Files are the primitive.');
    expect(subjects['fixture'].bookmarks).toEqual(['lesson-storage-models']);
  });

  it('a corrupt persisted blob degrades to empty state instead of crashing', async () => {
    const adapter = createMemoryAdapter();
    adapter.setItem(SUBJECT_DATA_STORE_KEY, JSON.stringify({ state: 'not-an-object', version: 99 }));
    const store = createSubjectDataStore(adapter);
    await vi.waitFor(() => {
      expect(store.persist.hasHydrated()).toBe(true);
    });
    const state: SubjectDataState = store.getState();
    expect(state.subjects).toEqual({});
    expect(state.version).toBe(1);
  });
});

describe('app singleton (localStorage-backed)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it('module-init rehydration reads cc-subject-data', async () => {
    window.localStorage.setItem(
      SUBJECT_DATA_STORE_KEY,
      JSON.stringify({
        state: {
          version: 1,
          streak: { current: 3, longest: 5, lastActive: '2026-08-01T00:00:00.000Z' },
          subjects: { fixture: { lessons: { 'lesson-query-shapes': { status: 'completed' } } } },
        },
        version: 1,
      }),
    );
    const { useSubjectDataStore: reimported } = await import('./subject-store');
    await vi.waitFor(() => {
      expect(reimported.persist.hasHydrated()).toBe(true);
    });
    expect(reimported.getState().streak).toMatchObject({ current: 3, longest: 5 });
    expect(reimported.getState().subjects['fixture'].lessons['lesson-query-shapes']).toMatchObject({
      status: 'completed',
    });
    expect(useSubjectDataStore.getState().subjects).toEqual({});
  });
});
