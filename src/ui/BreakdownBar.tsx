import { ProgressBar } from './ProgressBar';

interface BreakdownBarProps {
  label: string;
  /** Context line under/next to the label — official weight, question count, … */
  caption?: string;
  correct: number;
  total: number;
}

/** One scored domain row: label, caption, correct/total, and the bar itself. */
export function BreakdownBar({ label, caption, correct, total }: BreakdownBarProps) {
  return (
    <div className="breakdown">
      <div className="breakdown-head">
        <span className="breakdown-label">{label}</span>
        {caption && <span className="breakdown-caption">{caption}</span>}
        <span className="breakdown-count">
          {correct}/{total}
        </span>
      </div>
      <ProgressBar
        value={total === 0 ? 0 : correct / total}
        label={`${label}: ${correct} of ${total} correct`}
      />
    </div>
  );
}
