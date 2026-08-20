import type { Answer, Exam, Question } from '../sdk/types';
import { gradeQuestion, sameOrder, sameSet } from '../sdk/registry/questions';

/**
 * Scoring on the certification scale (DP-800 rules, merged with GH-200's
 * accuracy model): every question is worth the same, no partial credit, and
 * a scaled run scores `100 + 900 * correct / total` out of 1000.
 *
 * Grading itself lives behind the question-kind registry; this module only
 * aggregates registry verdicts. Re-exported helpers keep the legacy import
 * surface (`sameSet` / `sameOrder`) working for engine callers.
 */

export { sameSet, sameOrder };

export interface QuestionResult {
  questionId: string;
  correct: boolean;
}

export interface ScoreSummary {
  total: number;
  correct: number;
  /** 0..1 share answered correctly. */
  accuracy: number;
  results: QuestionResult[];
}

export interface DomainScore {
  domainId: string;
  correct: number;
  total: number;
}

export interface ExamScore extends ScoreSummary {
  scaledScore: number;
  passed: boolean;
  perDomain: DomainScore[];
}

/** Grade a batch of questions against a questionId -> answer map. */
export function scoreQuestions(questions: Question[], answers: Record<string, Answer>): ScoreSummary {
  const results: QuestionResult[] = questions.map((question) => ({
    questionId: question.id,
    correct: gradeQuestion(question, answers[question.id] ?? []),
  }));
  const correct = results.filter((r) => r.correct).length;
  return {
    total: questions.length,
    correct,
    accuracy: questions.length === 0 ? 0 : correct / questions.length,
    results,
  };
}

/** Map a raw correct count onto the 100–1000 certification scale. */
export function toScaledScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(100 + (900 * correct) / total);
}

/** Group verdicts by domain, in first-appearance order. */
export function scoreByDomain(questions: Question[], results: QuestionResult[]): DomainScore[] {
  const verdicts = new Map(results.map((r) => [r.questionId, r.correct] as const));
  const order: string[] = [];
  const acc = new Map<string, DomainScore>();
  for (const question of questions) {
    let score = acc.get(question.domainId);
    if (!score) {
      score = { domainId: question.domainId, correct: 0, total: 0 };
      acc.set(question.domainId, score);
      order.push(question.domainId);
    }
    score.total += 1;
    if (verdicts.get(question.id)) score.correct += 1;
  }
  return order.map((domainId) => acc.get(domainId)!);
}

/**
 * Score one exam run: accuracy, scaled score, pass/fail against
 * `exam.passingScore ?? 700`, and the per-domain breakdown.
 */
export function scoreAttempt(
  exam: Exam,
  questions: Question[],
  answers: Record<string, Answer>,
): ExamScore {
  const base = scoreQuestions(questions, answers);
  const scaledScore = toScaledScore(base.correct, base.total);
  return {
    ...base,
    scaledScore,
    passed: scaledScore >= (exam.passingScore ?? 700),
    perDomain: scoreByDomain(questions, base.results),
  };
}
