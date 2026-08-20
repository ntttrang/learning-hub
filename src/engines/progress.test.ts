import { describe, expect, it } from 'vitest';
import { contentSource } from '../content/registry';
import { computeStats } from './progress';

/** Fixture pack: 2 domains, 2 lessons (d1: 1, d2: 1), 1 lab, 7 questions. */
const content = contentSource.loadSubject('fixture');

const emptyInput = {
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
};

describe('computeStats against the fixture pack', () => {
  it('empty progress yields zeros without dividing by zero', () => {
    const stats = computeStats(content, emptyInput);
    expect(stats).toMatchObject({
      overall: 0,
      completedLessons: 0,
      totalLessons: 2,
      quizAccuracy: 0,
      quizCount: 0,
      labsDone: 0,
    });
    expect(stats.domainCompletion).toEqual({ d1: 0, d2: 0 });
    expect(stats.weakDomains).toEqual([]);
  });

  it('lesson completion rolls up per domain and overall', () => {
    const stats = computeStats(content, {
      ...emptyInput,
      lessons: {
        'lesson-storage-models': { status: 'completed' },
      },
    });
    expect(stats.completedLessons).toBe(1);
    expect(stats.overall).toBe(0.5);
    expect(stats.domainCompletion).toEqual({ d1: 1, d2: 0 });
  });

  it('quiz accuracy aggregates correct/total across attempts', () => {
    const stats = computeStats(content, {
      ...emptyInput,
      quizAttempts: [
        { id: 'a1', scope: 'm-storage', date: '2026-08-01', total: 3, correct: 2, questionResults: [] },
        { id: 'a2', scope: 'm-querying', date: '2026-08-02', total: 2, correct: 2, questionResults: [] },
      ],
    });
    expect(stats.quizAccuracy).toBe(4 / 5);
    expect(stats.quizCount).toBe(2);
  });

  it('labsDone counts only labs that exist in the pack', () => {
    const stats = computeStats(content, {
      ...emptyInput,
      completedLabs: ['lab-explore', 'ghost-lab'],
    });
    expect(stats.labsDone).toBe(1);
  });

  it('domain exam accuracy sorts weak domains worst-first', () => {
    const stats = computeStats(content, {
      ...emptyInput,
      examAttempts: [
        {
          id: 'e1',
          examId: 'exam-practice',
          date: '2026-08-01',
          durationSeconds: 60,
          timed: true,
          scaledScore: 600,
          passed: false,
          perDomain: [
            { domainId: 'd1', correct: 1, total: 2 },
            { domainId: 'd2', correct: 2, total: 2 },
          ],
          answers: {},
          results: [],
        },
        {
          id: 'e2',
          examId: 'exam-practice',
          date: '2026-08-02',
          durationSeconds: 60,
          timed: true,
          scaledScore: 650,
          passed: false,
          perDomain: [{ domainId: 'd1', correct: 1, total: 2 }],
          answers: {},
          results: [],
        },
      ],
    });
    // d1: 2/4 = 0.5, d2: 2/2 = 1 -> d1 weaker
    expect(stats.domainExam).toEqual({ d1: 0.5, d2: 1 });
    expect(stats.weakDomains).toEqual(['d1', 'd2']);
  });

  it('is subject-blind: an empty pack computes without errors', () => {
    const emptyPack = { ...content, lessons: [], domains: [], labs: [] };
    const stats = computeStats(emptyPack, emptyInput);
    expect(stats.overall).toBe(0);
    expect(stats.domainCompletion).toEqual({});
  });
});
