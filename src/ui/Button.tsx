import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  /** Optional leading icon slot. */
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  /** Buttons only; a disabled link is not a thing. */
  disabled?: boolean;
  /** Buttons only; focus on mount (dialog safe-action pattern). */
  autoFocus?: boolean;
}

/**
 * Action button or link styled as one, ported from the gh-200 donor. Pass
 * `href` to render an anchor (keeps hash navigation and middle-click
 * working); otherwise a button.
 */
export function Button({
  children,
  variant = 'primary',
  icon: Icon,
  href,
  onClick,
  type = 'button',
  disabled,
  autoFocus,
}: ButtonProps) {
  const className = `btn btn-${variant}`;
  const inner = (
    <>
      {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </>
  );
  if (href) {
    return (
      <a className={className} href={href} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button className={className} type={type} onClick={onClick} disabled={disabled} autoFocus={autoFocus}>
      {inner}
    </button>
  );
}
