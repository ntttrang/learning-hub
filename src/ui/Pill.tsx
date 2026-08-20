import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type PillTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger';

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  /** Optional leading icon slot. */
  icon?: LucideIcon;
}

/** Compact status/label chip. Tinted surface, never body-text contrast. */
export function Pill({ children, tone = 'neutral', icon: Icon }: PillProps) {
  return (
    <span className={`pill pill-${tone}`}>
      {Icon && <Icon size={13} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </span>
  );
}
