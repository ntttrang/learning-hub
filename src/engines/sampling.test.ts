import { describe, expect, it } from 'vitest';
import { contentSource } from '../content/registry';
import type { Exam, Question } from '../sdk/types';
import { mulberry32, sampleExam, sampleIds, shuffleWith } from './sampling';

/** The real fixture pack: 7 questions across d1 (4) and d2 (3). */
const fixture = contentSource.loadSubject('fixture');
const exam = fixture.exams[0]; // sampled: { d1: 2, d2: 2 }, seed 42

/* Golden values pinned by the deterministic pipeline (seed 42 over the
 * fixture bank). If these change, either the bank or the algorithm changed —
 * both are events a reviewer must see. */
const GOLDEN_FULL = ['q-single', 'q-code-reading', 'q-matching', 'q-bug'];

describe('PRNG determinism', () => {
  it('mulberry32 produces the same sequence for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('different seeds diverge', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('shuffleWith returns a permutation without mutating the input', () => {
    const rng = mulberry32(7);
    const input = [1, 2, 3, 4, 5];
    const shuffled = shuffleWith(rng, input);
    expect(shuffled.slice().sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('sampleIds determinism and plan compliance', () => {
  it('same config -> same golden paper', () => {
    expect(sampleIds(exam, fixture.questions)).toEqual(GOLDEN_FULL);
    expect(sampleIds(exam, fixture.questions)).toEqual(sampleIds(exam, fixture.questions));
  });

  it('different seeds produce a different paper (with overwhelming likelihood)', () => {
    const other: Exam = {
      ...exam,
      selection: { kind: 'sampled', domainPlan: { d1: 2, d2: 2 }, seed: 43 },
    };
    expect(sampleIds(other, fixture.questions)).not.toEqual(GOLDEN_FULL);
  });

  it('respects domainPlan counts per domain', () => {
    const ids = sampleIds(exam, fixture.questions);
    const byDomain = fixture.questions.filter((q) => ids.includes(q.id));
    expect(byDomain.filter((q) => q.domainId === 'd1')).toHaveLength(2);
    expect(byDomain.filter((q) => q.domainId === 'd2')).toHaveLength(2);
  });

  it('exclusion removes ids from the pool and replaces them', () => {
    const ids = sampleIds(exam, fixture.questions, new Set(['q-single', 'q-fill']));
    expect(ids).toHaveLength(4);
    expect(ids).not.toContain('q-single');
    expect(ids).not.toContain('q-fill');
  });

  it('throws a precise error when a domain pool is too small', () => {
    const infeasible: Exam = {
      ...exam,
      selection: { kind: 'sampled', domainPlan: { d1: 99 }, seed: 42 },
    };
    expect(() => sampleIds(infeasible, fixture.questions)).toThrow(
      /exam-practice: domain d1 needs 99 questions but only 4 are available/,
    );
  });

  it('rejects fixed-selection exams with an explicit message', () => {
    const fixed: Exam = {
      ...exam,
      selection: { kind: 'fixed', questionIds: ['q-single'] },
    };
    expect(() => sampleIds(fixed, fixture.questions)).toThrow(/selection is "fixed", not "sampled"/);
  });
});

describe('sampleExam', () => {
  it('returns the questions in sampleIds order', () => {
    const questions = sampleExam(exam, fixture.questions);
    expect(questions.map((q: Question) => q.id)).toEqual(GOLDEN_FULL);
    expect(questions.every((q) => fixture.questions.includes(q))).toBe(true);
  });
});
