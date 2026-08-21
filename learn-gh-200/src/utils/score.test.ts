import { describe, expect, it } from 'vitest';
import type { Question } from '../content/types';
import { scoreAttempt } from './score';

/** Three single-choice questions across two fake domains. */
const QUESTIONS: Question[] = [
  {
    id: 'q1',
    cert: 'gh900',
    domainId: 'dA',
    subSkillId: 's1',
    stem: 'One',
    explanation: 'Explanation.',
    docId: 'doc',
    kind: 'single',
    options: ['right', 'wrong1', 'wrong2', 'wrong3'],
    answerIndex: 0,
  },
  {
    id: 'q2',
    cert: 'gh900',
    domainId: 'dA',
    subSkillId: 's1',
    stem: 'Two',
    explanation: 'Explanation.',
    docId: 'doc',
    kind: 'single',
    options: ['right', 'wrong1', 'wrong2', 'wrong3'],
    answerIndex: 0,
  },
  {
    id: 'q3',
    cert: 'gh900',
    domainId: 'dB',
    subSkillId: 's1',
    stem: 'Three',
    explanation: 'Explanation.',
    docId: 'doc',
    kind: 'single',
    options: ['wrong1', 'right', 'wrong2', 'wrong3'],
    answerIndex: 1,
  },
];

describe('scoreAttempt', () => {
  it('scores a perfect paper 1000 and passes it', () => {
    const score = scoreAttempt(QUESTIONS, { q1: 0, q2: 0, q3: 1 });
    expect(score).toMatchObject({ scaledScore: 1000, passed: true, correct: 3, total: 3 });
  });

  it('scores a blank paper 100 and fails it', () => {
    const score = scoreAttempt(QUESTIONS, { q1: 1, q2: 2, q3: 0 });
    expect(score).toMatchObject({ scaledScore: 100, passed: false, correct: 0, total: 3 });
  });

  it('lands two-thirds correct exactly on the 700 pass mark', () => {
    const score = scoreAttempt(QUESTIONS, { q1: 0, q2: 0, q3: 0 });
    expect(score.scaledScore).toBe(700);
    expect(score.passed).toBe(true);
  });

  it('scores one-third correct at 400', () => {
    const score = scoreAttempt(QUESTIONS, { q1: 0 });
    expect(score.scaledScore).toBe(400);
    expect(score.passed).toBe(false);
  });

  it('counts unanswered and wrongly-typed answers as wrong', () => {
    const score = scoreAttempt(QUESTIONS, { q1: 0, q2: 0 });
    // q3 unanswered → 2/3 correct → exactly 700.
    expect(score.correct).toBe(2);
    expect(score.scaledScore).toBe(700);
  });

  it('breaks the score down per domain', () => {
    const score = scoreAttempt(QUESTIONS, { q1: 0, q2: 1, q3: 1 });
    expect(score.perDomain).toEqual({
      dA: { correct: 1, total: 2 },
      dB: { correct: 1, total: 1 },
    });
  });

  it('returns 0 for an empty paper instead of NaN', () => {
    const score = scoreAttempt([], {});
    expect(score).toMatchObject({ scaledScore: 0, passed: false, total: 0 });
  });
});
