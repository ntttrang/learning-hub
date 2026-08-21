import type { Achievement, StreakState, SubjectUserData } from '../sdk/types';

/**
 * Hub-level achievements: subject-agnostic badges generalized from
 * learn-dp-800's per-app model. Definitions are pure predicates over the
 * persisted user data — no content lookups — so the store can award them
 * without owning packs. Donor's two content-dependent entries (finish Domain 1,
 * a lab in every domain) became volume thresholds for the same reason.
 */

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  earned: (snapshot: AchievementSnapshot) => boolean;
}

/** Everything a predicate may look at — a subset of the subject-data store. */
export interface AchievementSnapshot {
  streak: Pick<StreakState, 'current' | 'longest'>;
  subjects: Record<string, Pick<SubjectUserData, 'lessons' | 'completedLabs' | 'quizAttempts' | 'examAttempts'>>;
}

const completedLessons = ({ subjects }: AchievementSnapshot): number =>
  Object.values(subjects).reduce(
    (sum, data) => sum + Object.values(data.lessons).filter((l) => l.status === 'completed').length,
    0,
  );

const completedLabs = ({ subjects }: AchievementSnapshot): number =>
  Object.values(subjects).reduce((sum, data) => sum + data.completedLabs.length, 0);

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-lesson',
    title: 'Cast off',
    description: 'Complete your first lesson.',
    earned: (s) => completedLessons(s) >= 1,
  },
  {
    id: 'ten-lessons',
    title: 'Making way',
    description: 'Complete 10 lessons.',
    earned: (s) => completedLessons(s) >= 10,
  },
  {
    id: 'fifty-lessons',
    title: 'Fair winds',
    description: 'Complete 50 lessons.',
    earned: (s) => completedLessons(s) >= 50,
  },
  {
    id: 'first-lab',
    title: 'Hands on deck',
    description: 'Complete your first hands-on lab.',
    earned: (s) => completedLabs(s) >= 1,
  },
  {
    id: 'lab-ten',
    title: 'Deckhand',
    description: 'Complete 10 hands-on labs.',
    earned: (s) => completedLabs(s) >= 10,
  },
  {
    id: 'quiz-ace',
    title: 'Sharp shooter',
    description: 'Score 100% on any knowledge check.',
    earned: ({ subjects }) =>
      Object.values(subjects).some((data) =>
        data.quizAttempts.some((a) => a.total > 0 && a.correct === a.total),
      ),
  },
  {
    id: 'mock-pass',
    title: 'Dry run',
    description: 'Pass a full mock exam.',
    earned: ({ subjects }) =>
      Object.values(subjects).some((data) => data.examAttempts.some((a) => a.passed)),
  },
  {
    id: 'streak-7',
    title: 'Steady sailing',
    description: 'Reach a 7-day learning streak.',
    earned: ({ streak }) => streak.current >= 7 || streak.longest >= 7,
  },
];

/**
 * Newly earned achievements for a snapshot, skipping ids already awarded.
 * Pure: callers pass `now` so award times stay deterministic in tests.
 */
export function evaluateAchievements(
  snapshot: AchievementSnapshot,
  earnedIds: readonly string[],
  now: string,
): Achievement[] {
  const already = new Set(earnedIds);
  return ACHIEVEMENTS.filter((def) => !already.has(def.id) && def.earned(snapshot)).map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    earnedAt: now,
  }));
}
