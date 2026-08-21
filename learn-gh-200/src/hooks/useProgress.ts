import { useCallback, useState } from 'react';
import type { QuestionAnswer } from '../utils/grade';

/**
 * Learner progress, persisted to a single localStorage key.
 *
 * Shape is versioned so later phases can migrate instead of guessing. All
 * access is guarded: corrupt JSON resets to empty progress, and unavailable
 * storage degrades to an in-memory session (the site still works, progress
 * just doesn't survive a reload).
 */

const STORAGE_KEY = 'gh-site-progress-v1';

export interface PracticeStat {
  seen: number;
  correct: number;
}

/** Per-domain breakdown recorded with each exam attempt. */
export interface ExamDomainResult {
  correct: number;
  total: number;
}

export interface ExamAttempt {
  examId: string;
  date: string; // ISO timestamp
  scaledScore: number;
  passed: boolean;
  perDomain: Record<string, ExamDomainResult>;
  /**
   * The submitted answers keyed by question id, kept so the review screen
   * can replay the exact paper (sampling is seeded, so ids never drift).
   * Optional: attempts written before phase 6 lack it.
   */
  answers?: Record<string, QuestionAnswer>;
  /** Wall-clock time spent on the attempt, in seconds, capped at duration. */
  durationSec?: number;
}

export interface ProgressState {
  version: 1;
  /** domainId -> ISO date its lesson was read */
  lessonsRead: Record<string, string>;
  /** labId -> ISO date completed */
  labsDone: Record<string, string>;
  /** domainId -> running tally */
  practiceStats: Record<string, PracticeStat>;
  examAttempts: ExamAttempt[];
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  lessonsRead: {},
  labsDone: {},
  practiceStats: {},
  examAttempts: [],
};

/** Narrow unknown parsed JSON down to a ProgressState we can trust. */
function isValidProgress(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    typeof v.lessonsRead === 'object' && v.lessonsRead !== null &&
    typeof v.labsDone === 'object' && v.labsDone !== null &&
    typeof v.practiceStats === 'object' && v.practiceStats !== null &&
    Array.isArray(v.examAttempts)
  );
}

function loadProgress(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return EMPTY_PROGRESS;
    const parsed: unknown = JSON.parse(raw);
    return isValidProgress(parsed) ? parsed : EMPTY_PROGRESS;
  } catch {
    // Unreadable JSON or blocked storage — start clean.
    return EMPTY_PROGRESS;
  }
}

function saveProgress(state: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable or full — keep the in-memory state going.
  }
}

/** Copy one level deep: the nested collections plus the attempt array. */
function cloneProgress(state: ProgressState): ProgressState {
  return {
    ...state,
    lessonsRead: { ...state.lessonsRead },
    labsDone: { ...state.labsDone },
    practiceStats: { ...state.practiceStats },
    examAttempts: [...state.examAttempts],
  };
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(loadProgress);

  const update = useCallback((mutate: (draft: ProgressState) => void) => {
    setState((prev) => {
      const next = cloneProgress(prev);
      mutate(next);
      saveProgress(next);
      return next;
    });
  }, []);

  const markLessonRead = useCallback(
    (domainId: string) => {
      update((draft) => {
        draft.lessonsRead[domainId] = new Date().toISOString();
      });
    },
    [update],
  );

  const markLabDone = useCallback(
    (labId: string) => {
      update((draft) => {
        draft.labsDone[labId] = new Date().toISOString();
      });
    },
    [update],
  );

  const recordPractice = useCallback(
    (domainId: string, correct: boolean) => {
      update((draft) => {
        const stat = draft.practiceStats[domainId] ?? { seen: 0, correct: 0 };
        draft.practiceStats[domainId] = {
          seen: stat.seen + 1,
          correct: stat.correct + (correct ? 1 : 0),
        };
      });
    },
    [update],
  );

  const recordExamAttempt = useCallback(
    (attempt: ExamAttempt) => {
      update((draft) => {
        draft.examAttempts.push(attempt);
      });
    },
    [update],
  );

  return { progress: state, markLessonRead, markLabDone, recordPractice, recordExamAttempt };
}
