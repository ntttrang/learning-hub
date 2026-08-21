import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** Extra class names for variants (e.g. `lesson-lab-link`). */
  className?: string;
  /** Render as an anchor card that navigates to this hash path. */
  href?: string;
}

/** Elevated clay card; with `href` it becomes a clickable link card. */
export function Card({ children, className, href }: CardProps) {
  const classes = className ? `card ${className}` : 'card';
  if (href) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }
  return <div className={classes}>{children}</div>;
}

/** Card header row: leading content plus optional trailing meta. */
export function CardHead({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="card-head">
      {children}
      {meta ? <span className="card-meta">{meta}</span> : null}
    </div>
  );
}

/** Card footer strip, separated by a soft divider. */
export function CardFoot({ children }: { children: ReactNode }) {
  return <div className="card-foot">{children}</div>;
}
