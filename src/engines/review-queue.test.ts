import { describe, expect, it } from 'vitest';
import { buildReviewQueue, countDueCards, REVIEW_QUEUE_CAP } from './review-queue';
import type { SrsCard, SubjectUserData } from '../sdk/types';

const NOW = '2026-08-21T12:00:00.000Z';

const card = (questionId: string, dueInDays: number): SrsCard => ({
  questionId,
  box: 2,
  due: new Date(Date.parse(NOW) - dueInDays * 86_400_000).toISOString(),
  lastSeen: '2026-08-01T00:00:00.000Z',
  timesCorrect: 1,
  timesWrong: 0,
});

const deck = (cards: SrsCard[]): SubjectUserData => ({
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
  srs: Object.fromEntries(cards.map((c) => [c.questionId, c])),
  notes: [],
  bookmarks: [],
});

const alwaysResolvable = () => true;

describe('buildReviewQueue', () => {
  it('returns nothing when no deck has due cards', () => {
    const subjects = { fx: deck([card('q1', -3)]) }; // due in the future
    expect(buildReviewQueue(subjects, alwaysResolvable, NOW)).toEqual([]);
    expect(countDueCards(subjects, NOW)).toBe(0);
  });

  it('interleaves subjects round-robin instead of draining one deck', () => {
    const subjects = {
      'gh-200': deck([card('g1', 5), card('g2', 4), card('g3', 3)]),
      'dp-800': deck([card('d1', 9), card('d2', 8)]),
    };
    const queue = buildReviewQueue(subjects, alwaysResolvable, NOW);
    expect(queue.map((item) => item.questionId)).toEqual([
      'd1', // dp-800 sorts before gh-200 and both start with their most overdue
      'g1',
      'd2',
      'g2',
      'g3',
    ]);
    // Every subject id in the queue carries its deck's id.
    expect(queue.filter((i) => i.subjectId === 'dp-800')).toHaveLength(2);
    expect(queue.filter((i) => i.subjectId === 'gh-200')).toHaveLength(3);
  });

  it('caps the session and keeps order stable inside a subject', () => {
    const subjects = {
      fx: deck(Array.from({ length: 30 }, (_, i) => card(`q${i + 1}`, 30 - i))),
    };
    const queue = buildReviewQueue(subjects, alwaysResolvable, NOW, 5);
    expect(queue).toHaveLength(5);
    // Most overdue first: q1 has the oldest due date.
    expect(queue.map((i) => i.questionId)).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
    expect(REVIEW_QUEUE_CAP).toBeGreaterThan(0);
  });

  it('drops orphan ids the pack can no longer resolve', () => {
    const subjects = { fx: deck([card('exists', 2), card('gone', 3)]) };
    const queue = buildReviewQueue(
      subjects,
      (subjectId, questionId) => subjectId === 'fx' && questionId !== 'gone',
      NOW,
    );
    expect(queue.map((i) => i.questionId)).toEqual(['exists']);
    // The badge count is deck-level and still sees both — documented gap
    // between raw count and the resolvable queue.
    expect(countDueCards(subjects, NOW)).toBe(2);
  });

  it('handles subjects with empty or absent decks', () => {
    const subjects = {
      empty: deck([]),
      future: deck([card('later', -1)]),
      live: deck([card('now', 1)]),
    };
    expect(buildReviewQueue(subjects, alwaysResolvable, NOW).map((i) => i.questionId)).toEqual([
      'now',
    ]);
  });
});
