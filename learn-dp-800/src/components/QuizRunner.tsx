"use client";

import { useState } from "react";
import { Link } from "@/components/Link";
import { ArrowRight, RotateCcw, BookOpen, CheckCircle2 } from "lucide-react";
import type { Question } from "@/lib/types";
import { QuestionView } from "./QuestionView";
import { Markdown } from "./Markdown";
import { gradeQuestion } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { getLesson } from "@/lib/content";
import { Card } from "./ui";

export function QuizRunner({
  questions,
  scope,
  title,
}: {
  questions: Question[];
  scope: string;
  title?: string;
}) {
  const recordQuiz = useStore((s) => s.recordQuiz);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [runKey, setRunKey] = useState(0);

  if (questions.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
        No questions available yet.
      </p>
    );
  }

  const q = questions[idx];
  const value = answers[q.id] ?? [];
  const isChecked = checked[q.id];
  const correct = isChecked ? gradeQuestion(q, value) : false;
  const blankCount = q.type === "sqlFill" ? (q.code?.match(/____/g) ?? []).length : 0;
  const canCheck =
    q.type === "sqlFill"
      ? blankCount > 0 && value.length === blankCount && value.every((v) => v.trim() !== "")
      : value.length > 0;

  const check = () => setChecked((c) => ({ ...c, [q.id]: true }));

  const next = () => {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      const results = questions.map((qq) => ({
        questionId: qq.id,
        correct: gradeQuestion(qq, answers[qq.id] ?? []),
      }));
      recordQuiz({
        id: `quiz-${Date.now()}`,
        scope,
        date: new Date().toISOString(),
        total: questions.length,
        correct: results.filter((r) => r.correct).length,
        questionResults: results,
      });
      setFinished(true);
    }
  };

  const restart = () => {
    setIdx(0);
    setAnswers({});
    setChecked({});
    setFinished(false);
    setRunKey((k) => k + 1);
  };

  if (finished) {
    const score = questions.filter((qq) => gradeQuestion(qq, answers[qq.id] ?? [])).length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card className="p-6 text-center cc-rise">
        <CheckCircle2 size={40} className="mx-auto mb-2" style={{ color: pct >= 70 ? "var(--success)" : "var(--warning)" }} />
        <h3 className="font-display text-2xl font-bold">
          {score}/{questions.length} correct ({pct}%)
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>
          {pct >= 70 ? "Nicely done, crew — that's a solid pass." : "Good effort — missed questions will resurface in spaced review."}
        </p>
        <button onClick={restart} className="cc-btn cc-btn-ghost mx-auto mt-4">
          <RotateCcw size={15} /> Retake
        </button>
      </Card>
    );
  }

  const lesson = q.lessonId ? getLesson(q.lessonId) : undefined;

  return (
    <Card className="p-5" key={runKey}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>
          {title ? `${title} · ` : ""}Question {idx + 1} of {questions.length}
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full" style={{ width: `${((idx + 1) / questions.length) * 100}%`, background: "var(--accent)" }} />
        </div>
      </div>

      <QuestionView
        question={q}
        value={value}
        onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        reveal={isChecked}
      />

      {isChecked && (
        <div
          className="mt-4 rounded-[12px] p-4 cc-rise"
          style={{ background: "var(--bg-sunken)", borderLeft: `3px solid ${correct ? "var(--success)" : "var(--danger)"}` }}
        >
          <p className="mb-1 text-sm font-bold" style={{ color: correct ? "var(--success)" : "var(--danger)" }}>
            {correct ? "Correct" : "Not quite"}
          </p>
          <Markdown>{q.explanation}</Markdown>
          {lesson && (
            <Link href={`/learn/${lesson.slug}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--link)" }}>
              <BookOpen size={14} /> Review: {lesson.title}
            </Link>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {!isChecked ? (
          <button onClick={check} disabled={!canCheck} className="cc-btn cc-btn-primary" style={{ opacity: canCheck ? 1 : 0.5 }}>
            Check answer
          </button>
        ) : (
          <button onClick={next} className="cc-btn cc-btn-primary">
            {idx < questions.length - 1 ? "Next" : "Finish"} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </Card>
  );
}
