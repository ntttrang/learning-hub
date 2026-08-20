/**
 * Legacy progress migration tests — mapper purity, donor-answer translation
 * per kind, score-only attempts, drop-not-crash corruption handling, and the
 * runner's guard/idempotency contract. Fixtures run against the real packs so
 * question ids, option order, and the deterministic golden papers are exactly
 * what production migrates.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contentSource } from '../content/registry';
import type { Question, SubjectUserData } from '../sdk/types';
import { assemblePaper } from './exam-paper';
import {
  importLegacyGhProgress,
  LEGACY_MIGRATED_KEY,
  LEGACY_PROGRESS_KEY,
  migrateLegacyProgress,
} from './migrate-gh-progress';
import { createLocalStorageAdapter, createMemoryAdapter } from './storage';
import { createSubjectDataStore } from './subject-store';

const content = contentSource.loadSubject('gh-900');
const exam = content.exams.find((candidate) => candidate.id.endsWith('-mock-a'))!;
const paper = assemblePaper(content, exam);

/** One question of every donor kind, from anywhere in the bank. */
const kindPicks: Question[] = (['single', 'multi', 'order', 'fill', 'bug'] as const).map(
  (kind) => content.questions.find((question) => question.kind === kind)!,
);

/** Same picks, narrowed — the encoding assertions read kind-specific fields. */
function pickKind<K extends Question['kind']>(kind: K): Extract<Question, { kind: K }> {
  return content.questions.find((question) => question.kind === kind) as Extract<Question, { kind: K }>;
}

const emptyCurrent = (): SubjectUserData => ({
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
  srs: {},
  notes: [],
  bookmarks: [],
});

const legacyPayload = (examAttempts: unknown[], extra: Record<string, unknown> = {}) => ({
  version: 1,
  lessonsRead: {},
  labsDone: {},
  practiceStats: {},
  examAttempts,
  ...extra,
});

const legacyAttempt = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  examId: exam.id,
  date: '2026-08-01T10:00:00.000Z',
  scaledScore: 800,
  passed: true,
  perDomain: { [paper[0].domainId]: { correct: 10, total: 20 } },
  durationSec: 4800,
  ...overrides,
});

/* Donor-format answers built from each question's own key — what a learner
 * who answered correctly (or deliberately wrongly) would have submitted. */
function correctLegacyAnswer(question: Question): number | number[] | string[] {
  switch (question.kind) {
    case 'single':
    case 'codeReading':
      return question.options.findIndex((option) => option.id === question.correct);
    case 'multi':
    case 'order':
      return question.correct.map((id) => question.options.findIndex((option) => option.id === id));
    case 'fill':
      return question.blanks.map((blank) => blank.answer);
    case 'bug':
      return question.buggyLineIndex;
    default:
      throw new Error(`unsupported kind ${question.kind}`);
  }
}

function wrongLegacyAnswer(question: Question): number | number[] | string[] {
  switch (question.kind) {
    case 'single':
    case 'codeReading': {
      const correct = correctLegacyAnswer(question) as number;
      return (correct + 1) % question.options.length;
    }
    case 'multi': {
      const correct = correctLegacyAnswer(question) as number[];
      const extra = question.options.findIndex((_, index) => !correct.includes(index));
      return extra >= 0 ? [...correct.filter((_, i) => i !== 0), extra] : correct.slice(0, -1);
    }
    case 'order': {
      const correct = correctLegacyAnswer(question) as number[];
      return correct.length > 1 ? [correct[1], correct[0], ...correct.slice(2)] : correct;
    }
    case 'fill':
      return question.blanks.map(() => 'not-the-answer');
    case 'bug':
      return (question.buggyLineIndex + 1) % question.codeLines.length;
    default:
      throw new Error(`unsupported kind ${question.kind}`);
  }
}

/* --------------------------------- mapper ---------------------------------- */

