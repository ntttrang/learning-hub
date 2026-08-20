/**
 * One-time progress migration from the retired learn-gh-200 app: its
 * localStorage payload (`gh-site-progress-v1`, hook at useProgress.ts) becomes
 * hub user data under `cc-subject-data`, partitioned to gh-900 / gh-200 by id
 * prefix. One-way and one-shot — the donor stays deployed and untouched.
 *
 * The old payload is not a superset of hub data. What maps cleanly maps
 * (lessons read, labs done, exam attempts incl. their answers); practice
 * aggregates (`practiceStats`) have no hub home and are dropped with one info
 * line. Attempts recorded before the donor stored answers migrate score-only.
 *
 * Payload shape re-verified against learn-gh-200/src/hooks/useProgress.ts and
 * utils/grade.ts at implementation time: `date`/`scaledScore`/`passed` are
 * required fields and `perDomain` carries {correct, total} per domain, so the
 * per-domain breakdown maps instead of being dropped.
 */
import { contentSource, type ContentSource } from '../content/registry';
import type { Answer, ExamAttempt, Question, SubjectContent, SubjectUserData } from '../sdk/types';
import { assemblePaper } from './exam-paper';
import { scoreQuestions } from './scoring';
import {
  createSubjectDataStore,
  emptySubjectData,
  useSubjectDataStore,
} from './subject-store';

/** Donor key (learn-gh-200 useProgress.ts STORAGE_KEY). */
export const LEGACY_PROGRESS_KEY = 'gh-site-progress-v1';
/**
 * Sibling guard key marking the import done. Lives outside `cc-subject-data`
 * on purpose: the persist merge whitelist only rehydrates streak/subjects and
 * would strip an in-store flag on every reload.
 */
export const LEGACY_MIGRATED_KEY = 'cc-gh-progress-migrated';

/* ------------------------------ old-app shapes ----------------------------- */

/** What a learner submitted in the donor, by kind (utils/grade.ts:14). */
type LegacyAnswer = number | number[] | string[];

interface LegacyExamAttempt {
  examId: string;
  date: string;
  scaledScore: number;
  passed: boolean;
  perDomain: Record<string, { correct: number; total: number }>;
  /** Absent on attempts recorded before the donor's phase 6. */
  answers?: Record<string, LegacyAnswer>;
  durationSec?: number;
}

interface LegacyProgress {
  lessonsRead: Record<string, string>;
  labsDone: Record<string, string>;
  practiceStats: Record<string, unknown>;
  examAttempts: unknown[];
}

/** Narrow parsed JSON to the donor shape (its own isValidProgress, loosened
 *  one level: per-attempt validity is judged where attempts are mapped). */
function narrowLegacyProgress(value: unknown): LegacyProgress | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.lessonsRead !== 'object' || v.lessonsRead === null ||
    typeof v.labsDone !== 'object' || v.labsDone === null ||
    typeof v.practiceStats !== 'object' || v.practiceStats === null ||
    !Array.isArray(v.examAttempts)
  ) {
    return null;
  }
  return {
    lessonsRead: v.lessonsRead as Record<string, string>,
    labsDone: v.labsDone as Record<string, string>,
    practiceStats: v.practiceStats as Record<string, unknown>,
    examAttempts: v.examAttempts,
  };
}

function narrowLegacyAttempt(value: unknown): LegacyExamAttempt | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.examId !== 'string' ||
    typeof v.date !== 'string' ||
    typeof v.scaledScore !== 'number' ||
    typeof v.passed !== 'boolean' ||
    typeof v.perDomain !== 'object' || v.perDomain === null
  ) {
    return null;
  }
  return {
    examId: v.examId,
    date: v.date,
    scaledScore: v.scaledScore,
    passed: v.passed,
    perDomain: v.perDomain as LegacyExamAttempt['perDomain'],
    answers:
      typeof v.answers === 'object' && v.answers !== null
        ? (v.answers as Record<string, LegacyAnswer>)
        : undefined,
    durationSec: typeof v.durationSec === 'number' ? v.durationSec : undefined,
  };
}

/* ----------------------------- answer translation ---------------------------- */

/**
 * Donor answer → hub `Answer` (option ids / blank strings). Donor numbers are
 * authored indexes; order answers are a position → authored-index permutation,
 * so both are a pure index→id lookup, never a text match. Returns null for any
 * shape the hub cannot represent — the caller drops that attempt.
 */
