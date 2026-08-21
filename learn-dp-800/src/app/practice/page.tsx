"use client";

import { useMemo, useState } from "react";
import { Target, RefreshCw, Layers, ChevronLeft, Code2 } from "lucide-react";
import { DOMAINS, MODULES, QUESTIONS, LAB_CODING_SETS, getQuestions, questionsForModule, questionsForLabCodingSet } from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { dueCards } from "@/lib/srs";
import { QuizRunner } from "@/components/QuizRunner";
import { Card } from "@/components/ui";

type Selection =
  | { kind: "module"; id: string }
  | { kind: "domain"; id: string }
  | { kind: "lab-coding"; id: string }
  | { kind: "review" }
  | null;

export default function PracticePage() {
  const hydrated = useHydrated();
  const srs = useStore((s) => s.srs);
  const quizAttempts = useStore((s) => s.quizAttempts);
  const [selection, setSelection] = useState<Selection>(null);

  const due = useMemo(() => {
    if (!hydrated) return [];
    return dueCards(Object.values(srs), new Date().toISOString());
  }, [srs, hydrated]);

  const reviewQuestions = useMemo(
    () => getQuestions(due.map((c) => c.questionId)),
    [due],
  );

  const accuracy = useMemo(() => {
    let c = 0, t = 0;
    for (const a of quizAttempts) { c += a.correct; t += a.total; }
    return t ? Math.round((c / t) * 100) : null;
  }, [quizAttempts]);

  if (selection) {
    let questions = QUESTIONS;
    let title = "";
    if (selection.kind === "module") {
      questions = questionsForModule(selection.id);
      title = MODULES.find((m) => m.id === selection.id)?.title ?? "";
    } else if (selection.kind === "domain") {
      questions = QUESTIONS.filter((q) => q.domainId === selection.id);
      title = DOMAINS.find((d) => d.id === selection.id)?.title ?? "";
    } else if (selection.kind === "lab-coding") {
      questions = questionsForLabCodingSet(selection.id);
      title = LAB_CODING_SETS.find((s) => s.id === selection.id)?.title ?? "";
    } else {
      questions = reviewQuestions;
      title = "Spaced review";
    }
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setSelection(null)} className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--fg-3)" }}>
          <ChevronLeft size={16} /> Back to practice
        </button>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {selection.kind === "lab-coding" && (
          <a
            href={LAB_CODING_SETS.find((s) => s.id === selection.id)?.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold"
            style={{ color: "var(--link)" }}
          >
            Official lab (Microsoft Learn)
          </a>
        )}
        <QuizRunner
          questions={questions}
          scope={
            selection.kind === "module"
              ? selection.id
              : selection.kind === "domain"
                ? selection.id
                : selection.kind === "lab-coding"
                  ? selection.id
                  : "review"
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Practice</h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--fg-2)" }}>
          Drill knowledge-check questions by domain or module, or run exam-style lab coding drills (scenario stems, A/B/C/D, some select-two) mapped to the official SQL developer labs. Missed questions are tracked and resurfaced via spaced repetition.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <RefreshCw size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-display text-lg font-bold">Spaced review</h2>
          </div>
          <p className="text-sm" style={{ color: "var(--fg-2)" }}>
            {hydrated ? (
              due.length > 0
                ? `${due.length} question${due.length === 1 ? "" : "s"} due for review right now.`
                : "Nothing due yet — miss a few questions and they'll reappear here on a schedule."
            ) : "Loading your review queue..."}
          </p>
          <button
            onClick={() => setSelection({ kind: "review" })}
            disabled={due.length === 0}
            className="cc-btn cc-btn-primary mt-3 text-sm"
            style={{ opacity: due.length === 0 ? 0.5 : 1 }}
          >
            Start review
          </button>
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Target size={18} style={{ color: "var(--sky-cyan)" }} />
            <h2 className="font-display text-lg font-bold">Your accuracy</h2>
          </div>
          <p className="font-display text-4xl font-bold">{hydrated && accuracy !== null ? `${accuracy}%` : "—"}</p>
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>
            across {hydrated ? quizAttempts.length : 0} practice sessions
          </p>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <Layers size={18} style={{ color: "var(--accent)" }} /> Practice by domain
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {DOMAINS.map((d) => {
            const count = QUESTIONS.filter((q) => q.domainId === d.id).length;
            return (
              <button key={d.id} onClick={() => setSelection({ kind: "domain", id: d.id })} className="text-left">
                <Card hover className="h-full p-4">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(${d.accent})` }} />
                  <h3 className="mt-2 font-display text-base font-bold">{d.code}: {d.title}</h3>
                  <p className="mt-1 text-xs" style={{ color: "var(--fg-3)" }}>{count} questions</p>
                </Card>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <Code2 size={18} style={{ color: "var(--sky-cyan)" }} /> Lab coding
        </h2>
        <p className="mb-3 text-sm" style={{ color: "var(--fg-3)" }}>
          DP-800-style scenarios with near-miss distractors. Official labs are linked for study — we do not copy their scripts.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LAB_CODING_SETS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelection({ kind: "lab-coding", id: s.id })}
              className="flex items-center justify-between rounded-[12px] px-4 py-3 text-left transition hover:bg-[var(--bg-sunken)]"
              style={{ border: "1.5px solid var(--border)" }}
            >
              <span className="text-sm font-semibold">
                Lab {String(s.labNumber).padStart(2, "0")} · {s.title}
              </span>
              <span className="text-xs" style={{ color: "var(--fg-4)" }}>{s.questionIds.length} Q</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Practice by module</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => {
            const count = questionsForModule(m.id).length;
            if (count === 0) return null;
            return (
              <button
                key={m.id}
                onClick={() => setSelection({ kind: "module", id: m.id })}
                className="flex items-center justify-between rounded-[12px] px-4 py-3 text-left transition hover:bg-[var(--bg-sunken)]"
                style={{ border: "1.5px solid var(--border)" }}
              >
                <span className="text-sm font-semibold">{m.code} · {m.title}</span>
                <span className="text-xs" style={{ color: "var(--fg-4)" }}>{count} Q</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