describe('migrateLegacyProgress — mapper', () => {
  it('translates every answer kind and grades donor-correct answers as correct', () => {
    const answered = [...paper, ...kindPicks];
    const answers = Object.fromEntries(answered.map((q) => [q.id, correctLegacyAnswer(q)]));
    const partial = migrateLegacyProgress(
      legacyPayload([legacyAttempt({ answers })]),
      emptyCurrent(),
      content,
    )!;

    const attempt = partial.examAttempts![0]!;
    expect(attempt.id).toBe(`legacy-${exam.id}-0`);
    expect(attempt.examId).toBe(exam.id);
    expect(attempt.date).toBe('2026-08-01T10:00:00.000Z');
    expect(attempt.durationSeconds).toBe(4800);
    expect(attempt.timed).toBe(true);
    expect(attempt.scaledScore).toBe(800);
    expect(attempt.passed).toBe(true);
    expect(attempt.perDomain).toEqual([{ domainId: paper[0].domainId, correct: 10, total: 20 }]);

    // Grading covers the deterministic paper; correct donor answers stay correct.
    expect(attempt.results).toHaveLength(paper.length);
    expect(attempt.results.every((result) => result.correct)).toBe(true);

    // Encodings: option ids for single/multi/order, line index for bug, verbatim for fill.
    const single = pickKind('single');
    const multi = pickKind('multi');
    const order = pickKind('order');
    const fill = pickKind('fill');
    const bug = pickKind('bug');
    expect(attempt.answers[single.id]).toEqual([single.correct]);
    expect([...attempt.answers[multi.id]].sort()).toEqual([...multi.correct].sort());
    expect(attempt.answers[order.id]).toEqual(order.correct);
    expect(attempt.answers[fill.id]).toEqual(fill.blanks.map((blank) => blank.answer));
    expect(attempt.answers[bug.id]).toEqual([String(bug.buggyLineIndex)]);
  });

  it('grades deliberately wrong donor answers as wrong', () => {
    const answers = Object.fromEntries([
      ...paper.map((q) => [q.id, correctLegacyAnswer(q)]),
      ...kindPicks.map((q) => [q.id, wrongLegacyAnswer(q)]),
    ]);
    const partial = migrateLegacyProgress(
      legacyPayload([legacyAttempt({ answers })]),
      emptyCurrent(),
      content,
    )!;
    const attempt = partial.examAttempts![0]!;
    const pickIds = new Set(kindPicks.map((q) => q.id));
    const wrong = attempt.results.filter((result) => pickIds.has(result.questionId));
    expect(wrong.length).toBeGreaterThan(0);
    expect(wrong.every((result) => !result.correct)).toBe(true);
    expect(
      attempt.results.filter((result) => !pickIds.has(result.questionId)).every((r) => r.correct),
    ).toBe(true);
  });

  it('keeps an attempt whose multi answer is the empty selection — grades it wrong', () => {
    // The donor records [] when a learner untoggles their last multi option
    // (MultiCard); it graded that wrong, so the attempt is real history.
    const multiOnPaper = paper.find((question) => question.kind === 'multi')!;
    const answers = Object.fromEntries(paper.map((q) => [q.id, correctLegacyAnswer(q)]));
    answers[multiOnPaper.id] = [];
    const partial = migrateLegacyProgress(
      legacyPayload([legacyAttempt({ answers })]),
      emptyCurrent(),
      content,
    )!;
    const attempt = partial.examAttempts![0]!;
    expect(attempt.answers[multiOnPaper.id]).toEqual([]);
    expect(attempt.results.find((result) => result.questionId === multiOnPaper.id)?.correct)
      .toBe(false);
    expect(
      attempt.results.filter((result) => result.questionId !== multiOnPaper.id)
        .every((result) => result.correct),
    ).toBe(true);
  });

  it('migrates answer-less attempts score-only: empty answers/results, score kept', () => {
    const { answers: _drop, ...scoreOnly } = legacyAttempt();
    const partial = migrateLegacyProgress(legacyPayload([scoreOnly]), emptyCurrent(), content)!;
    const attempt = partial.examAttempts![0]!;
    expect(attempt.answers).toEqual({});
    expect(attempt.results).toEqual([]);
    expect(attempt.scaledScore).toBe(800);
    expect(attempt.date).toBe('2026-08-01T10:00:00.000Z');
  });

  it('maps lessonsRead (domain-keyed) onto the domain lesson, labs verbatim', () => {
    const domain = content.domains[0];
    const lesson = content.lessons.find((candidate) => candidate.domainId === domain.id)!;
    const lab = content.labs[0];
    const partial = migrateLegacyProgress(
      legacyPayload([], {
        lessonsRead: { [domain.id]: '2026-07-01T09:00:00.000Z' },
        labsDone: { [lab.id]: '2026-07-02T09:00:00.000Z' },
      }),
      emptyCurrent(),
      content,
    )!;
    expect(partial.lessons).toEqual({
      [lesson.id]: { status: 'completed', lastVisited: '2026-07-01T09:00:00.000Z' },
    });
    expect(partial.completedLabs).toEqual([lab.id]);
  });

  it('ignores entries belonging to the other cert and unknown ids', () => {
    const partial = migrateLegacyProgress(
      legacyPayload([
        { examId: 'gh200-mock-a', date: 'x', scaledScore: 1, passed: false, perDomain: {} },
      ], {
        lessonsRead: { 'gh200-d1': '2026-07-01T09:00:00.000Z' },
        labsDone: { 'gh200-lab-01': '2026-07-02T09:00:00.000Z', 'gh900-not-a-lab': '2026-07-03T09:00:00.000Z' },
      }),
      emptyCurrent(),
      content,
    );
    expect(partial).toBeNull();
  });

  it('drops unreadable or out-of-range attempts without crashing, keeps the rest', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const bad = { examId: exam.id, date: 'x', passed: true, perDomain: {} }; // no scaledScore
      const outOfRange = legacyAttempt({ answers: { [paper[0].id]: 99 } });
      const partial = migrateLegacyProgress(
        legacyPayload([bad, outOfRange, legacyAttempt()]),
        emptyCurrent(),
        content,
      )!;
      expect(partial.examAttempts).toHaveLength(1);
      expect(partial.examAttempts![0]!.id).toBe(`legacy-${exam.id}-2`);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('dropped 2');
    } finally {
      warn.mockRestore();
    }
  });

  it('already-present hub keys win — the old value loses', () => {
    const domain = content.domains[0];
    const lesson = content.lessons.find((candidate) => candidate.domainId === domain.id)!;
    const current: SubjectUserData = {
      ...emptyCurrent(),
      lessons: { [lesson.id]: { status: 'in-progress' } },
      completedLabs: [content.labs[0].id],
      examAttempts: [
        {
          id: `legacy-${exam.id}-0`,
          examId: exam.id,
          date: '2026-08-01T10:00:00.000Z',
          durationSeconds: 6000,
          timed: true,
          scaledScore: 700,
          passed: true,
          perDomain: [],
          answers: {},
          results: [],
        },
      ],
    };
    const partial = migrateLegacyProgress(
      legacyPayload([legacyAttempt()], {
        lessonsRead: { [domain.id]: '2020-01-01T00:00:00.000Z' },
        labsDone: { [content.labs[0].id]: '2020-01-01T00:00:00.000Z' },
      }),
      current,
      content,
    );
    expect(partial).toBeNull(); // everything it could map is already present
  });
});

