import type { ExamConfig, Question } from '../content/types';

/**
 * Deterministic exam sampling — pure functions, no DOM, no component imports.
 *
 * The same exam config (seed + domainPlan) over the same bank always yields
 * the same questions in the same order, so golden tests can pin the exact
 * ids and every learner sitting the same mock sees the same paper.
 */

/** mulberry32: a tiny, fast, well-distributed seeded PRNG returning [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates over a copy, drawing every swap index from the given PRNG. */
export function shuffleWith<T>(rng: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * The question ids an exam draws, in serving order.
 *
 * Domains are visited in domainPlan order; each domain's pool is shuffled
 * with a PRNG seeded from the exam seed and the first `count` ids taken.
 * The combined picks get one final seeded shuffle so the served paper mixes
 * domains like the real exam instead of running domain by domain.
 * `excludeIds` drops ids already drawn by another exam — that is how a
 * mock B never re-serves its cert's mock A questions.
 */
export function sampleIds(
  exam: ExamConfig,
  questions: Question[],
  excludeIds: ReadonlySet<string> = new Set(),
): string[] {
  const rng = mulberry32(exam.seed);
  const picked: string[] = [];
  for (const [domainId, count] of Object.entries(exam.domainPlan)) {
    const pool = questions.filter(
      (question) => question.domainId === domainId && !excludeIds.has(question.id),
    );
    if (pool.length < count) {
      throw new Error(
        `${exam.id}: domain ${domainId} needs ${count} questions but only ${pool.length} are available`,
      );
    }
    picked.push(...shuffleWith(rng, pool).slice(0, count).map((question) => question.id));
  }
  return shuffleWith(mulberry32(exam.seed ^ 0x5bd1e995), picked);
}

/** The sampled questions themselves, in the order `sampleIds` serves them. */
export function sampleExam(
  exam: ExamConfig,
  questions: Question[],
  excludeIds: ReadonlySet<string> = new Set(),
): Question[] {
  const ids = sampleIds(exam, questions, excludeIds);
  const byId = new Map(questions.map((question) => [question.id, question] as const));
  return ids.map((id) => byId.get(id)!);
}
