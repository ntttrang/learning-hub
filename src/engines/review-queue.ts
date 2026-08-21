import { dueCards } from './srs';
import type { SubjectUserData } from '../sdk/types';

/**
 * Cross-subject SRS review queue: due cards from every subject deck,
 * interleaved so no subject monopolizes the session. Pure data in, queue out —
 * the shell resolves questions through each pack and records results back
 * through the per-subject store actions.
 */

export interface ReviewQueueItem {
  subjectId: string;
  questionId: string;
  due: string;
}

/** Default session size — enough to matter, short enough to finish. */
export const REVIEW_QUEUE_CAP = 20;

/**
 * Build the queue: most-overdue first inside each subject, then round-robin
 * across subjects (sorted by id for stability), capped. `hasQuestion` drops
 * orphan ids — cards whose question no longer exists in the pack — so a stale
 * deck entry can never crash or pad a session.
 */
export function buildReviewQueue(
  subjects: Record<string, SubjectUserData>,
  hasQuestion: (subjectId: string, questionId: string) => boolean,
  now: string,
  cap: number = REVIEW_QUEUE_CAP,
): ReviewQueueItem[] {
  const heads = Object.keys(subjects)
    .sort()
    .map((subjectId) =>
      dueCards(Object.values(subjects[subjectId].srs ?? {}), now)
        .filter((card) => hasQuestion(subjectId, card.questionId))
        .map((card) => ({ subjectId, questionId: card.questionId, due: card.due })),
    );

  const queue: ReviewQueueItem[] = [];
  let open = heads.filter((head) => head.length > 0);
  while (queue.length < cap && open.length > 0) {
    for (const head of open) {
      if (queue.length >= cap) break;
      queue.push(head.shift()!);
    }
    open = open.filter((head) => head.length > 0);
  }
  return queue;
}

/** Total due cards across decks (badge count) — deck-level, no pack lookups. */
export function countDueCards(subjects: Record<string, SubjectUserData>, now: string): number {
  return Object.values(subjects).reduce(
    (sum, data) => sum + dueCards(Object.values(data.srs ?? {}), now).length,
    0,
  );
}
