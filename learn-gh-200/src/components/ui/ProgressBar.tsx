interface ProgressBarProps {
  /** Completion fraction from 0 to 1. */
  value: number;
}

/** Slim rounded progress track; turns green at 100%. */
export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <div
        className={`progress-fill${clamped >= 1 ? ' complete' : ''}`}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