/* --------------------------------- runner ---------------------------------- */

describe('importLegacyGhProgress — runner', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function seedLegacyPayload() {
    const content200 = contentSource.loadSubject('gh-200');
    const exam200 = content200.exams.find((candidate) => candidate.id.endsWith('-mock-a'))!;
    const paper200 = assemblePaper(content200, exam200);
    window.localStorage.setItem(
      LEGACY_PROGRESS_KEY,
      JSON.stringify(
        legacyPayload(
          [
            legacyAttempt({ answers: Object.fromEntries(paper200.map((q) => [q.id, correctLegacyAnswer(q)])), examId: exam200.id }),
            legacyAttempt(), // gh-900, score-only
          ],
          {
            lessonsRead: {
              [content.domains[0].id]: '2026-07-01T09:00:00.000Z',
              [content200.domains[0].id]: '2026-07-02T09:00:00.000Z',
            },
            labsDone: { [content.labs[0].id]: '2026-07-03T09:00:00.000Z' },
            practiceStats: { 'gh900-d1': { seen: 12, correct: 9 } },
          },
        ),
      ),
    );
  }

  it('skips a pack that fails validation without aborting the import', () => {
    seedLegacyPayload();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createMemoryAdapter());
      // One invalid pack alongside the real ones — the same condition the
      // shell's tolerant listing exists for. It must not reach the effect.
      const brokenSource = {
        listSubjectIds: () => [...contentSource.listSubjectIds(), 'broken-pack'],
        loadSubject: (id: string) => {
          if (id === 'broken-pack') throw new Error('invalid pack');
          return contentSource.loadSubject(id);
        },
      };
      const summary = importLegacyGhProgress(store, brokenSource)!;

      expect(summary.subjects.map((s) => s.subjectId)).not.toContain('broken-pack');
      expect(store.getState().subjects['gh-900'].examAttempts).toHaveLength(1);
      expect(window.localStorage.getItem(LEGACY_MIGRATED_KEY)).not.toBeNull();
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0]).toContain('skipping invalid pack broken-pack');
    } finally {
      error.mockRestore();
      info.mockRestore();
    }
  });

  it('imports both certs, partitions by prefix, sets the guard, leaves fixture alone', () => {
    seedLegacyPayload();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createMemoryAdapter());
      const summary = importLegacyGhProgress(store)!;

      expect(summary.subjects.map((s) => s.subjectId).sort()).toEqual(['gh-200', 'gh-900']);
      expect(window.localStorage.getItem(LEGACY_MIGRATED_KEY)).not.toBeNull();
      expect(info).toHaveBeenCalledTimes(1);
      expect(info.mock.calls[0][0]).toContain('practiceStats aggregates have no hub equivalent');

      const subjects = store.getState().subjects;
      expect(subjects['fixture']).toBeUndefined();
      // gh-900: one lesson, one lab, one score-only attempt.
      expect(subjects['gh-900'].examAttempts[0]!.results).toEqual([]);
      expect(subjects['gh-900'].completedLabs).toEqual([content.labs[0].id]);
      // gh-200: one answered attempt with graded results.
      const answered = subjects['gh-200'].examAttempts[0]!;
      expect(answered.results).toHaveLength(35);
      expect(answered.results.every((result) => result.correct)).toBe(true);
    } finally {
      info.mockRestore();
    }
  });

  it('second run writes nothing — guard first, idempotent ids underneath', () => {
    seedLegacyPayload();
    const store = createSubjectDataStore(createMemoryAdapter());
    importLegacyGhProgress(store)!;
    const afterFirst = JSON.stringify(store.getState().subjects);

    expect(importLegacyGhProgress(store)).toBeNull(); // guard short-circuits

    window.localStorage.removeItem(LEGACY_MIGRATED_KEY); // simulate guard loss
    importLegacyGhProgress(store); // deterministic ids + skip-if-present
    expect(JSON.stringify(store.getState().subjects)).toBe(afterFirst);
  });

  it('absent old key is a silent no-op that does not set the guard', () => {
    const store = createSubjectDataStore(createMemoryAdapter());
    expect(importLegacyGhProgress(store)).toBeNull();
    expect(window.localStorage.getItem(LEGACY_MIGRATED_KEY)).toBeNull();
    expect(store.getState().subjects).toEqual({});
  });

  it('unreadable JSON warns once and retries on the next start', () => {
    window.localStorage.setItem(LEGACY_PROGRESS_KEY, '{not json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const store = createSubjectDataStore(createMemoryAdapter());
      expect(importLegacyGhProgress(store)).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(LEGACY_MIGRATED_KEY)).toBeNull(); // retryable
    } finally {
      warn.mockRestore();
    }
  });

  it('survives a persist → reload cycle without duplicating attempts', async () => {
    seedLegacyPayload();
    const first = createSubjectDataStore(createLocalStorageAdapter());
    await vi.waitFor(() => expect(first.persist.hasHydrated()).toBe(true));
    importLegacyGhProgress(first)!;
    expect(first.getState().subjects['gh-900'].examAttempts).toHaveLength(1);

    // "Reload": a fresh store over the same storage rehydrates, then the app
    // effect runs the import again — the guard keeps it a no-op.
    const reloaded = createSubjectDataStore(createLocalStorageAdapter());
    await vi.waitFor(() => expect(reloaded.persist.hasHydrated()).toBe(true));
    expect(importLegacyGhProgress(reloaded)).toBeNull();
    expect(reloaded.getState().subjects['gh-900'].examAttempts).toHaveLength(1);
    expect(reloaded.getState().subjects['gh-200'].examAttempts[0]!.id).toBe('legacy-gh200-mock-a-0');
  });
});
