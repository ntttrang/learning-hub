import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryAdapter } from './storage';
import {
  createSubjectDataStore,
  emptySubjectData,
  SUBJECT_DATA_STORE_KEY,
  useSubjectDataStore,
  type SubjectDataState,
} from './subject-store';
import type { SubjectUserData, SrsCard } from '../sdk/types';

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

const srsCard = (questionId: string, box = 2): SrsCard => ({
  questionId,
  box,
  due: '2026-09-01T00:00:00.000Z',
  lastSeen: '2026-08-01T00:00:00.000Z',
  timesCorrect: 1,
  timesWrong: 0,
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

  it('merges the full user-data set hub-wins per key — quiz, notes, bookmarks, srs, lastLessonId', () => {
    const current: SubjectUserData = {
      lessons: {},
      completedLabs: [],
      quizAttempts: [quizAttempt('qa-hub')],
      examAttempts: [],
      srs: { 'q-single': srsCard('q-single', 4) },
      notes: [
        { id: 'n-1', lessonId: 'lesson-1', title: 'Hub note', body: 'hub', updated: '2026-08-19T00:00:00.000Z' },
      ],
      bookmarks: ['lesson-1'],
      lastLessonId: 'lesson-hub',
    };
    store.setState({ subjects: { s1: current } });

    store.getState().importLegacyData('s1', {
      quizAttempts: [quizAttempt('qa-legacy'), quizAttempt('qa-hub')],
      notes: [
        { id: 'n-2', title: 'New legacy note', body: 'new', updated: '2020-01-02T00:00:00.000Z' },
        { id: 'n-1', title: 'Legacy note', body: 'legacy', updated: '2020-01-01T00:00:00.000Z' },
      ],
      bookmarks: ['lesson-2', 'lesson-1'],
      srs: { 'q-single': srsCard('q-single', 1), 'q-fill': srsCard('q-fill', 2) },
      lastLessonId: 'lesson-legacy',
    });

    const data = store.getState().subjects['s1'];
    // quizAttempts: existing first, then legacy ids the hub did not have.
    expect(data.quizAttempts.map((a) => a.id)).toEqual(['qa-hub', 'qa-legacy']);
    // notes: hub entry wins by id; new legacy ids append after.
    expect(data.notes.map((n) => [n.id, n.title])).toEqual([
      ['n-1', 'Hub note'],
      ['n-2', 'New legacy note'],
    ]);
    // bookmarks: existing order first, then unseen legacy ids.
    expect(data.bookmarks).toEqual(['lesson-1', 'lesson-2']);
    // srs: hub wins per questionId; new cards merge in.
    expect(data.srs['q-single'].box).toBe(4);
    expect(data.srs['q-fill'].box).toBe(2);
    expect(Object.keys(data.srs).sort()).toEqual(['q-fill', 'q-single']);
    // lastLessonId: hub's own pointer wins.
    expect(data.lastLessonId).toBe('lesson-hub');
  });

  it('imports lastLessonId into a subject that had none', () => {
    store.getState().importLegacyData('fresh', { lastLessonId: 'lesson-legacy' });
    expect(store.getState().subjects['fresh'].lastLessonId).toBe('lesson-legacy');
  });

  it('a gh-shaped 3-key partial leaves the newer keys untouched', () => {
    const current: SubjectUserData = {
      lessons: { 'lesson-1': { status: 'in-progress', lastVisited: '2026-08-19T00:00:00.000Z' } },
      completedLabs: ['lab-1'],
      quizAttempts: [quizAttempt('qa-hub')],
      examAttempts: [],
      srs: { 'q-single': srsCard('q-single') },
      notes: [{ id: 'n-1', title: 'Hub note', body: 'hub', updated: '2026-08-19T00:00:00.000Z' }],
      bookmarks: ['lesson-1'],
      lastLessonId: 'lesson-hub',
    };
    store.setState({ subjects: { s1: current } });

    // Exactly the keys the gh shim passes — nothing more.
    store.getState().importLegacyData('s1', {
      lessons: { 'lesson-2': { status: 'completed', lastVisited: '2020-01-01T00:00:00.000Z' } },
      completedLabs: ['lab-2'],
      examAttempts: [examAttempt('legacy-x-9')],
    });

    const data = store.getState().subjects['s1'];
    // Key insertion order is a spread artifact; the contract is per-key values.
    expect(Object.keys(data.lessons).sort()).toEqual(['lesson-1', 'lesson-2']);
    expect(data.lessons['lesson-1'].status).toBe('in-progress'); // hub wins
    expect(data.lessons['lesson-2'].status).toBe('completed'); // legacy lands
    expect(data.completedLabs).toEqual(['lab-1', 'lab-2']);
    expect(data.examAttempts.map((a) => a.id)).toEqual(['legacy-x-9']);
    // The keys the gh shim never passes are exactly as they were.
    expect(data.quizAttempts.map((a) => a.id)).toEqual(['qa-hub']);
    expect(data.srs).toEqual(current.srs);
    expect(data.notes).toEqual(current.notes);
    expect(data.bookmarks).toEqual(['lesson-1']);
    expect(data.lastLessonId).toBe('lesson-hub');
  });

  it('an empty partial is a no-op — absent keys never wipe existing data', () => {
    store.getState().markLesson('s1', 'lesson-1', 'completed');
    const before = store.getState().subjects['s1'];
    store.getState().importLegacyData('s1', {});
    expect(store.getState().subjects['s1']).toEqual(before);
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

  it('default-fills rehydrated entries so later legacy imports never hit missing keys', async () => {
    const adapter = createMemoryAdapter();
    // An older/partial blob: the entry carries lessons but none of the array
    // keys, and one entry is not even an object.
    adapter.setItem(
      SUBJECT_DATA_STORE_KEY,
      JSON.stringify({
        state: {
          version: 1,
          streak: { current: 0, longest: 0 },
          subjects: {
            partial: { lessons: { 'lesson-1': { status: 'completed' } } },
            junk: 42,
          },
        },
        version: 1,
      }),
    );
    const store = createSubjectDataStore(adapter);
    await vi.waitFor(() => {
      expect(store.persist.hasHydrated()).toBe(true);
    });

    const partial = store.getState().subjects['partial']!;
    expect(partial.lessons).toEqual({ 'lesson-1': { status: 'completed' } });
    expect(partial.completedLabs).toEqual([]);
    expect(partial.quizAttempts).toEqual([]);
    expect(partial.examAttempts).toEqual([]);
    expect(partial.srs).toEqual({});
    expect(partial.notes).toEqual([]);
    expect(partial.bookmarks).toEqual([]);
    expect(store.getState().subjects['junk']).toEqual({
      lessons: {},
      completedLabs: [],
      quizAttempts: [],
      examAttempts: [],
      srs: {},
      notes: [],
      bookmarks: [],
    });

    // The hardening's reason: a bulk import over a partial entry must not
    // throw inside the boot-time effect.
    expect(() =>
      store.getState().importLegacyData('partial', { completedLabs: ['lab-1'] }),
    ).not.toThrow();
    expect(store.getState().subjects['partial']!.completedLabs).toEqual(['lab-1']);
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

describe('subject-data store: achievements', () => {
  it('awards first-lesson on completion, never on a mere visit', () => {
    const { store } = freshStore();
    store.getState().visitLesson('fixture', 'lesson-query-shapes');
    expect(store.getState().achievements).toEqual([]);

    store.getState().markLesson('fixture', 'lesson-query-shapes', 'completed');
    const earned = store.getState().achievements.map((a) => a.id);
    expect(earned).toContain('first-lesson');
    // Exactly-once: completing another lesson must not duplicate the award.
    store.getState().markLesson('fixture', 'lesson-another', 'completed');
    expect(store.getState().achievements.filter((a) => a.id === 'first-lesson')).toHaveLength(1);
  });

  it('awards quiz-ace and mock-pass from recorded attempts', () => {
    const { store } = freshStore();
    store.getState().recordQuiz('fixture', {
      ...quizAttempt('q1'),
      total: 2,
      correct: 2,
      questionResults: [
        { questionId: 'q-single', correct: true },
        { questionId: 'q-fill', correct: true },
      ],
    });
    store.getState().recordExam('fixture', examAttempt('e1'));
    const earned = store.getState().achievements.map((a) => a.id);
    expect(earned).toContain('quiz-ace');
    expect(earned).toContain('mock-pass');
  });

  it('importLegacyData awards earned achievements without bumping the streak', () => {
    const { store } = freshStore();
    store.getState().importLegacyData('fixture', {
      lessons: { 'lesson-query-shapes': { status: 'completed', lastVisited: '2026-07-01T00:00:00.000Z' } },
    });
    const state = store.getState();
    expect(state.achievements.map((a) => a.id)).toContain('first-lesson');
    expect(state.streak).toEqual({ current: 0, longest: 0 });

    // Re-import is a no-op: nothing re-awards, nothing changes.
    store.getState().importLegacyData('fixture', {
      lessons: { 'lesson-query-shapes': { status: 'completed', lastVisited: '2026-07-01T00:00:00.000Z' } },
    });
    expect(store.getState().achievements).toHaveLength(1);
  });

  it('resetSubject clears the subject slice but keeps hub achievements', () => {
    const { store } = freshStore();
    store.getState().markLesson('fixture', 'lesson-query-shapes', 'completed');
    expect(store.getState().achievements).toHaveLength(1);

    store.getState().resetSubject('fixture');
    expect(store.getState().subjects['fixture']).toEqual(emptySubjectData());
    expect(store.getState().achievements).toHaveLength(1);
  });

  it('rehydrates achievements from the adapter and default-fills old blobs', async () => {
    const { store, adapter } = freshStore();
    store.getState().markLesson('fixture', 'lesson-query-shapes', 'completed');
    const earned = store.getState().achievements;

    const second = createSubjectDataStore(adapter);
    await vi.waitFor(() => expect(second.persist.hasHydrated()).toBe(true));
    expect(second.getState().achievements).toEqual(earned);

    // A pre-achievements blob (no achievements key) upgrades to [] silently.
    const bare = createMemoryAdapter();
    bare.setItem(
      SUBJECT_DATA_STORE_KEY,
      JSON.stringify({
        state: { version: 1, streak: { current: 1, longest: 1 }, subjects: {} },
        version: 1,
      }),
    );
    const third = createSubjectDataStore(bare);
    await vi.waitFor(() => expect(third.persist.hasHydrated()).toBe(true));
    expect(third.getState().achievements).toEqual([]);
  });
});
