import type { ReactNode } from "react";
import type { SourceKind, DifficultyTier } from "@/lib/types";

const SOURCE_META: Record<SourceKind, { label: string; color: string; fg: string }> = {
  official: { label: "Official Microsoft", color: "var(--sky-cyan)", fg: "#08333f" },
  explanation: { label: "Explanation", color: "var(--petal-pink)", fg: "#4a1d2b" },
  recommendation: { label: "Recommendation", color: "var(--hub-green)", fg: "#08331f" },
  examTip: { label: "Exam tip", color: "var(--star-yellow)", fg: "#3a2c00" },
};

export function SourceBadge({ kind }: { kind: SourceKind }) {
  const m = SOURCE_META[kind];
  return (
    <span
      className="cc-chip"
      style={{ background: m.color, color: m.fg, borderColor: "transparent" }}
    >
      {m.label}
    </span>
  );
}

const DIFF_META: Record<DifficultyTier, { label: string; color: string }> = {
  beginner: { label: "Beginner", color: "var(--hub-green)" },
  intermediate: { label: "Intermediate", color: "var(--sky-cyan)" },
  advanced: { label: "Advanced", color: "var(--corgi-orange)" },
  challenge: { label: "Challenge", color: "var(--captain-red)" },
};

export function DifficultyBadge({ tier }: { tier: DifficultyTier }) {
  const m = DIFF_META[tier];
  return (
    <span className="cc-chip" style={{ color: m.color, borderColor: m.color }}>
      {m.label}
    </span>
  );
}

export function Chip({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className="cc-chip"
      style={
        tone === "accent"
          ? { background: "var(--accent)", color: "var(--accent-fg)", borderColor: "transparent" }
          : { color: "var(--fg-3)" }
      }
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={`cc-card ${hover ? "cc-card-hover" : ""} ${className}`}>{children}</div>;
}

/** SVG progress ring. */
export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  color = "var(--accent)",
  label,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out)" }}
        />
      </svg>
      <span className="absolute font-display font-bold" style={{ fontSize: size * 0.26 }}>
        {label ?? `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
}

export function Bar({ value, color = "var(--accent)" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color, transition: "width 600ms var(--ease-out)" }}
      />
    </div>
  );
}
