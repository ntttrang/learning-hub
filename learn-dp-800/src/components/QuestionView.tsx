"use client";

import { useMemo } from "react";
import { Check, X, ChevronUp, ChevronDown } from "lucide-react";
import type { Question } from "@/lib/types";
import { Markdown } from "./Markdown";
import { SqlBlock } from "./SqlBlock";
import { gradeQuestion, normalizeSqlBlank } from "@/lib/scoring";

interface Props {
  question: Question;
  value: string[];
  onChange: (v: string[]) => void;
  /** When true, correctness is revealed (immediate feedback / review). */
  reveal?: boolean;
  disabled?: boolean;
}

export function QuestionView({ question, value, onChange, reveal = false, disabled = false }: Props) {
  const q = question;
  const locked = disabled || reveal;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <TypeTag type={q.type} />
        {q.type === "multi" && (
          <span className="text-xs" style={{ color: "var(--fg-4)" }}>
            {q.correct?.length === 2 ? "Select two" : "Select all that apply"}
          </span>
        )}
      </div>
      <div className="mb-3">
        <Markdown>{q.prompt}</Markdown>
      </div>
      {q.code && q.type !== "sqlFill" && (
        <div className="mb-3">
          <SqlBlock code={q.code} />
        </div>
      )}

      {(q.type === "single" || q.type === "codeReading" || q.type === "debugging") && (
        <ChoiceList question={q} value={value} onChange={onChange} reveal={reveal} locked={locked} multi={false} />
      )}
      {q.type === "multi" && (
        <ChoiceList question={q} value={value} onChange={onChange} reveal={reveal} locked={locked} multi />
      )}
      {q.type === "ordering" && (
        <OrderingList question={q} value={value} onChange={onChange} reveal={reveal} locked={locked} />
      )}
      {q.type === "matching" && (
        <MatchingList question={q} value={value} onChange={onChange} reveal={reveal} locked={locked} />
      )}
      {q.type === "sqlFill" && (
        <SqlFillBlock question={q} value={value} onChange={onChange} reveal={reveal} locked={locked} />
      )}
    </div>
  );
}

function TypeTag({ type }: { type: Question["type"] }) {
  const label: Record<Question["type"], string> = {
    single: "Single answer",
    multi: "Multiple answer",
    ordering: "Ordering",
    matching: "Matching",
    codeReading: "Code reading",
    debugging: "Debugging",
    sqlFill: "Fill in SQL",
  };
  return (
    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>
      {label[type]}
    </span>
  );
}

