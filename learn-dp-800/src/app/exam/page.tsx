"use client";

import { Link } from "@/components/Link";
import { GraduationCap, Clock, ArrowRight, History, ClipboardList } from "lucide-react";
import { MOCK_EXAMS, DOMAINS, getExam } from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { Card } from "@/components/ui";
import { buildRevisionPlan } from "@/lib/revision";

export default function ExamListPage() {
  const hydrated = useHydrated();
  const examAttempts = useStore((s) => s.examAttempts);

  const revision = hydrated ? buildRevisionPlan(examAttempts) : [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Mock exams</h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--fg-2)" }}>
          Full-length, original practice exams built from the official skills outline — never real exam items. Timed or untimed, with flag-for-review, navigation, case studies, and per-domain scoring.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_EXAMS.map((exam) => (
          <Card key={exam.id} hover className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap size={20} style={{ color: "var(--accent)" }} />
              <h2 className="font-display text-lg font-bold">{exam.title}</h2>
            </div>
            <p className="text-sm" style={{ color: "var(--fg-2)" }}>{exam.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="cc-chip" style={{ color: "var(--fg-3)" }}>{exam.questionIds.length} questions</span>
              <span className="cc-chip" style={{ color: "var(--fg-3)" }}><Clock size={12} /> {exam.durationMinutes} min</span>
              <span className="cc-chip" style={{ color: "var(--fg-3)" }}>Pass {exam.passingScore}/1000</span>
              {exam.caseStudies && <span className="cc-chip" style={{ color: "var(--fg-3)" }}>Case study</span>}
            </div>
            <Link href={`/exam/${exam.id}`} className="cc-btn cc-btn-primary mt-4 text-sm">
              Start exam <ArrowRight size={15} />
            </Link>
          </Card>
        ))}
      </div>

      {/* Revision plan */}
      {revision.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
            <ClipboardList size={18} style={{ color: "var(--accent)" }} /> Your personalized revision plan
          </h2>
          <div className="flex flex-col gap-2">
            {revision.map((r) => (
              <Link
                key={r.lessonId}
                href={`/learn/${r.slug}`}
                className="flex items-center justify-between rounded-[12px] px-4 py-3 transition hover:bg-[var(--bg-sunken)]"
                style={{ border: "1.5px solid var(--border)" }}
              >
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

      {/* History */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <History size={18} style={{ color: "var(--accent)" }} /> Attempt history
        </h2>
        {!hydrated || examAttempts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>No attempts yet — take an exam to build your history.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {examAttempts.map((a) => {
              const exam = getExam(a.examId);
              return (
                <Link
                  key={a.id}
                  href={`/exam/${a.examId}/results?attempt=${a.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] px-4 py-3 transition hover:bg-[var(--bg-sunken)]"
                  style={{ border: "1.5px solid var(--border)" }}
                >
                  <span className="text-sm font-semibold">
                    {exam?.title ?? a.examId}
                    <span className="ml-2 font-normal" style={{ color: "var(--fg-4)" }}>
                      {new Date(a.date).toLocaleString()} · {a.timed ? "timed" : "untimed"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="flex gap-1">
                      {DOMAINS.map((d) => {
                        const pd = a.perDomain.find((p) => p.domainId === d.id);
                        const pct = pd && pd.total ? pd.correct / pd.total : 0;
                        return (
                          <span key={d.id} className="inline-block h-2 w-6 rounded-full" title={`${d.code}: ${Math.round(pct * 100)}%`} style={{ background: `color-mix(in srgb, var(${d.accent}) ${Math.max(15, pct * 100)}%, var(--border))` }} />
                        );
                      })}
                    </span>
                    <span className="text-sm font-bold" style={{ color: a.passed ? "var(--success)" : "var(--danger)" }}>
                      {a.scaledScore}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
