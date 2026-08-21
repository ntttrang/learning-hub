"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  GraduationCap,
  FileText,
} from "lucide-react";
import type { MockExam } from "@/lib/types";
import { getQuestions } from "@/lib/content";
import { QuestionView } from "./QuestionView";
import { Markdown } from "./Markdown";
import { useStore } from "@/lib/store";
import { scoreQuestions, toScaledScore, scoreByDomain } from "@/lib/scoring";
import { Card } from "./ui";

export function ExamEngine({ exam }: { exam: MockExam }) {
  const router = useRouter();
  const recordExam = useStore((s) => s.recordExam);
  const questions = useMemo(() => getQuestions(exam.questionIds), [exam.questionIds]);

  const [phase, setPhase] = useState<"intro" | "running">("intro");
  const [timed, setTimed] = useState(true);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(exam.durationMinutes * 60);
  const startRef = useRef<number>(0);
  const submittedRef = useRef(false);

  const submit = useMemo(
    () => () => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const scored = scoreQuestions(questions, answers);
      const perDomain = scoreByDomain(questions, scored.results);
      const scaled = toScaledScore(scored.accuracy);
      const attempt = {
        id: `exam-${Date.now()}`,
        examId: exam.id,
        date: new Date().toISOString(),
        durationSeconds: Math.round((Date.now() - startRef.current) / 1000),
        timed,
        scaledScore: scaled,
        passed: scaled >= exam.passingScore,
        perDomain,
        answers,
        results: scored.results,
      };
      recordExam(attempt);
      router.push(`/exam/${exam.id}/results?attempt=${attempt.id}`);
    },
    [answers, exam, questions, recordExam, router, timed],
  );

  useEffect(() => {
    if (phase !== "running" || !timed) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, timed, submit]);

  if (phase === "intro") {
    return (
      <Card className="mx-auto max-w-xl p-6 text-center">
        <GraduationCap size={40} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-2xl font-bold">{exam.title}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-2)" }}>{exam.description}</p>
        <div className="mt-4 flex justify-center gap-4 text-sm" style={{ color: "var(--fg-3)" }}>
          <span>{questions.length} questions</span>
          <span>·</span>
          <span>{exam.durationMinutes} min</span>
          <span>·</span>
          <span>Pass {exam.passingScore}/1000</span>
        </div>

        <div className="mt-5 inline-flex rounded-full p-1" style={{ background: "var(--bg-sunken)", border: "1.5px solid var(--border)" }}>
          {[
            { v: true, label: "Timed" },
            { v: false, label: "Untimed" },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => setTimed(o.v)}
              className="rounded-full px-4 py-1.5 text-sm font-bold transition"
              style={{ background: timed === o.v ? "var(--accent)" : "transparent", color: timed === o.v ? "var(--accent-fg)" : "var(--fg-3)" }}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              startRef.current = Date.now();
              setPhase("running");
            }}
            className="cc-btn cc-btn-primary"
          >
            Begin exam
          </button>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--fg-4)" }}>
          Your answers and score save automatically when you submit.
        </p>
      </Card>
    );
  }

  const q = questions[idx];
  const caseStudy = exam.caseStudies?.find((cs) => cs.questionIds.includes(q.id));
  const answeredCount = Object.values(answers).filter((v) => v.length > 0).length;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const lowTime = timed && secondsLeft < 300;

  const toggleFlag = () => {
    setFlags((f) => {
      const n = new Set(f);
      if (n.has(q.id)) n.delete(q.id);
      else n.add(q.id);
      return n;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky exam header */}
      <div className="sticky top-14 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[16px] p-3" style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-1)" }}>
        <span className="text-sm font-bold">{exam.title}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--fg-3)" }}>{answeredCount}/{questions.length} answered</span>
          {timed && (
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold" style={{ background: "var(--bg-sunken)", color: lowTime ? "var(--danger)" : "var(--fg)" }}>
              <Clock size={14} /> {mm}:{ss}
            </span>
          )}
          <button onClick={submit} className="cc-btn cc-btn-primary text-sm">
            <Send size={14} /> Submit
          </button>
        </div>
      </div>

      {/* Navigator */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((qq, i) => {
          const answered = (answers[qq.id]?.length ?? 0) > 0;
          const flagged = flags.has(qq.id);
          const current = i === idx;
          return (
            <button
              key={qq.id}
              onClick={() => setIdx(i)}
              aria-label={`Go to question ${i + 1}`}
              className="relative flex h-8 w-8 items-center justify-center rounded-[8px] text-xs font-bold transition"
              style={{
                background: current ? "var(--accent)" : answered ? "color-mix(in srgb, var(--success) 22%, var(--bg-elevated))" : "var(--bg-sunken)",
                color: current ? "var(--accent-fg)" : "var(--fg-2)",
                border: `1.5px solid ${current ? "transparent" : "var(--border)"}`,
              }}
            >
              {i + 1}
              {flagged && <Flag size={9} className="absolute -right-0.5 -top-0.5" style={{ color: "var(--danger)", fill: "var(--danger)" }} />}
            </button>
          );
        })}
      </div>

      {/* Case study background */}
      {caseStudy && (
        <Card className="p-4" >
          <div className="mb-1 flex items-center gap-2">
            <FileText size={15} style={{ color: "var(--sky-cyan)" }} />
            <span className="font-display text-sm font-bold">{caseStudy.title}</span>
          </div>
          <Markdown>{caseStudy.background}</Markdown>
        </Card>
      )}

      {/* Question */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>
            Question {idx + 1} of {questions.length}
          </span>
          <button
            onClick={toggleFlag}
            className="flex items-center gap-1 text-sm font-semibold"
            style={{ color: flags.has(q.id) ? "var(--danger)" : "var(--fg-3)" }}
          >
            <Flag size={14} style={{ fill: flags.has(q.id) ? "var(--danger)" : "transparent" }} />
            {flags.has(q.id) ? "Flagged" : "Flag"}
          </button>
        </div>

        <QuestionView
          question={q}
          value={answers[q.id] ?? []}
          onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        />

        <div className="mt-5 flex justify-between">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="cc-btn cc-btn-ghost text-sm" style={{ opacity: idx === 0 ? 0.5 : 1 }}>
            <ChevronLeft size={15} /> Previous
          </button>
          {idx < questions.length - 1 ? (
            <button onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))} className="cc-btn cc-btn-ghost text-sm">
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={submit} className="cc-btn cc-btn-primary text-sm">
              <Send size={14} /> Submit exam
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
