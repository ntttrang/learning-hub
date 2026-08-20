import { describe, expect, it } from 'vitest';
import { bumpStreak, dayKey, daysBetween } from './streak';

const day = (n: number) => {
  const d = new Date(2026, 7, n, 10, 0, 0); // August 2026, local time
  return d.toISOString();
};

describe('calendar-day helpers', () => {
  it('dayKey groups by local calendar date, not instant', () => {
    const lateNight = new Date(2026, 7, 5, 23, 59).toISOString();
    const earlyMorning = new Date(2026, 7, 6, 0, 1).toISOString();
    expect(dayKey(lateNight)).not.toBe(dayKey(earlyMorning));
    expect(dayKey(lateNight)).toBe(dayKey(new Date(2026, 7, 5, 6, 0).toISOString()));
  });

  it('daysBetween counts calendar days across a month boundary', () => {
    const jul31 = new Date(2026, 6, 31, 9).toISOString();
    const aug1 = new Date(2026, 7, 1, 22).toISOString();
    expect(daysBetween(jul31, aug1)).toBe(1);
  });

  it('daysBetween is zero on the same day regardless of time', () => {
    expect(daysBetween(day(3), day(3))).toBe(0);
  });
});

describe('bumpStreak', () => {
  it('first activity starts a streak of 1', () => {
    expect(bumpStreak({ current: 0, longest: 0 }, day(1))).toEqual({
      current: 1,
      longest: 1,
      lastActive: day(1),
    });
  });

  it('consecutive day increments current and updates longest', () => {
    const first = bumpStreak({ current: 0, longest: 0 }, day(1));
    const second = bumpStreak(first, day(2));
    expect(second).toMatchObject({ current: 2, longest: 2 });
    const third = bumpStreak(second, day(3));
    expect(third).toMatchObject({ current: 3, longest: 3 });
  });

  it('same-day activity refreshes the timestamp without double counting', () => {
    const first = bumpStreak({ current: 0, longest: 0 }, day(1));
    const again = bumpStreak(first, day(1));
    expect(again.current).toBe(1);
    expect(again.lastActive).toBe(day(1));
  });

  it('a gap resets current to 1 but keeps longest', () => {
    const streak = { current: 4, longest: 6, lastActive: day(1) };
    const afterGap = bumpStreak(streak, day(5));
    expect(afterGap).toMatchObject({ current: 1, longest: 6 });
  });
});
