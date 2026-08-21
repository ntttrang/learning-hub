import { describe, expect, it } from 'vitest';
import type { ExamConfig, Question } from '../content/types';
import { mulberry32, sampleExam, sampleIds, shuffleWith } from './sample';

/** Minimal single-choice questions for a fake domain. */
function fakeQuestions(domainId: string, count: number): Question[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${domainId}-q${String(index + 1).padStart(2, '0')}`,
    cert: 'gh900' as const,
    domainId,
    subSkillId: 's1',
    stem: `Stem ${index}`,
    explanation: 'Explanation.',
    docId: 'doc',
    kind: 'single' as const,
    options: ['a', 'b', 'c', 'd'],
    answerIndex: 0,
  }));
}

/** A tiny exam over one fake domain — nothing to do with the real configs. */
const TINY_EXAM: ExamConfig = {
  id: 'tiny-mock',
  cert: 'gh900',
  title: 'Tiny mock',
  durationMin: 1,
  totalQuestions: 3,
  domainPlan: { 'tiny-d1': 3 },
  seed: 42,
};

describe('mulberry32', () => {
  it('returns the same sequence for the same seed and stays in [0, 1)', () => {
    const first = mulberry32(1234);
    const second = mulberry32(1234);
    const other = mulberry32(5678);
    for (let i = 0; i < 20; i++) {
      const a = first();
      expect(a).toBe(second());
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(1);
    }
    // Different seeds eventually diverge.
    expect(mulberry32(1234)()).not.toBe(other());
  });
});

describe('shuffleWith', () => {
  it('keeps every item exactly once (a permutation)', () => {
    const rng = mulberry32(7);
    const items = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = shuffleWith(rng, items);
    expect(shuffled).not.toEqual(items);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it('never mutates the input array', () => {
    const items = [1, 2, 3, 4, 5];
    shuffleWith(mulberry32(9), items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('is seed-deterministic', () => {
    expect(shuffleWith(mulberry32(11), ['a', 'b', 'c', 'd'])).toEqual(
      shuffleWith(mulberry32(11), ['a', 'b', 'c', 'd']),
    );
  });
});

describe('sampleIds and sampleExam', () => {
  it('draws the planned count from the domain pool, deterministically', () => {
    const pool = fakeQuestions('tiny-d1', 10);
    expect(sampleIds(TINY_EXAM, pool)).toEqual(sampleIds(TINY_EXAM, pool));
    expect(sampleIds(TINY_EXAM, pool)).toHaveLength(3);
    expect(sampleExam(TINY_EXAM, pool).map((q) => q.id)).toEqual(sampleIds(TINY_EXAM, pool));
  });

  it('excludes already-drawn ids before sampling', () => {
    const pool = fakeQuestions('tiny-d1', 10);
    const takenByA = sampleIds(TINY_EXAM, pool);
    const paperB = sampleIds(
      TINY_EXAM,
      pool,
      new Set(takenByA),
    );
    expect(paperB.filter((id) => takenByA.includes(id))).toEqual([]);
    expect(paperB).toHaveLength(3);
  });

  it('throws when a domain pool cannot cover its plan', () => {
    const pool = fakeQuestions('tiny-d1', 2);
    expect(() => sampleIds(TINY_EXAM, pool)).toThrow(/tiny-d1/);
  });
});