function mapAnswer(question: Question, answer: LegacyAnswer): Answer | null {
  const idsFromIndexes = (
    question: { options: { id: string }[] },
    indexes: number[],
  ): Answer | null => {
    const ids: string[] = [];
    for (const index of indexes) {
      const option = question.options[index];
      if (!option) return null;
      ids.push(option.id);
    }
    return ids;
  };

  // An empty array is a real donor submission — a learner who untoggled their
  // last multi option (MultiCard records []). It grades wrong, exactly as the
  // donor graded it; dropping the attempt over it would lose real history.
  const isIndexArray = (value: unknown): value is number[] =>
    Array.isArray(value) &&
    value.every((entry) => typeof entry === 'number' && Number.isInteger(entry));

  switch (question.kind) {
    case 'single':
    case 'codeReading':
      return typeof answer === 'number' && Number.isInteger(answer)
        ? idsFromIndexes(question, [answer])
        : null;
    case 'multi':
    case 'order':
      return isIndexArray(answer) ? idsFromIndexes(question, answer) : null;
    case 'fill':
      return Array.isArray(answer) && answer.every((entry) => typeof entry === 'string')
        ? answer
        : null;
    case 'bug':
      return typeof answer === 'number' && Number.isInteger(answer)
        ? [String(answer)]
        : null;
    default:
      return null;
  }
}

/* ------------------------------- the mapper -------------------------------- */

/**
 * Pure transform of one subject's slice of the old payload. Ids already
 * present in `current` are left alone (hub data wins); unreadable attempts
 * are dropped with one warn; returns null when there is nothing to import.
 */
export function migrateLegacyProgress(
  old: unknown,
  current: SubjectUserData,
  content: SubjectContent,
): Partial<SubjectUserData> | null {
  const legacy = narrowLegacyProgress(old);
  if (!legacy) return null;

  // Subject id 'gh-900' partitions donor ids by the prefix 'gh900-'.
  const prefix = content.subject.id.replace(/-/g, '') + '-';
  const questionsById = new Map(content.questions.map((question) => [question.id, question] as const));
  const domainIds = new Set(content.domains.map((domain) => domain.id));
  const labIds = new Set(content.labs.map((lab) => lab.id));
  let droppedAttempts = 0;

  // lessonsRead is keyed by DOMAIN id; each domain owns exactly one lesson.
  const lessons: SubjectUserData['lessons'] = {};
  for (const [domainId, date] of Object.entries(legacy.lessonsRead)) {
    if (!domainId.startsWith(prefix) || typeof date !== 'string') continue;
    const lesson = content.lessons.find((candidate) => candidate.domainId === domainId);
    if (!lesson || current.lessons[lesson.id]) continue;
    lessons[lesson.id] = { status: 'completed', lastVisited: date };
  }

  const completedLabs: string[] = [];
  for (const labId of Object.keys(legacy.labsDone)) {
    if (!labId.startsWith(prefix) || !labIds.has(labId) || current.completedLabs.includes(labId)) {
      continue;
    }
    completedLabs.push(labId);
  }

  const examAttempts: ExamAttempt[] = [];
  legacy.examAttempts.forEach((raw, index) => {
    const mapped = mapLegacyAttempt(raw, index, content, prefix, questionsById, domainIds, current);
    if (mapped === 'duplicate') return; // already in the hub — silent, not a drop
    if (mapped) examAttempts.push(mapped);
    else if (belongsToSubject(raw, prefix)) droppedAttempts += 1;
  });

  if (droppedAttempts > 0) {
    console.warn(
      `legacy import: dropped ${droppedAttempts} unreadable exam attempt(s) for ${content.subject.id}`,
    );
  }

  if (Object.keys(lessons).length === 0 && completedLabs.length === 0 && examAttempts.length === 0) {
    return null;
  }
  return { lessons, completedLabs, examAttempts };
}

/** True when a raw attempt belongs to this subject but could not be mapped. */
function belongsToSubject(raw: unknown, prefix: string): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const examId = (raw as Record<string, unknown>).examId;
  return typeof examId === 'string' && examId.startsWith(prefix);
}

