import type { Question } from '../content/types';
import { gradeQuestion, type QuestionAnswer } from './grade';

/** One domain's tally inside a submitted paper. */
export interface DomainScore {
  correct: number;
  total: number;
}

export interface ExamScore {
  /** 100–1000, the certification's reported scale. */
  scaledScore: number;
  /** 700 is the real pass mark on both exams. */
  passed: boolean;
  correct: number;
  total: number;
  perDomain: Record<string, DomainScore>;
}

/**
 * Score a submitted paper on the certification's 100–1000 scale: 100 points
 * for sitting the exam plus 900 spread across the questions, so the 700 pass
 * mark lands at two-thirds correct. Unanswered questions count as wrong,
 * matching the real exam. Per-question grading is the frozen phase-4
 * `gradeQuestion` — this module only aggregates it.
 */
export function scoreAttempt(
  questions: Question[],
  answers: Record<string, QuestionAnswer>,
): ExamScore {
  let correct = 0;
  const perDomain: Record<string, DomainScore> = {};
  for (const question of questions) {
    const tally = perDomain[question.domainId] ?? { correct: 0, total: 0 };
    tally.total += 1;
    const answer = answers[question.id];
    if (answer !== undefined && gradeQuestion(question, answer)) {
      correct += 1;
      tally.correct += 1;
    }
    perDomain[question.domainId] = tally;
  }

  const total = questions.length;
  const scaledScore = total === 0 ? 0 : Math.round(100 + (900 * correct) / total);
  return { scaledScore, passed: scaledScore >= 700, correct, total, perDomain };
}
