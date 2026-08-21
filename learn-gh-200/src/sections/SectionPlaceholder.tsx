import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

interface SectionPlaceholderProps {
  icon: LucideIcon;
  caption: string;
  title: string;
  /** Honest copy about what will live here and when it lands. */
  message: string;
}

/**
 * Section landing page for phase 1, while the content registries are empty.
 * The copy names what the section will contain rather than pretending.
 */
export function SectionPlaceholder({ icon, caption, title, message }: SectionPlaceholderProps) {
  return (
    <section className="enter">
      <div className="section-head">
        <span className="caption">{caption}</span>
        <h1>{title}</h1>
      </div>
      <EmptyState icon={icon} title="Content is on the way" message={message} />
    </section>
  );
}
