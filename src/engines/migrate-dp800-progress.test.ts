/**
 * DP-800 legacy progress migration tests — envelope handling, verbatim field
 * mapping across all eight user-data keys, hub-wins collisions,
 * referential-integrity drops against the pack snapshot, untrusted-blob
 * bounds, and the runner's durability/idempotency contract. Fixtures run
 * against the real extracted pack so lesson/question/exam ids are exactly
 * what production filters on.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contentSource } from '../content/registry';
import type { SubjectUserData } from '../sdk/types';
import {
  DP800_MIGRATED_KEY,
  importLegacyDp800Progress,
  LEGACY_DP800_KEY,
  migrateDp800Progress,
} from './migrate-dp800-progress';
import { createLocalStorageAdapter, type StorageAdapter } from './storage';
import { createSubjectDataStore } from './subject-store';

const content = contentSource.loadSubject('dp-800');
const lesson = content.lessons[0]!;
const question = content.questions.find((candidate) => candidate.kind === 'single')!;
const exam = content.exams[0]!;
const lab = content.labs[0]!;
const domain = content.domains[0]!;
const moduleScope = content.modules[0]!.id;

const emptyCurrent = (): SubjectUserData => ({
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
  srs: {},
  notes: [],
  bookmarks: [],
});

/** Donor persist envelope; theme/streak/achievements are the dropped fields. */
const donorEnvelope = (state: Record<string, unknown>) => ({
  version: 1,
  state: {
    theme: 'night',
    streak: { current: 4, longest: 9 },
    achievements: [
      {
        id: 'first-lesson',
        title: 'Cast off',
        description: 'Complete your first lesson.',
        earnedAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    ...state,
  },
});

/** Realistic donor state touching every user-data key. */
const fullDonorState = () => ({
  lessons: {
    [lesson.id]: { status: 'completed', lastVisited: '2026-07-01T09:00:00.000Z', scrollPct: 80 },
  },
  completedLabs: [lab.id],
  quizAttempts: [
    {
      id: 'quiz-1',
      scope: moduleScope,
      date: '2026-07-02T09:00:00.000Z',
      total: 2,
      correct: 1,
      questionResults: [{ questionId: question.id, correct: false }],
    },
  ],
  examAttempts: [
    {
      id: 'exam-1',
      examId: exam.id,
      date: '2026-07-03T09:00:00.000Z',
      durationSeconds: 3000,
      timed: false,
      scaledScore: 820,
      passed: true,
      perDomain: [{ domainId: domain.id, correct: 12, total: 20 }],
      answers: { [question.id]: ['a'] },
      results: [{ questionId: question.id, correct: false }],
    },
  ],
  srs: {
    [question.id]: {
      questionId: question.id,
      box: 2,
      due: '2026-09-01T00:00:00.000Z',
      lastSeen: '2026-07-02T00:00:00.000Z',
      timesCorrect: 1,
      timesWrong: 1,
    },
  },
  notes: [
    {
      id: 'note-1',
      lessonId: lesson.id,
      title: 'Rowstore vs columnstore',
      body: 'CCI for analytics scans.',
      updated: '2026-07-04T00:00:00.000Z',
    },
  ],
  bookmarks: [lesson.id],
  lastLessonId: lesson.id,
});

/** Tiny well-formed quiz attempt for cap tests. */
const minimalQuiz = (id: string) => ({
  id,
  scope: moduleScope,
  date: '2026-07-02T09:00:00.000Z',
  total: 0,
  correct: 0,
  questionResults: [],
});

/* --------------------------------- mapper ---------------------------------- */

describe('migrateDp800Progress — mapper', () => {
  it('maps all eight user-data keys verbatim and reports no drops', () => {
    const migration = migrateDp800Progress(donorEnvelope(fullDonorState()).state, emptyCurrent(), content)!;

    expect(migration.data.lessons).toEqual({
      [lesson.id]: { status: 'completed', lastVisited: '2026-07-01T09:00:00.000Z', scrollPct: 80 },
    });
    expect(migration.data.completedLabs).toEqual([lab.id]);
    expect(migration.data.quizAttempts).toEqual([
      {
        id: 'quiz-1',
        scope: moduleScope, // donor scope string preserved as-is
        date: '2026-07-02T09:00:00.000Z',
        total: 2,
        correct: 1,
        questionResults: [{ questionId: question.id, correct: false }],
      },
    ]);
    expect(migration.data.examAttempts).toEqual([
      {
        id: 'exam-1',
        examId: exam.id,
        date: '2026-07-03T09:00:00.000Z',
        durationSeconds: 3000,
        timed: false,
        scaledScore: 820,
        passed: true,
        perDomain: [{ domainId: domain.id, correct: 12, total: 20 }],
        answers: { [question.id]: ['a'] }, // option-id array, no translation
        results: [{ questionId: question.id, correct: false }],
      },
    ]);
    expect(migration.data.srs).toEqual({
      [question.id]: {
        questionId: question.id,
        box: 2,
        due: '2026-09-01T00:00:00.000Z',
        lastSeen: '2026-07-02T00:00:00.000Z',
        timesCorrect: 1,
        timesWrong: 1,
      },
    });
    expect(migration.data.notes).toEqual([
      {
        id: 'note-1',
        lessonId: lesson.id,
        title: 'Rowstore vs columnstore',
        body: 'CCI for analytics scans.',
        updated: '2026-07-04T00:00:00.000Z',
      },
    ]);
    expect(migration.data.bookmarks).toEqual([lesson.id]);
    expect(migration.data.lastLessonId).toBe(lesson.id);
    expect(migration.unreadable).toBe(0);
    expect(migration.unknownIds).toBe(0);
    expect(migration.bounded).toBe(0);
  });

  it('returns null when the hub already holds every legacy key — hub wins', () => {
    const current: SubjectUserData = {
      ...emptyCurrent(),
      lessons: { [lesson.id]: { status: 'in-progress' } },
      completedLabs: [lab.id],
      quizAttempts: [minimalQuiz('quiz-1')],
      examAttempts: [
        {
          id: 'exam-1',
          examId: exam.id,
          date: '2026-08-01T00:00:00.000Z',
          durationSeconds: 0,
          timed: true,
          scaledScore: 700,
          passed: false,
          perDomain: [],
          answers: {},
          results: [],
        },
      ],
      srs: {
        [question.id]: {
          questionId: question.id,
          box: 4,
          due: '2026-10-01T00:00:00.000Z',
          lastSeen: '2026-08-01T00:00:00.000Z',
          timesCorrect: 3,
          timesWrong: 0,
        },
      },
      notes: [
        { id: 'note-1', title: 'Hub note', body: 'hub', updated: '2026-08-01T00:00:00.000Z' },
      ],
      bookmarks: [lesson.id],
      lastLessonId: lesson.id,
    };
    const migration = migrateDp800Progress(fullDonorState(), current, content);
    expect(migration).toBeNull();
  });

  it('drops unknown-id entries and references, counted, keeping the rest', () => {
    const state = {
      ...fullDonorState(),
      lessons: {
        [lesson.id]: { status: 'completed' },
        'l9999': { status: 'completed' }, // foreign lesson id
      },
      completedLabs: [lab.id, 'lab-ghost'],
      bookmarks: [lesson.id, 'l8888'],
      quizAttempts: [
        minimalQuiz('quiz-1'),
        {
          ...minimalQuiz('quiz-2'),
          questionResults: [
            { questionId: question.id, correct: true },
            { questionId: 'q-ghost', correct: true }, // foreign qid inside results
          ],
        },
      ],
      examAttempts: [
        fullDonorState().examAttempts[0]!,
        {
          ...fullDonorState().examAttempts[0]!,
          id: 'exam-2',
          examId: 'exam-ghost', // foreign exam: whole attempt dropped
        },
      ],
      srs: {
        [question.id]: fullDonorState().srs[question.id]!,
        'q-ghost': { ...fullDonorState().srs[question.id]!, questionId: 'q-ghost' },
      },
      notes: [
        fullDonorState().notes[0]!,
        { id: 'note-2', lessonId: 'l7777', title: 'Orphan', body: 'dangling', updated: '2026-07-04T00:00:00.000Z' },
      ],
      lastLessonId: 'l6666',
    };

    const migration = migrateDp800Progress(state, emptyCurrent(), content)!;

    // Kept, verbatim.
    expect(Object.keys(migration.data.lessons!)).toEqual([lesson.id]);
    expect(migration.data.completedLabs).toEqual([lab.id]);
    expect(migration.data.bookmarks).toEqual([lesson.id]);
    expect(migration.data.quizAttempts).toHaveLength(2);
    expect(migration.data.quizAttempts![1]!.questionResults).toEqual([
      { questionId: question.id, correct: true },
    ]);
    expect(migration.data.examAttempts).toHaveLength(1);
    expect(migration.data.examAttempts![0]!.id).toBe('exam-1');
    expect(Object.keys(migration.data.srs!)).toEqual([question.id]);
    expect(migration.data.notes).toHaveLength(1);
    expect(migration.data.lastLessonId).toBeUndefined();

    // Dropped and counted: lesson, lab, bookmark, quiz result entry, exam
    // attempt, srs card, note, lastLessonId = 8 unknown-id references.
    expect(migration.unknownIds).toBe(8);
    expect(migration.unreadable).toBe(0);
  });

  it('skips unreadable entries with a single warn, keeping readable siblings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const state = {
        ...fullDonorState(),
        lessons: {
          [lesson.id]: { status: 'completed' },
          'l-bad': { status: 'finished' }, // invalid status
        },
        quizAttempts: [minimalQuiz('quiz-1'), { id: 'quiz-bad', scope: 'x' }], // missing fields
        examAttempts: [
          {
            ...fullDonorState().examAttempts[0]!,
            answers: { [question.id]: 'a' }, // answer value not an array
          },
        ],
        notes: [{ id: 'note-bad', title: 'No body' }], // missing body/updated
        srs: {
          [question.id]: fullDonorState().srs[question.id]!,
          'bad-key': { ...fullDonorState().srs[question.id]!, questionId: question.id }, // key ≠ questionId
        },
      };

      const migration = migrateDp800Progress(state, emptyCurrent(), content)!;
      expect(Object.keys(migration.data.lessons!)).toEqual([lesson.id]);
      expect(migration.data.quizAttempts).toHaveLength(1);
      expect(migration.data.quizAttempts![0]!.id).toBe('quiz-1');
      expect(migration.data.examAttempts).toEqual([]); // all unreadable
      expect(migration.data.notes).toEqual([]);
      expect(Object.keys(migration.data.srs!)).toEqual([question.id]); // mismatched key skipped
      expect(migration.unreadable).toBe(5);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('5 unreadable entries');
    } finally {
      warn.mockRestore();
    }
  });

  it('enforces the donor caps and the note-body bound, counted as bounded', () => {
    const oversized = {
      ...fullDonorState(),
      quizAttempts: Array.from({ length: 205 }, (_, index) => minimalQuiz(`quiz-${index}`)),
      notes: [
        fullDonorState().notes[0]!,
        { id: 'note-big', title: 'Huge', body: 'x'.repeat(20_001), updated: '2026-07-04T00:00:00.000Z' },
      ],
    };

    const migration = migrateDp800Progress(oversized, emptyCurrent(), content)!;
    expect(migration.data.quizAttempts).toHaveLength(200);
    expect(migration.data.quizAttempts![0]!.id).toBe('quiz-0');
    expect(migration.data.quizAttempts![199]!.id).toBe('quiz-199');
    expect(migration.data.notes).toHaveLength(1);
    expect(migration.bounded).toBe(6); // 5 quiz entries + 1 oversized note
  });
});

