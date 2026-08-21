import { Star } from 'lucide-react';
import { InlineText } from './InlineText';

interface CalloutProps {
  /** Prose rendered through the inline tokenizer. */
  text: string;
  /** Optional label; defaults to the captain's "Tip". */
  label?: string;
}

/**
 * Tip callout — the yellow-star moment of a lesson. Warm tinted surface,
 * star-yellow rail on the left, one per idea.
 */
export function Callout({ text, label = 'Tip' }: CalloutProps) {
  return (
    <aside className="callout">
      <span className="callout-label">
        <Star size={16} strokeWidth={2} aria-hidden />
        {label}
      </span>
      <p>
        <InlineText text={text} />
      </p>
    </aside>
  );
}
