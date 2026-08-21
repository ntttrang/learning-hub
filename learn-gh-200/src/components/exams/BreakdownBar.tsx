import { ProgressBar } from '../ui/ProgressBar';

interface BreakdownBarProps {
  /** Domain title. */
  label: string;
  /** Meta line: official weight range, question count. */
  caption: string;
  correct: number;
  total: number;
}

/** One domain's score row for the review screen's per-domain breakdown. */
export function BreakdownBar({ label, caption, correct, total }: BreakdownBarProps) {
  return (
    <div className="exam-domain">
      <div className="exam-domain-head">
        <span className="exam-domain-label">{label}</span>
        <span className="small">{caption}</span>
        <span className="exam-domain-score">
          {correct}/{total}
        </span>
      </div>
      <ProgressBar value={total === 0 ? 0 : correct / total} />
    </div>
  );
}
