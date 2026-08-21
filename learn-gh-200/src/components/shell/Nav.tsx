import { BookOpen, CircleHelp, FlaskConical, Scale, Timer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Section } from '../../router';

interface NavItem {
  section: Section;
  path: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { section: 'learn', path: '/learn', label: 'Learn', icon: BookOpen },
  { section: 'lab', path: '/lab', label: 'Lab', icon: FlaskConical },
  { section: 'practice', path: '/practice', label: 'Practice', icon: CircleHelp },
  { section: 'exams', path: '/exams', label: 'Mock exams', icon: Timer },
  { section: 'compare', path: '/compare', label: 'Compare', icon: Scale },
];

/** Primary nav; highlights the section matching the current route. */
export function Nav({ active }: { active: Section }) {
  return (
    <nav className="nav" aria-label="Primary">
      {ITEMS.map(({ section, path, label, icon: Icon }) => (
        <a
          key={section}
          className={`nav-link${active === section ? ' active' : ''}`}
          href={`#${path}`}
          aria-current={active === section ? 'page' : undefined}
        >
          <Icon size={18} strokeWidth={1.75} aria-hidden />
          {label}
        </a>
      ))}
    </nav>
  );
}
