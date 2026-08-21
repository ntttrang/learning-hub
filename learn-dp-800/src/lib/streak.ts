/** Daily learning streak helpers. Dates are compared by calendar day (local). */

export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso);
  const b = new Date(bIso);
  const au = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bu = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bu - au) / 86400000);
}

export interface StreakState {
  current: number;
  longest: number;
  lastActive?: string;
}

/** Register activity on `now`, returning the updated streak state. */
export function bumpStreak(state: StreakState, now: string): StreakState {
  if (!state.lastActive) {
    return { current: 1, longest: Math.max(1, state.longest), lastActive: now };
  }
  const diff = daysBetween(state.lastActive, now);
  if (diff <= 0) {
    // same day — no change to counters, refresh timestamp
    return { ...state, lastActive: now };
  }
  const current = diff === 1 ? state.current + 1 : 1;
  return {
    current,
    longest: Math.max(state.longest, current),
    lastActive: now,
  };
}
