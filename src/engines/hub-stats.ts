import { ACHIEVEMENTS } from './achievements';
import { dueCards } from './srs';
import type { Achievement, StreakState, SubjectContent, SubjectUserData } from '../sdk/types';

/**
 * Dashboard aggregation: per-subject and hub-wide progress, derived purely
 * from the persisted store plus the (build-time static) pack totals. Nothing
 * here fetches or mutates — the shell memoizes pack inputs and recomputes on
 * store changes only.
 */

export interface SubjectStats {
  lessonsDone: number;
  lessonsTotal: number;
  labsDone: number;
  labsTotal: number;
  /** Best exam scaled score in percent, or null when none attempted. */
  bestExamPct: number | null;
  quizzesTaken: number;
  dueCount: number;
}

/** Count completed lessons, labs the pack actually ships, and deck dues. */
export function buildSubjectStats(
  content: SubjectContent,
  data: SubjectUserData | undefined,
  now: string,
): SubjectStats {
  const lessons = content.lessons;
  const labs = content.labs;
  return {
    lessonsDone: lessons.filter((lesson) => data?.lessons[lesson.id]?.status === 'completed')
      .length,
    lessonsTotal: lessons.length,
    labsDone: labs.filter((lab) => data?.completedLabs.includes(lab.id)).length,
    labsTotal: labs.length,
    bestExamPct:
      data && data.examAttempts.length > 0
        ? Math.round(Math.max(...data.examAttempts.map((attempt) => attempt.scaledScore)))
        : null,
    quizzesTaken: data?.quizAttempts.length ?? 0,
    dueCount: dueCards(Object.values(data?.srs ?? {}), now).length,
  };
}

export interface HubSubjectOverview {
  subjectId: string;
  stats: SubjectStats;
  /** Deep link back into the last-visited lesson — only when the pack still has it. */
  continueHref: string | undefined;
}

export interface HubOverview {
  subjects: HubSubjectOverview[];
  lessonsDone: number;
  lessonsTotal: number;
  labsDone: number;
  labsTotal: number;
  totalDue: number;
  achievementsEarned: number;
  achievementsTotal: number;
  streakCurrent: number;
  streakLongest: number;
}

export function buildHubOverview(
  packs: { id: string; content: SubjectContent }[],
  subjectsData: Record<string, SubjectUserData>,
  hub: { streak: StreakState; achievements: Achievement[] },
  now: string,
): HubOverview {
  const subjects = packs.map(({ id, content }) => {
    const data = subjectsData[id];
    const lastLesson = data?.lastLessonId
      ? content.lessons.find((lesson) => lesson.id === data.lastLessonId)
      : undefined;
    return {
      subjectId: id,
      stats: buildSubjectStats(content, data, now),
      continueHref: lastLesson
        ? `#/subject/${id}/learn/${lastLesson.slug ?? lastLesson.id}`
        : undefined,
    };
  });

  const sum = (pick: (stats: SubjectStats) => number) =>
    subjects.reduce((total, entry) => total + pick(entry.stats), 0);

  return {
    subjects,
    lessonsDone: sum((stats) => stats.lessonsDone),
    lessonsTotal: sum((stats) => stats.lessonsTotal),
    labsDone: sum((stats) => stats.labsDone),
    labsTotal: sum((stats) => stats.labsTotal),
    totalDue: sum((stats) => stats.dueCount),
    achievementsEarned: hub.achievements.length,
    achievementsTotal: ACHIEVEMENTS.length,
    streakCurrent: hub.streak.current,
    streakLongest: hub.streak.longest,
  };
}
