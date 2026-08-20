import type { Answer } from '../sdk/types';
import { createLocalStorageAdapter, type StorageAdapter } from './storage';

/**
 * The one in-flight exam sitting, persisted under its own storage key so an
 * accidental reload resumes exactly where the learner left off. One sitting
 * globally (any subject) is intentional: one learner, one sitting at a time.
 *
 * Timestamps are wall-clock epoch ms; when the sitting is timed, `deadline` is
 * the single source of time truth — the sitting component only re-renders off
 * it, so tab throttling can never extend an exam.
 */
export const EXAM_INFLIGHT_KEY = 'cc-exam-inflight';

export interface InflightSitting {
  subjectId: string;
  examId: string;
  timed: boolean;
  /** Sitting start, epoch ms. */
  startedAt: number;
  /** Submission deadline, epoch ms — required when timed, absent otherwise. */
  deadline?: number;
  answers: Record<string, Answer>;
  /** Question ids the learner flagged for review. */
  flags: string[];
}

/** The adapter in-flight sittings persist through (localStorage, memory fallback). */
export const inflightStorage: StorageAdapter = createLocalStorageAdapter();

function isAnswerMap(value: unknown): value is Record<string, Answer> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every(
    (entry) => Array.isArray(entry) && entry.every((item) => typeof item === 'string'),
  );
}

/**
 * Load the stored sitting, or null when nothing — or nothing usable — is
 * there. Strict shape check: `typeof null === 'object'` and `typeof NaN ===
 * 'number'`, so a hand-edited or half-written record must fail here and
 * restart at the intro, never reach the sitting where a null answers map or a
 * NaN clock would crash.
 */
export function loadInflight(adapter: StorageAdapter = inflightStorage): InflightSitting | null {
  const raw = adapter.getItem(EXAM_INFLIGHT_KEY);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const value = parsed as Record<string, unknown>;

  if (
    typeof value.subjectId !== 'string' ||
    typeof value.examId !== 'string' ||
    typeof value.timed !== 'boolean' ||
    typeof value.startedAt !== 'number' ||
    !Number.isFinite(value.startedAt) ||
    !isAnswerMap(value.answers) ||
    !Array.isArray(value.flags) ||
    !value.flags.every((flag) => typeof flag === 'string')
  ) {
    return null;
  }

  // A timed sitting without a usable deadline is semantically broken: drop it
  // instead of resuming into a sitting that can never expire.
  if (value.timed && (typeof value.deadline !== 'number' || !Number.isFinite(value.deadline))) {
    return null;
  }

  return {
    subjectId: value.subjectId,
    examId: value.examId,
    timed: value.timed,
    startedAt: value.startedAt,
    deadline: value.timed ? (value.deadline as number) : undefined,
    answers: value.answers,
    flags: value.flags as string[],
  };
}

/** Persist the sitting; an unavailable store leaves it working, just not resumable. */
export function saveInflight(
  sitting: InflightSitting,
  adapter: StorageAdapter = inflightStorage,
): void {
  adapter.setItem(
    EXAM_INFLIGHT_KEY,
    JSON.stringify({
      ...sitting,
      deadline: sitting.timed ? sitting.deadline : undefined,
    }),
  );
}

/** Clear the stored sitting — after a submit, or when discarding a foreign one. */
export function clearInflight(adapter: StorageAdapter = inflightStorage): void {
  adapter.removeItem(EXAM_INFLIGHT_KEY);
}