/* --------------------------------- runner ---------------------------------- */

describe('importLegacyDp800Progress — runner', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function seedLegacy(state: Record<string, unknown> = fullDonorState(), envelope?: unknown) {
    const raw = JSON.stringify(envelope ?? donorEnvelope(state));
    window.localStorage.setItem(LEGACY_DP800_KEY, raw);
    return raw;
  }

  it('imports every key, sets the guard, never writes the donor key', async () => {
    const donorRaw = seedLegacy();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      const summary = (await importLegacyDp800Progress(store))!;

      expect(summary).toEqual({
        lessons: 1,
        labs: 1,
        quizzes: 1,
        exams: 1,
        notes: 1,
        bookmarks: 1,
        srsCards: 1,
        lastLessonId: true,
      });
      const data = store.getState().subjects['dp-800']!;
      expect(data.lessons[lesson.id]!.scrollPct).toBe(80);
      expect(data.completedLabs).toEqual([lab.id]);
      expect(data.quizAttempts[0]!.scope).toBe(moduleScope);
      expect(data.examAttempts[0]!.answers[question.id]).toEqual(['a']);
      expect(data.srs[question.id]!.box).toBe(2);
      expect(data.notes[0]!.body).toBe('CCI for analytics scans.');
      expect(data.bookmarks).toEqual([lesson.id]);
      expect(data.lastLessonId).toBe(lesson.id);

      expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).not.toBeNull();
      expect(window.localStorage.getItem(LEGACY_DP800_KEY)).toBe(donorRaw); // untouched
      expect(info).toHaveBeenCalledTimes(1);
      expect(info.mock.calls[0][0]).toContain('theme, achievements, and streak');
    } finally {
      info.mockRestore();
    }
  });

  it('second run writes nothing — guard first, verbatim ids underneath', async () => {
    seedLegacy();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      (await importLegacyDp800Progress(store))!;
      const afterFirst = JSON.stringify(store.getState().subjects);

      expect(await importLegacyDp800Progress(store)).toBeNull(); // guard short-circuits

      window.localStorage.removeItem(DP800_MIGRATED_KEY); // simulate guard loss
      await importLegacyDp800Progress(store); // verbatim ids + skip-if-present
      expect(JSON.stringify(store.getState().subjects)).toBe(afterFirst);
    } finally {
      info.mockRestore();
    }
  });

  it('marks a payload with nothing adoptable done without importing', async () => {
    seedLegacy({});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importLegacyDp800Progress(store)).toBeNull();
      expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).not.toBeNull();
      expect(store.getState().subjects).toEqual({});
      expect(info).toHaveBeenCalledTimes(1);
      expect(info.mock.calls[0][0]).toContain('nothing to import');
      expect(info.mock.calls[0][0]).toContain('theme, achievements, and streak');
    } finally {
      info.mockRestore();
    }
  });

  it('absent old key is a silent no-op that does not set the guard', async () => {
    const store = createSubjectDataStore(createLocalStorageAdapter());
    expect(await importLegacyDp800Progress(store)).toBeNull();
    expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).toBeNull();
    expect(store.getState().subjects).toEqual({});
  });

  it('imports a lastLessonId-only payload durably — every field is verified', async () => {
    // Collections emptied but the resume pointer kept: the persisted-slice
    // comparison must cover lastLessonId too, not just collection ids.
    seedLegacy({
      ...fullDonorState(),
      lessons: {},
      completedLabs: [],
      quizAttempts: [],
      examAttempts: [],
      srs: {},
      notes: [],
      bookmarks: [],
    });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      const summary = (await importLegacyDp800Progress(store))!;
      expect(summary).toMatchObject({ lessons: 0, exams: 0, lastLessonId: true });
      expect(store.getState().subjects['dp-800']!.lastLessonId).toBe(lesson.id);
      expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).not.toBeNull();
    } finally {
      info.mockRestore();
    }
  });

  it.each([
    ['unreadable JSON', '{not json', 'unreadable JSON'],
    ['missing state', JSON.stringify({ version: 1 }), 'unexpected shape'],
    ['non-record state', JSON.stringify({ version: 1, state: 'x' }), 'unexpected shape'],
    ['unknown envelope version', JSON.stringify({ version: 2, state: {} }), 'version 2 is unknown'],
  ])('%s warns once and stays retryable', async (_label, payload, message) => {
    window.localStorage.setItem(LEGACY_DP800_KEY, payload);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importLegacyDp800Progress(store)).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(message);
      expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).toBeNull(); // retryable
      expect(store.getState().subjects).toEqual({});
    } finally {
      warn.mockRestore();
    }
  });

  it('aborts an oversized raw key before parsing it', async () => {
    window.localStorage.setItem(LEGACY_DP800_KEY, 'x'.repeat(2_000_001));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importLegacyDp800Progress(store)).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('exceeds');
      expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('survives a persist → reload cycle without duplicating data', async () => {
    seedLegacy();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const first = createSubjectDataStore(createLocalStorageAdapter());
      await vi.waitFor(() => expect(first.persist.hasHydrated()).toBe(true));
      (await importLegacyDp800Progress(first))!;

      // "Reload": a fresh store over the same storage rehydrates the imported
      // data, and the persisted guard keeps the app effect a no-op.
      const reloaded = createSubjectDataStore(createLocalStorageAdapter());
      await vi.waitFor(() => expect(reloaded.persist.hasHydrated()).toBe(true));
      expect(await importLegacyDp800Progress(reloaded)).toBeNull();
      const data = reloaded.getState().subjects['dp-800']!;
      expect(data.examAttempts).toHaveLength(1);
      expect(data.examAttempts[0]!.id).toBe('exam-1');
      expect(data.lastLessonId).toBe(lesson.id);
    } finally {
      info.mockRestore();
    }
  });

  it('leaves the guard unset when the merge does not persist, then retries', async () => {
    seedLegacy();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      // The store's storage adapter swallows setItem failures — simulate a
      // quota/denied write by dropping every persist write while reads still
      // see the real blob.
      const backing = createLocalStorageAdapter();
      const dropping: StorageAdapter = {
        getItem: (name) => backing.getItem(name),
        setItem: () => {},
        removeItem: (name) => backing.removeItem(name),
      };
      const store = createSubjectDataStore(dropping);

      expect(await importLegacyDp800Progress(store)).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('did not persist');
      expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).toBeNull();
      // The in-memory merge happened; it just was never durable.
      expect(store.getState().subjects['dp-800']!.examAttempts).toHaveLength(1);

      // The next start retries over healthy storage and succeeds.
      const healed = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importLegacyDp800Progress(healed)).not.toBeNull();
      expect(window.localStorage.getItem(DP800_MIGRATED_KEY)).not.toBeNull();
    } finally {
      warn.mockRestore();
      info.mockRestore();
    }
  });

  it('surfaces unknown-id drops in the one summary log', async () => {
    seedLegacy({
      ...fullDonorState(),
      examAttempts: [
        { ...fullDonorState().examAttempts[0]!, examId: 'exam-ghost' },
      ],
    });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      const summary = (await importLegacyDp800Progress(store))!;
      expect(summary.exams).toBe(0);
      expect(info).toHaveBeenCalledTimes(1);
      expect(info.mock.calls[0][0]).toContain('1 entry with unknown ids dropped');
    } finally {
      info.mockRestore();
    }
  });
});
