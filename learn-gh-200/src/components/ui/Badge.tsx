import type { ReactNode } from 'react';

export type BadgeTone = 'gh900' | 'gh200' | 'neutral';

/** Small uppercase tag. GH-900 reads cyan, GH-200 reads orange. */
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/** Neutral outlined mini-tag for metadata like durations. */
export function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}
