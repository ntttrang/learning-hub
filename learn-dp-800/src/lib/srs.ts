import type { SrsCard } from "./types";

/**
 * Leitner-style spaced repetition.
 * Boxes 1..5 map to review intervals in days. A correct answer promotes the
 * card one box (longer interval); a wrong answer sends it back to box 1.
 */
export const BOX_INTERVALS_DAYS = [0, 1, 2, 4, 7, 15];
export const MAX_BOX = 5;

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function createCard(questionId: string, now: string): SrsCard {
  return {
    questionId,
    box: 1,
    due: now,
    lastSeen: now,
    timesCorrect: 0,
    timesWrong: 0,
  };
}

/** Update a card after a review. Returns a new card (pure). */
export function reviewCard(card: SrsCard, correct: boolean, now: string): SrsCard {
  const box = correct ? Math.min(MAX_BOX, card.box + 1) : 1;
  return {
    ...card,
    box,
    lastSeen: now,
    due: addDays(now, BOX_INTERVALS_DAYS[box]),
    timesCorrect: card.timesCorrect + (correct ? 1 : 0),
    timesWrong: card.timesWrong + (correct ? 0 : 1),
  };
}

/** Cards that are due for review at `now`, most-overdue first. */
export function dueCards(cards: SrsCard[], now: string): SrsCard[] {
  const t = new Date(now).getTime();
  return cards
    .filter((c) => new Date(c.due).getTime() <= t)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
}

/**
 * Merge a batch of graded results into the SRS deck. Missed questions are
 * always tracked so they resurface; correct ones only update if already tracked.
 */
export function ingestResults(
  cards: Record<string, SrsCard>,
  results: { questionId: string; correct: boolean }[],
  now: string,
): Record<string, SrsCard> {
  const next = { ...cards };
  for (const r of results) {
    const existing = next[r.questionId];
    if (!existing) {
      // Only start tracking a card once it has been missed at least once.
      if (!r.correct) {
        next[r.questionId] = reviewCard(createCard(r.questionId, now), false, now);
      }
      continue;
    }
    next[r.questionId] = reviewCard(existing, r.correct, now);
  }
  return next;
}
