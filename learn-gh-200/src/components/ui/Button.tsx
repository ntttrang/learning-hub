import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  /** Buttons only; a disabled link is not a thing. */
  disabled?: boolean;
}

/**
 * Action button or link styled as one. Pass `href` to render an anchor
 * (keeps hash navigation and middle-click working); otherwise a button.
 */
export function Button({ children, variant = 'primary', href, onClick, type = 'button', disabled }: ButtonProps) {
  const className = `btn btn-${variant}`;
  if (href) {
    return (
      <a className={className} href={href} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
