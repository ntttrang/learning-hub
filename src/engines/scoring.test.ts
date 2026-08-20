import { describe, expect, it } from 'vitest';
import type { Answer, Exam, Question } from '../sdk/types';
import { matchingTokens } from '../sdk/registry/questions';
import { scoreAttempt, scoreByDomain, scoreQuestions, toScaledScore } from './scoring';

const q = (id: string, domainId: string): Question => ({
  id,
  domainId,
  kind: 'single',
  prompt: 'p',
  explanation: 'e',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ],
  correct: 'a',
});

const questions: Question[] = [
  q('q1', 'd1'),
  q('q2', 'd1'),
  q('q3', 'd2'),
  q('q4', 'd2'),
];

const exam: Exam = {
  id: 'exam-x',
  title: 'X',
  durationMinutes: 30,
  selection: { kind: 'fixed', questionIds: ['q1', 'q2', 'q3', 'q4'] },
};

describe('toScaledScore (100–1000 certification scale)', () => {
  it('maps raw accuracy onto the scale', () => {
    expect(toScaledScore(4, 4)).toBe(1000);
    expect(toScaledScore(2, 4)).toBe(550);
    expect(toScaledScore(0, 4)).toBe(100);
    expect(toScaledScore(1, 3)).toBe(400);
  });

  it('returns 0 for an empty run instead of NaN', () => {
    expect(toScaledScore(0, 0)).toBe(0);
  });
});

describe('scoreQuestions', () => {
  it('grades every question and reports accuracy', () => {
    const answers: Record<string, Answer> = { q1: ['a'], q2: ['b'], q3: ['a'], q4: [] };
    const summary = scoreQuestions(questions, answers);
    expect(summary).toMatchObject({ total: 4, correct: 2, accuracy: 0.5 });
    expect(summary.results).toEqual([
      { questionId: 'q1', correct: true },
      { questionId: 'q2', correct: false },
      { questionId: 'q3', correct: true },
      { questionId: 'q4', correct: false },
    ]);
  });

  it('unanswered questions count as wrong', () => {
    const summary = scoreQuestions(questions, {});
    expect(summary.correct).toBe(0);
    expect(summary.accuracy).toBe(0);
  });

  it('empty question list scores cleanly', () => {
    const summary = scoreQuestions([], {});
    expect(summary).toMatchObject({ total: 0, correct: 0, accuracy: 0 });
  });
});

describe('scoreByDomain', () => {
  it('groups verdicts by domain in first-appearance order', () => {
    const { results } = scoreQuestions(questions, { q1: ['a'], q2: ['a'], q3: ['b'] });
    expect(scoreByDomain(questions, results)).toEqual([
      { domainId: 'd1', correct: 2, total: 2 },
      { domainId: 'd2', correct: 0, total: 2 },
    ]);
  });
});

describe('scoreAttempt', () => {
  it('a perfect run scores 1000 and passes', () => {
    const answers = Object.fromEntries(questions.map((question) => [question.id, ['a']]));
    const score = scoreAttempt(exam, questions, answers);
    expect(score.scaledScore).toBe(1000);
    expect(score.passed).toBe(true);
    expect(score.perDomain).toEqual([
      { domainId: 'd1', correct: 2, total: 2 },
      { domainId: 'd2', correct: 2, total: 2 },
    ]);
  });

  it('half right scores 550 and fails the default 700 bar', () => {
    const answers: Record<string, Answer> = { q1: ['a'], q3: ['a'], q2: ['b'], q4: ['b'] };
    const score = scoreAttempt(exam, questions, answers);
    expect(score.scaledScore).toBe(550);
    expect(score.passed).toBe(false);
  });

  it('respects a custom passingScore', () => {
    const lenient: Exam = { ...exam, passingScore: 500 };
    const answers: Record<string, Answer> = { q1: ['a'], q3: ['a'], q2: ['b'], q4: ['b'] };
    expect(scoreAttempt(lenient, questions, answers).passed).toBe(true);
  });

  it('nothing right floors at 100 and still fails', () => {
    const score = scoreAttempt(exam, questions, {});
    expect(score.scaledScore).toBe(100);
    expect(score.passed).toBe(false);
  });
});

describe('cross-kind grading through the registry', () => {
  it('scoreQuestions grades non-single kinds via their registered graders', () => {
    const matching: Question = {
      id: 'm1',
      domainId: 'd9',
      kind: 'matching',
      prompt: 'p',
      explanation: 'e',
      pairs: [
        { left: 'L1', right: 'R1' },
        { left: 'L2', right: 'R2' },
      ],
    };
    const right = matchingTokens(matching.pairs);
    const swapped = ['0::R2', '1::R1'];
    const summary = scoreQuestions([matching], { m1: right });
    const wrong = scoreQuestions([matching], { m1: swapped });
    expect(summary.correct).toBe(1);
    expect(wrong.correct).toBe(0);
  });
});
