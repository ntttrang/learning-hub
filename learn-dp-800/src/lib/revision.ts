import type { ExamAttempt } from "./types";
import { getQuestion, getLesson } from "./content";

export interface RevisionItem {
  lessonId: string;
  slug: string;
  title: string;
  reason: string;
  priority: number;
  misses: number;
}

/**
 * Build a prioritized revision plan from exam attempts: lessons whose questions
 * were missed most often float to the top.
 */
export function buildRevisionPlan(attempts: ExamAttempt[], limit = 6): RevisionItem[] {
  const missByLesson = new Map<string, number>();

  for (const a of attempts) {
    for (const r of a.results) {
      if (r.correct) continue;
      const q = getQuestion(r.questionId);
      if (!q?.lessonId) continue;
      missByLesson.set(q.lessonId, (missByLesson.get(q.lessonId) ?? 0) + 1);
    }
  }

  return [...missByLesson.entries()]
    .map(([lessonId, misses]) => {
      const lesson = getLesson(lessonId);
      return lesson
        ? {
            lessonId,
            slug: lesson.slug,
            title: lesson.title,
            misses,
            priority: misses,
            reason: `Missed ${misses} exam question${misses === 1 ? "" : "s"} tied to this lesson.`,
          }
        : null;
    })
    .filter((x): x is RevisionItem => x !== null)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
