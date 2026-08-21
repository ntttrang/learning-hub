import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ExamAttempt,
  LessonProgress,
  Note,
  QuizAttempt,
  SubjectUserData,
} from '../sdk/types';
import { adapterAsStateStorage } from './store';
import { ingestResults } from './srs';
import { bumpStreak } from './streak';
import { createLocalStorageAdapter, type StorageAdapter } from './storage';

/**
 * Per-subject persisted user data, namespaced under `subjects[subjectId]` so
 * ids from different packs can never collide. (Actions ported from
 * learn-dp-800/src/lib/store.ts; achievements wait for the Phase 6 roadmap.
 * Theme stays in the Phase 0 hub store — no duplication.)
 *
 * The store is a factory over a StorageAdapter so tests inject a memory
 * adapter and a future cloud adapter swaps in without touching callers.
 */

export const SUBJECT_DATA_STORE_KEY = 'cc-subject-data';
const SUBJECT_DATA_VERSION = 1;

export const emptySubjectData = (): SubjectUserData => ({
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
  srs: {},
  notes: [],
  bookmarks: [],
});

export interface SubjectDataState {
  /** Persisted-shape version — the migration hook for future schema changes. */
  version: number;
  /** Hub-level daily streak, bumped by any subject's activity. */
  streak: { current: number; longest: number; lastActive?: string };
  subjects: Record<string, SubjectUserData>;

  markLesson: (subjectId: string, lessonId: string, status: LessonProgress['status']) => void;
  visitLesson: (subjectId: string, lessonId: string) => void;
  toggleBookmark: (subjectId: string, lessonId: string) => void;
  completeLab: (subjectId: string, labId: string) => void;
  upsertNote: (subjectId: string, note: Note) => void;
  deleteNote: (subjectId: string, id: string) => void;
  recordQuiz: (subjectId: string, attempt: QuizAttempt) => void;
  recordExam: (subjectId: string, attempt: ExamAttempt) => void;
  /**
   * Bulk-merge externally computed data (legacy import). Deliberately free of
   * the record* actions' side effects: no history caps, no streak bumps, no
   * SRS ingestion — imported history must not look like fresh activity.
   */
  importLegacyData: (subjectId: string, partial: Partial<SubjectUserData>) => void;
  resetSubject: (subjectId: string) => void;
}

const now = () => new Date().toISOString();

/** Mutate one subject's slice immutably; every action goes through here. */
function patchSubject(
  state: SubjectDataState,
  subjectId: string,
  patch: (data: SubjectUserData) => SubjectUserData,
): Partial<SubjectDataState> {
  const current = state.subjects[subjectId] ?? emptySubjectData();
  return { subjects: { ...state.subjects, [subjectId]: patch(current) } };
}