function ChoiceList({
  question,
  value,
  onChange,
  reveal,
  locked,
  multi,
}: {
  question: Question;
  value: string[];
  onChange: (v: string[]) => void;
  reveal: boolean;
  locked: boolean;
  multi: boolean;
}) {
  const correct = new Set(question.correct ?? []);
  const toggle = (id: string) => {
    if (locked) return;
    if (multi) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange([id]);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      {question.options?.map((o) => {
        const selected = value.includes(o.id);
        const isCorrect = correct.has(o.id);
        let borderColor = "var(--border)";
        let bg = "var(--bg-elevated)";
        if (reveal) {
          if (isCorrect) {
            borderColor = "var(--success)";
            bg = "color-mix(in srgb, var(--success) 12%, var(--bg-elevated))";
          } else if (selected && !isCorrect) {
            borderColor = "var(--danger)";
            bg = "color-mix(in srgb, var(--danger) 12%, var(--bg-elevated))";
          }
        } else if (selected) {
          borderColor = "var(--accent)";
          bg = "color-mix(in srgb, var(--accent) 8%, var(--bg-elevated))";
        }
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            disabled={locked}
            aria-pressed={selected}
            className="flex items-start gap-3 rounded-[12px] px-3.5 py-2.5 text-left text-sm transition"
            style={{ border: `1.5px solid ${borderColor}`, background: bg, cursor: locked ? "default" : "pointer" }}
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-xs font-bold"
              style={{
                borderRadius: multi ? "6px" : "999px",
                border: `1.5px solid ${selected || (reveal && isCorrect) ? borderColor : "var(--border-strong)"}`,
                background: selected || (reveal && isCorrect) ? borderColor : "transparent",
                color: selected || (reveal && isCorrect) || (reveal && selected && !isCorrect) ? "#fff" : "var(--fg-2)",
              }}
            >
              {reveal && isCorrect ? (
                <Check size={13} />
              ) : reveal && selected && !isCorrect ? (
                <X size={13} />
              ) : (
                o.id.toUpperCase()
              )}
            </span>
            <span style={{ color: "var(--fg)" }}>{o.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function OrderingList({
  question,
  value,
  onChange,
  reveal,
  locked,
}: {
  question: Question;
  value: string[];
  onChange: (v: string[]) => void;
  reveal: boolean;
  locked: boolean;
}) {
  // Initialize order from options if empty
  const order = useMemo(() => {
    if (value.length === (question.options?.length ?? 0)) return value;
    return question.options?.map((o) => o.id) ?? [];
  }, [value, question.options]);

  const label = (id: string) => question.options?.find((o) => o.id === id)?.text ?? id;

  const move = (idx: number, dir: -1 | 1) => {
    if (locked) return;
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const correct = question.correct ?? [];

  return (
    <div className="flex flex-col gap-2">
      {order.map((id, idx) => {
        const rightPlace = reveal && correct[idx] === id;
        const wrongPlace = reveal && correct[idx] !== id;
        return (
          <div
            key={id}
            className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm"
            style={{
              border: `1.5px solid ${rightPlace ? "var(--success)" : wrongPlace ? "var(--danger)" : "var(--border)"}`,
              background: "var(--bg-elevated)",
            }}
          >
            <span className="font-display font-bold" style={{ color: "var(--fg-3)" }}>
              {idx + 1}
            </span>
            <span className="flex-1" style={{ color: "var(--fg)" }}>{label(id)}</span>
            {!locked && (
              <span className="flex flex-col">
                <button onClick={() => move(idx, -1)} aria-label="Move up" style={{ color: "var(--fg-3)" }}>
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => move(idx, 1)} aria-label="Move down" style={{ color: "var(--fg-3)" }}>
                  <ChevronDown size={16} />
                </button>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MatchingList({
  question,
  value,
  onChange,
  reveal,
  locked,
}: {
  question: Question;
  value: string[];
  onChange: (v: string[]) => void;
  reveal: boolean;
  locked: boolean;
}) {
  const pairs = question.pairs ?? [];
  const rights = pairs.map((p) => p.right);
  // value tokens: `${leftIndex}::${right}`
  const chosen = (i: number) => {
    const t = value.find((v) => v.startsWith(`${i}::`));
    return t ? t.slice(String(i).length + 2) : "";
  };
  const set = (i: number, right: string) => {
    if (locked) return;
    const rest = value.filter((v) => !v.startsWith(`${i}::`));
    onChange(right ? [...rest, `${i}::${right}`] : rest);
  };

  return (
    <div className="flex flex-col gap-2">
      {pairs.map((p, i) => {
        const correctRight = p.right;
        const picked = chosen(i);
        const ok = reveal && picked === correctRight;
        const bad = reveal && picked !== correctRight;
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm"
            style={{ border: `1.5px solid ${ok ? "var(--success)" : bad ? "var(--danger)" : "var(--border)"}`, background: "var(--bg-elevated)" }}
          >
            <span className="flex-1 font-semibold" style={{ color: "var(--fg)" }}>{p.left}</span>
            <select
              value={picked}
              onChange={(e) => set(i, e.target.value)}
              disabled={locked}
              className="rounded-[8px] px-2 py-1 text-sm"
              style={{ background: "var(--bg-sunken)", color: "var(--fg)", border: "1.5px solid var(--border)" }}
            >
              <option value="">Choose...</option>
              {rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {reveal && bad && (
              <span className="text-xs" style={{ color: "var(--success)" }}>
                → {correctRight}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SqlFillBlock({
  question,
  value,
  onChange,
  reveal,
  locked,
}: {
  question: Question;
  value: string[];
  onChange: (v: string[]) => void;
  reveal: boolean;
  locked: boolean;
}) {
  const parts = (question.code ?? "").split("____");
  const blankCount = Math.max(0, parts.length - 1);
  const expected = question.correct ?? [];

  const setBlank = (index: number, text: string) => {
    if (locked) return;
    const next = Array.from({ length: blankCount }, (_, i) => (i === index ? text : (value[i] ?? "")));
    onChange(next);
  };

  return (
    <div className="relative overflow-hidden rounded-[12px]" style={{ border: "1.5px solid var(--border)" }}>
      <div
        className="px-3 py-1.5 text-xs font-bold"
        style={{ background: "var(--bg-sunken)", borderBottom: "1.5px solid var(--border)", color: "var(--fg-3)" }}
      >
        SQL
      </div>
      <pre
        className="cc-code m-0 whitespace-pre-wrap rounded-none border-0"
        style={{ background: "var(--code-bg)" }}
      >
        <code className="language-sql">
          {parts.map((part, i) => {
            const showBlank = i < blankCount;
            const typed = value[i] ?? "";
            const canonical = expected[i] ?? "";
            const aliases = question.blankAliases?.[i] ?? [];
            const ok =
              reveal &&
              !!typed &&
              [canonical, ...aliases].map(normalizeSqlBlank).includes(normalizeSqlBlank(typed));
            const bad = reveal && showBlank && !ok;
            return (
              <span key={i}>
                {part}
                {showBlank && (
                  <input
                    type="text"
                    value={typed}
                    onChange={(e) => setBlank(i, e.target.value)}
                    disabled={locked}
                    aria-label={`Blank ${i + 1} of ${blankCount}`}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="mx-0.5 inline-block min-w-[7rem] rounded-[6px] px-1.5 py-0.5 align-baseline font-mono text-sm"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--fg)",
                      border: `1.5px solid ${ok ? "var(--success)" : bad ? "var(--danger)" : "var(--border-strong)"}`,
                    }}
                  />
                )}
              </span>
            );
          })}
        </code>
      </pre>
      {reveal && expected.length > 0 && (
        <p className="px-3 py-2 text-xs" style={{ color: "var(--fg-3)", borderTop: "1.5px solid var(--border)" }}>
          Expected: {expected.join(" · ")}
        </p>
      )}
    </div>
  );
}

/** Grades a response for display (thin wrapper). */
export function isCorrect(question: Question, value: string[]): boolean {
  return gradeQuestion(question, value);
}
