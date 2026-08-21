"use client";

import { Suspense, useState } from "react";
import { Link } from "@/components/Link";
import { useParams, useSearchParams } from "next/navigation";
import { Trophy, ArrowRight, RotateCcw, ClipboardList } from "lucide-react";
import { DOMAINS, getExam, getLesson, getQuestions } from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { Card, Bar, ProgressRing } from "@/components/ui";
import { QuestionView } from "@/components/QuestionView";
import { Markdown } from "@/components/Markdown";
import { buildRevisionPlan } from "@/lib/revision";

function ResultsInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const attemptId = search.get("attempt");
  const hydrated = useHydrated();
  const examAttempts = useStore((s) => s.examAttempts);
  const [showReview, setShowReview] = useState(false);

  const exam = getExam(params.id);
  const attempt = hydrated
    ? examAttempts.find((a) => a.id === attemptId) ?? examAttempts.find((a) => a.examId === params.id)
    : undefined;

  if (!hydrated) {
    return <p className="text-sm" style={{ color: "var(--fg-3)" }}>Loading results...</p>;
  }

  if (!exam || !attempt) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>No results found for this attempt.</p>
        <Link href="/exam" className="cc-btn cc-btn-primary mx-auto mt-4 text-sm">Back to exams</Link>
      </Card>
    );
  }

  const revision = buildRevisionPlan([attempt]);
  const questions = getQuestions(exam.questionIds);

  return (
    <div className="flex flex-col gap-6">
      {/* Score header */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing value={attempt.scaledScore / 1000} size={110} stroke={10} color={attempt.passed ? "var(--success)" : "var(--danger)"} label={`${attempt.scaledScore}`} />
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Trophy size={20} style={{ color: attempt.passed ? "var(--success)" : "var(--fg-3)" }} />
              <h1 className="font-display text-3xl font-bold">{attempt.passed ? "Pass" : "Not yet"}</h1>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
              Scaled score <strong>{attempt.scaledScore}/1000</strong> (passing {exam.passingScore}) ·{" "}
              {attempt.results.filter((r) => r.correct).length}/{attempt.results.length} correct
            </p>
            <p className="text-xs" style={{ color: "var(--fg-4)" }}>
              {new Date(attempt.date).toLocaleString()} · {attempt.timed ? "timed" : "untimed"} · {Math.round(attempt.durationSeconds / 60)} min
            </p>
          </div>
        </div>
      </Card>

      {/* Per-domain */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-xl font-bold">Score by domain</h2>
        <div className="flex flex-col gap-4">
          {DOMAINS.map((d) => {
            const pd = attempt.perDomain.find((p) => p.domainId === d.id);
            const pct = pd && pd.total ? pd.correct / pd.total : 0;
            return (
              <div key={d.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(${d.accent})` }} /> {d.code}: {d.title}
                  </span>
                  <span style={{ color: "var(--fg-3)" }}>{pd ? `${pd.correct}/${pd.total}` : "—"} ({Math.round(pct * 100)}%)</span>
                </div>
                <Bar value={pct} color={pct >= 0.7 ? "var(--success)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)"} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revision plan */}
      {revision.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
            <ClipboardList size={18} style={{ color: "var(--accent)" }} /> Recommended revision
          </h2>
          <div className="flex flex-col gap-2">
            {revision.map((r) => (
              <Link key={r.lessonId} href={`/learn/${r.slug}`} className="flex items-center justify-between rounded-[12px] px-4 py-3 transition hover:bg-[var(--bg-sunken)]" style={{ border: "1.5px solid var(--border)" }}>
                <span>
                  <span className="block text-sm font-semibold">{r.title}</span>
                  <span className="block text-xs" style={{ color: "var(--fg-3)" }}>{r.reason}</span>
                </span>
                <ArrowRight size={15} style={{ color: "var(--fg-3)" }} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={() => setShowReview((v) => !v)} className="cc-btn cc-btn-ghost text-sm">
          {showReview ? "Hide" : "Review"} all answers
        </button>
        <Link href={`/exam/${exam.id}`} className="cc-btn cc-btn-primary text-sm">
          <RotateCcw size={15} /> Retake exam
        </Link>
      </div>

      {/* Answer review */}
      {showReview && (
        <div className="flex flex-col gap-4">
          {questions.map((q, i) => {
            const res = attempt.results.find((r) => r.questionId === q.id);
            return (
              <Card key={q.id} className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>Question {i + 1}</span>
                  <span className="text-sm font-bold" style={{ color: res?.correct ? "var(--success)" : "var(--danger)" }}>
                    {res?.correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <QuestionView question={q} value={attempt.answers[q.id] ?? []} onChange={() => {}} reveal disabled />
                <div className="mt-3 rounded-[12px] p-3" style={{ background: "var(--bg-sunken)" }}>
                  <Markdown>{q.explanation}</Markdown>
                  <ReviewLessonLink lessonId={q.lessonId} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewLessonLink({ lessonId }: { lessonId?: string }) {
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  if (!lesson) return null;
  return (
    <Link href={`/learn/${lesson.slug}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--link)" }}>
      Review: {lesson.title} <ArrowRight size={13} />
    </Link>
  );
}

export default function ResultsClient() {
  return (
    <Suspense fallback={<p className="text-sm" style={{ color: "var(--fg-3)" }}>Loading...</p>}>
      <ResultsInner />
    </Suspense>
  );
}