export function createSubjectDataStore(adapter: StorageAdapter = createLocalStorageAdapter()) {
  return create<SubjectDataState>()(
    persist(
      (set) => ({
        version: SUBJECT_DATA_VERSION,
        streak: { current: 0, longest: 0 },
        subjects: {},

        markLesson: (subjectId, lessonId, status) =>
          set((s) => ({
            ...patchSubject(s, subjectId, (data) => ({
              ...data,
              lessons: {
                ...data.lessons,
                [lessonId]: { ...data.lessons[lessonId], status, lastVisited: now() },
              },
            })),
            streak: bumpStreak(s.streak, now()),
          })),

        visitLesson: (subjectId, lessonId) =>
          set((s) => ({
            ...patchSubject(s, subjectId, (data) => ({
              ...data,
              lastLessonId: lessonId,
              lessons: {
                ...data.lessons,
                [lessonId]: {
                  ...data.lessons[lessonId],
                  status: data.lessons[lessonId]?.status ?? 'in-progress',
                  lastVisited: now(),
                },
              },
            })),
            streak: bumpStreak(s.streak, now()),
          })),

        toggleBookmark: (subjectId, lessonId) =>
          set((s) =>
            patchSubject(s, subjectId, (data) => ({
              ...data,
              bookmarks: data.bookmarks.includes(lessonId)
                ? data.bookmarks.filter((b) => b !== lessonId)
                : [...data.bookmarks, lessonId],
            })),
          ),

        completeLab: (subjectId, labId) =>
          set((s) => ({
            ...patchSubject(s, subjectId, (data) => ({
              ...data,
              completedLabs: data.completedLabs.includes(labId)
                ? data.completedLabs
                : [...data.completedLabs, labId],
            })),
            streak: bumpStreak(s.streak, now()),
          })),

        upsertNote: (subjectId, note) =>
          set((s) =>
            patchSubject(s, subjectId, (data) => ({
              ...data,
              notes: data.notes.some((n) => n.id === note.id)
                ? data.notes.map((n) => (n.id === note.id ? note : n))
                : [note, ...data.notes],
            })),
          ),

        deleteNote: (subjectId, id) =>
          set((s) =>
            patchSubject(s, subjectId, (data) => ({
              ...data,
              notes: data.notes.filter((n) => n.id !== id),
            })),
          ),

        recordQuiz: (subjectId, attempt) =>
          set((s) => ({
            ...patchSubject(s, subjectId, (data) => ({
              ...data,
              quizAttempts: [attempt, ...data.quizAttempts].slice(0, 200),
              srs: ingestResults(data.srs, attempt.questionResults, now()),
            })),
            streak: bumpStreak(s.streak, now()),
          })),

        recordExam: (subjectId, attempt) =>
          set((s) => ({
            ...patchSubject(s, subjectId, (data) => ({
              ...data,
              examAttempts: [attempt, ...data.examAttempts].slice(0, 50),
              srs: ingestResults(data.srs, attempt.results, now()),
            })),
            streak: bumpStreak(s.streak, now()),
          })),

        importLegacyData: (subjectId, partial) =>
          set((s) =>
            patchSubject(s, subjectId, (data) => ({
              ...data,
              // Per-key skip-if-present: data already in the hub always wins,
              // and deterministic legacy ids make re-runs write nothing.
              // (Spreading an absent partial key is a no-op.)
              lessons: { ...partial.lessons, ...data.lessons },
              completedLabs: [
                ...data.completedLabs,
                ...(partial.completedLabs ?? []).filter((id) => !data.completedLabs.includes(id)),
              ],
              quizAttempts: [
                ...data.quizAttempts,
                ...(partial.quizAttempts ?? []).filter(
                  (attempt) => !data.quizAttempts.some((existing) => existing.id === attempt.id),
                ),
              ],
              examAttempts: [
                ...data.examAttempts,
                ...(partial.examAttempts ?? []).filter(
                  (attempt) => !data.examAttempts.some((existing) => existing.id === attempt.id),
                ),
              ],
              notes: [
                ...data.notes,
                ...(partial.notes ?? []).filter(
                  (note) => !data.notes.some((existing) => existing.id === note.id),
                ),
              ],
              bookmarks: [
                ...data.bookmarks,
                ...(partial.bookmarks ?? []).filter((id) => !data.bookmarks.includes(id)),
              ],
              srs: { ...partial.srs, ...data.srs },
              lastLessonId: data.lastLessonId ?? partial.lastLessonId,
            })),
          ),

        resetSubject: (subjectId) =>
          set((s) => ({
            subjects: { ...s.subjects, [subjectId]: emptySubjectData() },
          })),
      }),
      {
        name: SUBJECT_DATA_STORE_KEY,
        storage: createJSONStorage(() => adapterAsStateStorage(adapter)),
        version: SUBJECT_DATA_VERSION,
        // Guard the rehydrated shape: a missing/corrupt blob or a future
        // version must never crash the app at module-init time.
        merge: (persisted, current) => {
          const p = persisted as Partial<SubjectDataState> | undefined;
          return {
            ...current,
            streak: p?.streak ?? current.streak,
            // Default-fill every entry: an older blob missing an array key
            // would make importLegacyData's spreads throw inside the boot-time
            // effect, and an unset legacy-migration guard would re-crash on
            // every start (engines/migrate-*-progress).
            subjects: Object.fromEntries(
              Object.entries(p?.subjects ?? {}).map(([id, entry]) => [
                id,
                typeof entry === 'object' && entry !== null && !Array.isArray(entry)
                  ? { ...emptySubjectData(), ...entry }
                  : emptySubjectData(),
              ]),
            ),
            version: SUBJECT_DATA_VERSION,
          };
        },
      },
    ),
  );
}

/** The app-wide subject-data store (localStorage, memory fallback). */
export const useSubjectDataStore = createSubjectDataStore();
