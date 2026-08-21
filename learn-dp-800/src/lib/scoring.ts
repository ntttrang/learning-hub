import type { Question } from "./types";

/** Compare two id arrays as sets (order-insensitive). */
export function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((x) => sa.has(x));
}

/** Compare two id arrays as ordered sequences. */
export function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x === b[i]);
}

/** Normalize a sqlFill blank: trim, collapse space, strip wrapping [], case-fold. */
export function normalizeSqlBlank(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/^\[|\]$/g, "").toUpperCase();
}

/**
 * Grade a single question given the learner's response.
 * - single/codeReading/debugging: exact set match (usually one option)
 * - multi: exact set match of all correct options
 * - ordering: exact ordered match
 * - matching: response is the chosen "right" value per left index, encoded as
 *   `${leftIndex}::${right}` tokens; correct when every pair matches.
 * - sqlFill: ordered blanks vs `correct` tokens, plus optional `blankAliases`.
 */
export function gradeQuestion(question: Question, response: string[]): boolean {
  if (!response || response.length === 0) return false;

  switch (question.type) {
    case "single":
    case "codeReading":
    case "debugging":
    case "multi":
      return sameSet(response, question.correct ?? []);
    case "ordering":
      return sameOrder(response, question.correct ?? []);
    case "matching": {
      const pairs = question.pairs ?? [];
      if (response.length !== pairs.length) return false;
      const expected = new Set(pairs.map((p, i) => `${i}::${p.right}`));
      return response.every((token) => expected.has(token));
    }
    case "sqlFill": {
      const expected = question.correct ?? [];
      if (response.length !== expected.length) return false;
      return expected.every((canonical, i) => {
        const got = normalizeSqlBlank(response[i] ?? "");
        if (!got) return false;
        const allowed = [canonical, ...(question.blankAliases?.[i] ?? [])].map(normalizeSqlBlank);
        return allowed.includes(got);
      });
    }
    default:
      return false;
  }
}

export interface ScoredResult {
  total: number;
  correct: number;
  accuracy: number; // 0..1
  results: { questionId: string; correct: boolean }[];
}

/** Grade a set of questions against a map of responses. */
export function scoreQuestions(
  questions: Question[],
  answers: Record<string, string[]>,
): ScoredResult {
  const results = questions.map((q) => ({
    questionId: q.id,
    correct: gradeQuestion(q, answers[q.id] ?? []),
  }));
  const correct = results.filter((r) => r.correct).length;
  const total = questions.length;
  return {
    total,
    correct,
    accuracy: total === 0 ? 0 : correct / total,
    results,
  };
}

/**
 * Convert a raw accuracy to Microsoft's scaled score band (out of 1000).
 * The real exam uses an undisclosed scaling; we approximate linearly with a
 * floor so that 0 correct maps to a low non-zero score, matching the passing
 * threshold of 700. This is clearly an approximation, not an official formula.
 */
export function toScaledScore(accuracy: number): number {
  const scaled = Math.round(100 + accuracy * 900);
  return Math.max(0, Math.min(1000, scaled));
}

/** Group results by domain for the score-by-domain report. */
export function scoreByDomain(
  questions: Question[],
  results: { questionId: string; correct: boolean }[],
): { domainId: string; correct: number; total: number }[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const map = new Map<string, { correct: number; total: number }>();
  for (const r of results) {
    const q = byId.get(r.questionId);
    if (!q) continue;
    const entry = map.get(q.domainId) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (r.correct) entry.correct += 1;
    map.set(q.domainId, entry);
  }
  return [...map.entries()].map(([domainId, v]) => ({ domainId, ...v }));
}
