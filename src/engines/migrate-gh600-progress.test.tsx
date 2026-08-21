/**
 * GH-600 legacy progress migration tests: mapper purity (domain-granular
 * donor progress → completed lessons), the runner's guard/idempotency
 * contract, and the ordering proof for the hydration gate — a pre-hydration
 * import is silently dropped by the persist merge while its guard flag
 * already latched, which is why App only calls this after rehydration.
 */
import { waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { contentSource } from '../content/registry';
import {
  GH600_MIGRATED_KEY,
  importGh600Progress,
  LEGACY_GH600_KEYS,
  migrateGh600Passed,
} from './migrate-gh600-progress';
import { createMemoryAdapter, type StorageAdapter } from './storage';
import { createSubjectDataStore, useSubjectDataStore } from './subject-store';

const content = contentSource.loadSubject('gh-600');

/** Hub lesson ids per donor domain 0..5, exactly as the runner builds them. */
const lessonsByDomain = [1, 2, 3, 4, 5, 6].map((n) =>
  content.lessons
    .filter((lesson) => lesson.domainId === `gh600-d${n}`)
    .map((lesson) => lesson.id),
);

const donorPayload = (passed: number[]) => JSON.stringify({ cur: 2, tab: 'learn', passed });

beforeEach(() => {
  window.localStorage.clear();
});

/* --------------------------------- mapper ---------------------------------- */

describe('migrateGh600Passed — mapper', () => {
  it('maps every passed domain to all of its lessons, completed', () => {
    const migration = migrateGh600Passed([{ passed: [0, 2] }], { lessons: {} }, lessonsByDomain);
    expect(migration?.passedDomains).toEqual([0, 2]);
    expect(Object.keys(migration?.lessons ?? {})).toEqual([
      ...lessonsByDomain[0],
      ...lessonsByDomain[2],
    ]);
    for (const entry of Object.values(migration?.lessons ?? {})) {
      expect(entry.status).toBe('completed');
    }
  });

  it('merges the passed sets of both legacy keys', () => {
    const migration = migrateGh600Passed(
      [{ passed: [0, 2] }, { passed: [2, 4] }],
      { lessons: {} },
      lessonsByDomain,
    );
    expect(migration?.passedDomains).toEqual([0, 2, 4]);
  });

  it('never overwrites lesson progress the hub already holds', () => {
    const kept = lessonsByDomain[0][0];
    const current = { lessons: { [kept]: { status: 'in-progress' as const, lastVisited: 'x' } } };
    const migration = migrateGh600Passed([{ passed: [0] }], current, lessonsByDomain);
    expect(migration?.lessons[kept]).toBeUndefined(); // hub data wins
    expect(Object.keys(migration?.lessons ?? {})).toEqual(lessonsByDomain[0].slice(1));
  });

  it('drops malformed payloads without touching the readable ones', () => {
    const junk = [{ passed: 'yes' }, { passed: [0, 9] }, { passed: [0.5] }, null, { no: 'passed' }];
    expect(migrateGh600Passed(junk, { lessons: {} }, lessonsByDomain)).toBeNull();
    const mixed = migrateGh600Passed([{ passed: [1] }, ...junk], { lessons: {} }, lessonsByDomain);
    expect(mixed?.passedDomains).toEqual([1]);
  });

  it('a readable payload with nothing passed migrates zero lessons', () => {
    const migration = migrateGh600Passed([{ passed: [] }], { lessons: {} }, lessonsByDomain);
    expect(migration?.passedDomains).toEqual([]);
    expect(migration?.lessons).toEqual({});
  });
});

/* --------------------------------- runner ---------------------------------- */

const installedSource = {
  listSubjectIds: () => ['fixture', 'gh-600'],
  loadSubject: (id: string) => contentSource.loadSubject(id),
};

describe('importGh600Progress — runner', () => {
  it('imports passed domains, completes their lessons, sets the guard', () => {
    window.localStorage.setItem(LEGACY_GH600_KEYS[0], donorPayload([0, 2]));
    const store = createSubjectDataStore(createMemoryAdapter());
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const summary = importGh600Progress(store, installedSource);
      expect(summary?.domains).toEqual([0, 2]);
      expect(summary?.lessons).toBe(lessonsByDomain[0].length + lessonsByDomain[2].length);
      const lessons = store.getState().subjects['gh-600']?.lessons ?? {};
      expect(Object.keys(lessons)).toEqual([...lessonsByDomain[0], ...lessonsByDomain[2]]);
      expect(window.localStorage.getItem(GH600_MIGRATED_KEY)).not.toBeNull();
    } finally {
      info.mockRestore();
    }
  });

  it('second run writes nothing — the guard fires first', () => {
    window.localStorage.setItem(LEGACY_GH600_KEYS[0], donorPayload([0]));
    const store = createSubjectDataStore(createMemoryAdapter());
    vi.spyOn(console, 'info').mockImplementation(() => {});
    importGh600Progress(store, installedSource);
    expect(importGh600Progress(store, installedSource)).toBeNull();
    expect(Object.keys(store.getState().subjects['gh-600']?.lessons ?? {})).toEqual(
      lessonsByDomain[0],
    );
  });

  it('absent legacy keys are a silent no-op that does not set the guard', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createMemoryAdapter());
      expect(importGh600Progress(store, installedSource)).toBeNull();
      expect(warn).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(GH600_MIGRATED_KEY)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('unreadable JSON warns and stays retryable; a later fixed key imports', () => {
    window.localStorage.setItem(LEGACY_GH600_KEYS[0], '{not json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const store = createSubjectDataStore(createMemoryAdapter());
    try {
      expect(importGh600Progress(store, installedSource)).toBeNull();
      expect(window.localStorage.getItem(GH600_MIGRATED_KEY)).toBeNull();
      window.localStorage.setItem(LEGACY_GH600_KEYS[0], donorPayload([5]));
      expect(importGh600Progress(store, installedSource)?.domains).toEqual([5]);
    } finally {
      warn.mockRestore();
      info.mockRestore();
    }
  });

  it('parsed-but-wrong-shape payloads warn once and retry on the next start', () => {
    window.localStorage.setItem(LEGACY_GH600_KEYS[0], JSON.stringify({ tab: 'learn' }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createMemoryAdapter());
      expect(importGh600Progress(store, installedSource)).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(GH600_MIGRATED_KEY)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });

  it('leaves the keys retryable when the gh-600 pack is not installed', () => {
    window.localStorage.setItem(LEGACY_GH600_KEYS[0], donorPayload([0]));
    const absentSource = {
      listSubjectIds: () => ['fixture'],
      loadSubject: () => {
        throw new Error('must not be called');
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createMemoryAdapter());
      expect(importGh600Progress(store, absentSource)).toBeNull();
      expect(window.localStorage.getItem(GH600_MIGRATED_KEY)).toBeNull();
    } finally {
      warn.mockRestore();
    }
  });
});

/* ------------------------------ hydration gate ------------------------------ */

/** Adapter holding one fixed blob: reads always return it, writes vanish —
 *  the exact shape of the pre-hydration window, where an import's write has
 *  not reached the snapshot that rehydration will apply. */
function readOnlyAdapter(blob: string): StorageAdapter {
  return { getItem: () => blob, setItem: () => {}, removeItem: () => {} };
}

describe('hydration ordering', () => {
  it('a pre-hydration import is wiped by the persist merge while its guard latched — the loss the App gate prevents', async () => {
    window.localStorage.setItem(LEGACY_GH600_KEYS[0], donorPayload([0]));
    const persisted = JSON.stringify({
      state: { version: 1, streak: { current: 2, longest: 4 }, subjects: {} },
      version: 1,
    });
    const store = createSubjectDataStore(readOnlyAdapter(persisted));

    // What an ungated call would do: write in-memory, latch the guard.
    vi.spyOn(console, 'info').mockImplementation(() => {});
    importGh600Progress(store, installedSource);
    expect(store.getState().subjects['gh-600']).toBeDefined();

    // Hydration then applies the pre-import snapshot: the persist merge
    // replaces `subjects` wholesale (subject-store merge), the write is gone…
    await store.persist.rehydrate();
    expect(store.getState().subjects['gh-600']).toBeUndefined();

    // …but the sibling guard survived in localStorage — permanent loss.
    expect(window.localStorage.getItem(GH600_MIGRATED_KEY)).not.toBeNull();
    vi.restoreAllMocks();
  });

  it('App runs the import after hydration: migrated lessons land and persist cleanly', async () => {
    window.localStorage.setItem(LEGACY_GH600_KEYS[1], donorPayload([1]));
    window.localStorage.setItem(
      'cc-subject-data',
      JSON.stringify({
        state: { version: 1, streak: { current: 0, longest: 0 }, subjects: {} },
        version: 1,
      }),
    );
    await useSubjectDataStore.persist.rehydrate();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      render(<App />);
      await waitFor(() =>
        expect(window.localStorage.getItem(GH600_MIGRATED_KEY)).not.toBeNull(),
      );
      const lessons = useSubjectDataStore.getState().subjects['gh-600']?.lessons ?? {};
      expect(Object.keys(lessons)).toEqual(lessonsByDomain[1]);
    } finally {
      vi.restoreAllMocks();
      window.localStorage.clear();
      useSubjectDataStore.setState({ streak: { current: 0, longest: 0 }, subjects: {} });
    }
  });
});
