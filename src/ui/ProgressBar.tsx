interface ProgressBarProps {
  /** Completion fraction from 0 to 1. */
  value: number;
  /** Accessible label announced by the progressbar role. */
  label: string;
}

/** Slim rounded progress track; brand-filled, complete at 100%. */
export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <div className="progress-fill" style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}
