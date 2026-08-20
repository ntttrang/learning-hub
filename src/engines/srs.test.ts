import { describe, expect, it } from 'vitest';
import {
  addDays,
  BOX_INTERVALS_DAYS,
  createCard,
  dueCards,
  ingestResults,
  MAX_BOX,
  reviewCard,
} from './srs';

const T0 = '2026-08-01T09:00:00.000Z';
const later = (days: number) => addDays(T0, days);

describe('Leitner box mechanics', () => {
  it('intervals map boxes to days, box 0 = same day', () => {
    expect(BOX_INTERVALS_DAYS).toHaveLength(MAX_BOX + 1);
    expect(BOX_INTERVALS_DAYS[0]).toBe(0);
    expect(BOX_INTERVALS_DAYS[5]).toBe(15);
  });

  it('new cards start in box 1, due immediately', () => {
    const card = createCard('q1', T0);
    expect(card).toMatchObject({ questionId: 'q1', box: 1, due: T0, timesCorrect: 0, timesWrong: 0 });
  });

  it('correct answers promote one box and push the due date out', () => {
    const card = reviewCard(createCard('q1', T0), true, T0);
    expect(card.box).toBe(2);
    expect(card.due).toBe(later(BOX_INTERVALS_DAYS[2]));
    expect(card.timesCorrect).toBe(1);
    expect(card.timesWrong).toBe(0);
  });

  it('wrong answers reset to box 1 with its 1-day interval', () => {
    const card = reviewCard(reviewCard(createCard('q1', T0), true, T0), false, later(1));
    expect(card.box).toBe(1);
    expect(card.due).toBe(later(2)); // reviewed at later(1) + BOX_INTERVALS_DAYS[1] = 1 day
    expect(card.timesWrong).toBe(1);
  });

  it('promotion caps at MAX_BOX', () => {
    let card = createCard('q1', T0);
    for (let i = 0; i < 10; i++) card = reviewCard(card, true, T0);
    expect(card.box).toBe(MAX_BOX);
  });

  it('reviewCard is pure — input card untouched', () => {
    const card = createCard('q1', T0);
    reviewCard(card, true, later(1));
    expect(card.box).toBe(1);
  });
});

describe('dueCards', () => {
  const a = { ...createCard('a', T0), due: later(2) };
  const b = { ...createCard('b', T0), due: later(0) };
  const c = { ...createCard('c', T0), due: later(5) };

  it('returns cards due at or before now, most-overdue first', () => {
    expect(dueCards([a, b, c], later(2)).map((x) => x.questionId)).toEqual(['b', 'a']);
  });

  it('excludes future cards', () => {
    expect(dueCards([c], later(2))).toEqual([]);
  });
});

describe('ingestResults — only-after-first-miss tracking', () => {
  it('correct answers on untracked questions create no card', () => {
    const next = ingestResults({}, [{ questionId: 'q1', correct: true }], T0);
    expect(Object.keys(next)).toEqual([]);
  });

  it('a miss starts tracking immediately at box 1', () => {
    const next = ingestResults({}, [{ questionId: 'q1', correct: false }], T0);
    expect(next['q1']).toMatchObject({ box: 1, timesWrong: 1 });
  });

  it('tracked cards update on later correct answers', () => {
    let deck = ingestResults({}, [{ questionId: 'q1', correct: false }], T0);
    deck = ingestResults(deck, [{ questionId: 'q1', correct: true }], later(1));
    expect(deck['q1']).toMatchObject({ box: 2, timesCorrect: 1, timesWrong: 1 });
  });

  it('does not mutate the input deck', () => {
    const deck = {};
    ingestResults(deck, [{ questionId: 'q1', correct: false }], T0);
    expect(deck).toEqual({});
  });
});
