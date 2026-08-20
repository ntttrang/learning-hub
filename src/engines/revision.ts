import type { ExamAttempt, SubjectContent } from '../sdk/types';

/**
 * Revision planning from exam attempts. (Ported from
 * learn-dp-800/src/lib/revision.ts; the per-app content lookups became an
 * explicit `SubjectContent` parameter.)
 */

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
export function buildRevisionPlan(
  content: SubjectContent,
  attempts: ExamAttempt[],
  limit = 6,
): RevisionItem[] {
  const missByLesson = new Map<string, number>();
  const questionById = new Map(content.questions.map((q) => [q.id, q]));
  const lessonById = new Map(content.lessons.map((l) => [l.id, l]));

  for (const a of attempts) {
    for (const r of a.results) {
      if (r.correct) continue;
      const q = questionById.get(r.questionId);
      if (!q?.lessonId) continue;
      missByLesson.set(q.lessonId, (missByLesson.get(q.lessonId) ?? 0) + 1);
    }
  }

  return [...missByLesson.entries()]
    .map(([lessonId, misses]) => {
      const lesson = lessonById.get(lessonId);
      return lesson
        ? {
            lessonId,
            slug: lesson.slug ?? lesson.id,
            title: lesson.title,
            misses,
            priority: misses,
            reason: `Missed ${misses} exam question${misses === 1 ? '' : 's'} tied to this lesson.`,
          }
        : null;
    })
    .filter((x): x is RevisionItem => x !== null)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
