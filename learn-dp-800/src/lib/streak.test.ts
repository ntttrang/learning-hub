import { describe, it, expect } from "vitest";
import { bumpStreak, daysBetween, type StreakState } from "./streak";

const start: StreakState = { current: 0, longest: 0 };

// Build ISO strings from LOCAL calendar dates so the tests are timezone-agnostic
// (daysBetween/bumpStreak intentionally compare by local calendar day).
const localDay = (y: number, m: number, d: number, h = 10) =>
  new Date(y, m - 1, d, h, 0, 0).toISOString();

describe("daysBetween", () => {
  it("computes calendar-day difference", () => {
    expect(daysBetween(localDay(2026, 7, 28, 23), localDay(2026, 7, 29, 1))).toBe(1);
    expect(daysBetween(localDay(2026, 7, 28, 0), localDay(2026, 7, 28, 23))).toBe(0);
  });
});

describe("bumpStreak", () => {
  it("starts at 1 on first activity", () => {
    const s = bumpStreak(start, localDay(2026, 7, 28));
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
  });
  it("does not increment twice in the same day", () => {
    let s = bumpStreak(start, localDay(2026, 7, 28, 10));
    s = bumpStreak(s, localDay(2026, 7, 28, 18));
    expect(s.current).toBe(1);
  });
  it("increments on consecutive days", () => {
    let s = bumpStreak(start, localDay(2026, 7, 28));
    s = bumpStreak(s, localDay(2026, 7, 29));
    s = bumpStreak(s, localDay(2026, 7, 30));
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });
  it("resets after a gap but keeps longest", () => {
    let s = bumpStreak(start, localDay(2026, 7, 28));
    s = bumpStreak(s, localDay(2026, 7, 29));
    s = bumpStreak(s, localDay(2026, 8, 5));
    expect(s.current).toBe(1);
    expect(s.longest).toBe(2);
  });
});
