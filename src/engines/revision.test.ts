import { describe, expect, it } from 'vitest';
import { contentSource } from '../content/registry';
import { buildRevisionPlan } from './revision';

const content = contentSource.loadSubject('fixture');

/** Misses: storage-models 2, query-shapes 1, plus one unlessoned question. */
const attempts = [
  {
    id: 'e1',
    examId: 'exam-practice',
    date: '2026-08-01',
    durationSeconds: 300,
    timed: true,
    scaledScore: 500,
    passed: false,
    perDomain: [],
    answers: {},
    results: [
      { questionId: 'q-single', correct: false }, // lesson-storage-models
      { questionId: 'q-order', correct: false }, // lesson-storage-models
      { questionId: 'q-fill', correct: false }, // lesson-query-shapes
      { questionId: 'q-matching', correct: false }, // no lessonId
      { questionId: 'q-bug', correct: true },
    ],
  },
];

describe('buildRevisionPlan', () => {
  it('aggregates misses per lesson, worst first', () => {
    const plan = buildRevisionPlan(content, attempts);
    expect(plan.map((item) => item.lessonId)).toEqual([
      'lesson-storage-models',
      'lesson-query-shapes',
    ]);
    expect(plan[0]).toMatchObject({
      slug: 'storage-models',
      title: 'Storage models',
      misses: 2,
      priority: 2,
      reason: 'Missed 2 exam questions tied to this lesson.',
    });
  });

  it('misses without a lesson link are skipped', () => {
    const plan = buildRevisionPlan(content, attempts);
    expect(plan.some((item) => item.reason.includes('q-matching'))).toBe(false);
  });

  it('respects the limit', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      ...attempts[0],
      id: `e-${i}`,
      results: [
        { questionId: 'q-single', correct: false },
        { questionId: 'q-fill', correct: false },
      ],
    }));
    // Both lessons accumulate 5 misses each; limit 1 keeps only the first.
    expect(buildRevisionPlan(content, many, 1)).toHaveLength(1);
  });

  it('no misses -> empty plan', () => {
    expect(buildRevisionPlan(content, [])).toEqual([]);
    expect(
      buildRevisionPlan(content, [
        { ...attempts[0], results: [{ questionId: 'q-bug', correct: true }] },
      ]),
    ).toEqual([]);
  });
});
