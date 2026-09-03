/**
 * Polyglot legacy progress migration tests — donor shape handling, the
 * coding→labs branch, referential-integrity drops against the real installed
 * pack, untrusted-blob bounds, and the runner's durability/idempotency
 * contract. Fixtures run against the real extracted pack so ids are exactly
 * what production filters on.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contentSource } from '../content/registry';
import type { SubjectUserData } from '../sdk/types';
import {
  importPolyglotProgress,
  LEGACY_POLYGLOT_KEY,
  migratePolyglotProgress,
  POLYGLOT_MIGRATED_KEY,
} from './migrate-polyglot-progress';
import { createLocalStorageAdapter, type StorageAdapter } from './storage';
import { createSubjectDataStore } from './subject-store';

const content = contentSource.loadSubject('languages');
const lesson = content.lessons[0]!;
const lab = content.labs[0]!;
const codingDonorId = content.labs.find((l) => l.id.startsWith('plg-') && l.id.includes('-q-'))!.id;
const question = content.questions.find((q) => q.kind === 'single')!;
// donor ids = pack ids minus the shared prefix
const strip = (id: string) => id.replace(/^plg-/, '');

const emptyCurrent = (): SubjectUserData => ({
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
  srs: {},
  notes: [],
  bookmarks: [],
});

const fullDonorState = () => ({
  lessons: { [strip(lesson.id)]: true },
  labs: { [strip(lab.id)]: true },
  practice: {},
  framework: {},
  quiz: {
    [strip(question.id)]: { correct: true, answeredAt: '2026-08-01T09:00:00.000Z' },
    [strip(codingDonorId)]: { correct: false, answeredAt: '2026-08-02T09:00:00.000Z' },
  },
  lastLang: 'java',
});

describe('migratePolyglotProgress — mapper', () => {
  it('maps completions, routes coding quiz results to labs, seeds SRS boxes', () => {
    const migration = migratePolyglotProgress(fullDonorState(), emptyCurrent(), content)!;
    expect(migration.data.lessons?.[lesson.id]).toEqual({ status: 'completed' });
    expect(migration.data.completedLabs).toEqual([lab.id, codingDonorId]);
    const card = migration.data.srs?.[question.id];
    expect(card?.box).toBe(2);
    expect(card?.timesCorrect).toBe(1);
    expect(card?.due).toBe('2026-08-01T09:00:00.000Z');
    expect(migration.unknownIds).toBe(0);
    expect(migration.invalidEntries).toBe(0);
    expect('lastLang' in migration.data).toBe(false);
  });

  it('seeds wrong answers at box 1 and keeps current progress (hub wins, diff-only)', () => {
    const current = emptyCurrent();
    current.completedLabs = [lab.id];
    const state = fullDonorState();
    (state.quiz as Record<string, { correct: boolean; answeredAt: string }>)[strip(question.id)] = {
      correct: false,
      answeredAt: '2026-08-01T09:00:00.000Z',
    };
    const migration = migratePolyglotProgress(state, current, content)!;
    const card = migration.data.srs?.[question.id];
    expect(card?.box).toBe(1);
    // Re-importing against its own output must not inflate counters
    // (donor holds a last-state boolean, not history).
    const again = migratePolyglotProgress(state, { ...current, srs: migration.data.srs ?? {} }, content)!;
    expect(again.data.srs?.[question.id]?.timesCorrect).toBe(0);
    expect(again.data.srs?.[question.id]?.timesWrong).toBe(1);
    // lab.id already completed: only the coding lab is new
    expect(migration.data.completedLabs).toEqual([codingDonorId]);
  });

  it('returns null for empty, malformed, or nothing-to-adopt payloads', () => {
    expect(migratePolyglotProgress({}, emptyCurrent(), content)).toBeNull();
    expect(migratePolyglotProgress({ lessons: 'x' }, emptyCurrent(), content)).toBeNull();
    expect(
      migratePolyglotProgress({ lessons: {}, labs: {}, practice: {}, framework: {}, quiz: {} }, emptyCurrent(), content),
    ).toBeNull();
  });

  it('drops unknown ids with accounting and skips invalid entries', () => {
    const state = {
      lessons: { 'nope-lesson': true, [strip(lesson.id)]: true },
      labs: {},
      practice: {},
      framework: {},
      quiz: {
        'nope-q': { correct: true, answeredAt: '2026-08-01T09:00:00.000Z' },
        [strip(question.id)]: { correct: true, answeredAt: 'not-a-date' },
      },
    };
    const migration = migratePolyglotProgress(state, emptyCurrent(), content)!;
    expect(migration.data.lessons?.[lesson.id]).toBeDefined();
    expect(migration.unknownIds).toBe(2);
    expect(migration.invalidEntries).toBe(1);
    expect(migration.data.srs).toBeUndefined();
  });

  it('rejects non-boolean completion flags and non-record quiz entries', () => {
    const state = {
      lessons: { [strip(lesson.id)]: 'yes' },
      labs: {},
      practice: {},
      framework: {},
      quiz: { [strip(question.id)]: 'correct' },
    };
    const migration = migratePolyglotProgress(state, emptyCurrent(), content)!;
    expect(migration).not.toBeNull();
    expect(migration!.data.lessons).toBeUndefined();
    expect(migration!.invalidEntries).toBeGreaterThanOrEqual(2);
  });
});

describe('importPolyglotProgress — runner', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function seedLegacy(state: Record<string, unknown> = fullDonorState()) {
    window.localStorage.setItem(LEGACY_POLYGLOT_KEY, JSON.stringify(state));
  }

  it('imports, sets the sibling guard, never deletes the donor key, re-runs as no-op', async () => {
    seedLegacy();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      const summary = (await importPolyglotProgress(store, contentSource))!;

      expect(summary.lessons).toBe(1);
      expect(summary.labs).toBe(2);
      expect(summary.srsCards).toBe(1);
      const data = store.getState().subjects['languages']!;
      expect(data.lessons[lesson.id]!.status).toBe('completed');
      expect(data.srs[question.id]!.box).toBe(2);
      expect(window.localStorage.getItem(LEGACY_POLYGLOT_KEY)).not.toBeNull();
      expect(window.localStorage.getItem(POLYGLOT_MIGRATED_KEY)).not.toBeNull();

      // Second run: guard short-circuits, no double import.
      expect(await importPolyglotProgress(store, contentSource)).toBeNull();
      expect(data.srs[question.id]!.timesCorrect).toBe(1);
    } finally {
      info.mockRestore();
    }
  });

  it('is silent when the key is absent', async () => {
    expect(await importPolyglotProgress(createSubjectDataStore(createLocalStorageAdapter()), contentSource)).toBeNull();
  });

  it('leaves unreadable JSON retryable — no guard, donor key intact', async () => {
    window.localStorage.setItem(LEGACY_POLYGLOT_KEY, '{broken');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importPolyglotProgress(store, contentSource)).toBeNull();
      expect(window.localStorage.getItem(POLYGLOT_MIGRATED_KEY)).toBeNull();
      expect(window.localStorage.getItem(LEGACY_POLYGLOT_KEY)).toBe('{broken');
    } finally {
      warn.mockRestore();
    }
  });

  it('skips retryably when the languages pack is not installed', async () => {
    seedLegacy();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const partialSource = {
        listSubjectIds: () => ['dp-800'],
        loadSubject: () => {
          throw new Error('not installed');
        },
      } as unknown as typeof contentSource;
      const store = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importPolyglotProgress(store, partialSource)).toBeNull();
      expect(warn.mock.calls[0][0]).toContain('not installed');
      expect(window.localStorage.getItem(POLYGLOT_MIGRATED_KEY)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('leaves the guard unset when the merge does not persist, then retries', async () => {
    seedLegacy();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const backing = createLocalStorageAdapter();
      const dropping: StorageAdapter = {
        getItem: (name) => backing.getItem(name),
        setItem: () => {},
        removeItem: (name) => backing.removeItem(name),
      };
      const store = createSubjectDataStore(dropping);

      expect(await importPolyglotProgress(store, contentSource)).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('did not persist');
      expect(window.localStorage.getItem(POLYGLOT_MIGRATED_KEY)).toBeNull();
      // In-memory merge happened but was never durable; the donor key survives.
      expect(store.getState().subjects['languages']!.lessons[lesson.id]).toBeDefined();
      expect(window.localStorage.getItem(LEGACY_POLYGLOT_KEY)).not.toBeNull();
    } finally {
      warn.mockRestore();
      info.mockRestore();
    }
  });

  it('aborts blobs over the raw size bound without consuming the key', async () => {
    window.localStorage.setItem(LEGACY_POLYGLOT_KEY, `{"pad":"${'x'.repeat(2_100_000)}"}`);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importPolyglotProgress(store, contentSource)).toBeNull();
      expect(warn.mock.calls[0][0]).toContain('size bound');
      expect(window.localStorage.getItem(POLYGLOT_MIGRATED_KEY)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('arms the guard without writes when the blob holds nothing adoptable', async () => {
    window.localStorage.setItem(LEGACY_POLYGLOT_KEY, JSON.stringify({ lessons: {}, labs: {}, practice: {}, framework: {}, quiz: {}, lastLang: 'go' }));
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createLocalStorageAdapter());
      expect(await importPolyglotProgress(store, contentSource)).toBeNull();
      expect(window.localStorage.getItem(POLYGLOT_MIGRATED_KEY)).not.toBeNull();
      expect(store.getState().subjects['languages']).toBeUndefined();
    } finally {
      info.mockRestore();
    }
  });
});
