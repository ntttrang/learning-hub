import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  /** Optional extra content under the message (e.g. a call to action). */
  children?: ReactNode;
}

/** Centered "nothing here yet" panel with real copy, never lorem ipsum. */
export function EmptyState({ icon: Icon, title, message, children }: EmptyStateProps) {
  return (
    <div className="empty-state enter">
      <span className="empty-state-icon">
        <Icon size={36} strokeWidth={1.75} aria-hidden />
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {children}
    </div>
  );
}