function mapLegacyAttempt(
  raw: unknown,
  index: number,
  content: SubjectContent,
  prefix: string,
  questionsById: Map<string, Question>,
  domainIds: Set<string>,
  current: SubjectUserData,
): ExamAttempt | 'duplicate' | null {
  const attempt = narrowLegacyAttempt(raw);
  if (!attempt || !attempt.examId.startsWith(prefix)) return null;
  const exam = content.exams.find((candidate) => candidate.id === attempt.examId);
  if (!exam) return null;

  const id = `legacy-${attempt.examId}-${index}`;
  if (current.examAttempts.some((existing) => existing.id === id)) return 'duplicate';

  const perDomain = Object.entries(attempt.perDomain)
    .filter(([domainId, score]) => domainIds.has(domainId) &&
      typeof score?.correct === 'number' && typeof score?.total === 'number')
    .map(([domainId, score]) => ({ domainId, correct: score.correct, total: score.total }));

  let answers: Record<string, Answer> = {};
  let results: ExamAttempt['results'] = [];
  if (attempt.answers) {
    for (const [questionId, answer] of Object.entries(attempt.answers)) {
      const question = questionsById.get(questionId);
      if (!question) return null; // stale id or out-of-range answer: drop the attempt
      const mapped = mapAnswer(question, answer);
      if (mapped === null) return null;
      answers[questionId] = mapped;
    }
    // One bounded grading pass over the deterministic paper, so history (and
    // anything else reading attempt.results) sees real verdicts.
    results = scoreQuestions(assemblePaper(content, exam), answers).results;
  }

  return {
    id,
    examId: attempt.examId,
    date: attempt.date,
    durationSeconds: attempt.durationSec ?? 100 * 60,
    timed: true,
    scaledScore: attempt.scaledScore,
    passed: attempt.passed,
    perDomain,
    answers,
    results,
  };
}

/* -------------------------------- the runner -------------------------------- */

export interface LegacyImportSummary {
  subjects: { subjectId: string; lessons: number; labs: number; exams: number }[];
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Blocked storage: nothing to import from or mark — stay silent.
  }
}

/**
 * Import the legacy payload into every installed subject it belongs to, then
 * mark the import done. Pure orchestration over the mapper above: reads the
 * old key, never the other way around. Returns null whenever it did not run
 * (already migrated, no old key, unreadable payload).
 *
 * Per-pack isolation mirrors the shell's tolerant listing: one pack that fails
 * strict validation is skipped with an error — the import (and the app) must
 * survive the same condition `loadSubjectsTolerant` exists for.
 */
export function importLegacyGhProgress(
  store: ReturnType<typeof createSubjectDataStore> = useSubjectDataStore,
  source: Pick<ContentSource, 'listSubjectIds' | 'loadSubject'> = contentSource,
): LegacyImportSummary | null {
  if (safeGet(LEGACY_MIGRATED_KEY) !== null) return null;

  const raw = safeGet(LEGACY_PROGRESS_KEY);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('legacy import: gh-site-progress-v1 is unreadable JSON — skipped');
    return null;
  }
  const legacy = narrowLegacyProgress(parsed);
  if (!legacy) {
    console.warn('legacy import: gh-site-progress-v1 has an unexpected shape — skipped');
    return null;
  }

  const subjects: LegacyImportSummary['subjects'] = [];
  for (const subjectId of source.listSubjectIds()) {
    let content: SubjectContent;
    try {
      content = source.loadSubject(subjectId);
    } catch (error) {
      console.error(`legacy import: skipping invalid pack ${subjectId}`, error);
      continue;
    }
    const current = store.getState().subjects[subjectId] ?? emptySubjectData();
    const partial = migrateLegacyProgress(legacy, current, content);
    if (!partial) continue;
    store.getState().importLegacyData(subjectId, partial);
    subjects.push({
      subjectId,
      lessons: Object.keys(partial.lessons ?? {}).length,
      labs: (partial.completedLabs ?? []).length,
      exams: (partial.examAttempts ?? []).length,
    });
  }

  // The guard is set only after every merge completed — a failure above
  // leaves the old key retryable on the next start.
  safeSet(LEGACY_MIGRATED_KEY, new Date().toISOString());

  const summary = subjects
    .map(({ subjectId, lessons, labs, exams }) =>
      `${subjectId} (${lessons} lessons, ${labs} labs, ${exams} exam attempts)`)
    .join(', ');
  const droppedStats = Object.keys(legacy.practiceStats).length > 0
    ? ' — practiceStats aggregates have no hub equivalent and were dropped'
    : '';
  console.info(`legacy import: gh-site-progress-v1 → ${summary || 'nothing to import'}${droppedStats}`);
  return { subjects };
}
