"use client";

import { Link } from "@/components/Link";
import {
  ArrowRight,
  Flame,
  Trophy,
  Target,
  FlaskConical,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import {
  DOMAINS,
  LESSONS,
  TOTAL_LESSONS,
  TOTAL_LABS,
  lessonsForDomain,
  getLesson,
  LESSON_SEQUENCE,
  EXAM_META,
} from "@/lib/content";
import { Card, ProgressRing, Bar, DifficultyBadge } from "@/components/ui";
import { computeStats } from "@/lib/progress";
import { asset } from "@/lib/asset";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const lessons = useStore((s) => s.lessons);
  const completedLabs = useStore((s) => s.completedLabs);
  const quizAttempts = useStore((s) => s.quizAttempts);
  const examAttempts = useStore((s) => s.examAttempts);
  const achievements = useStore((s) => s.achievements);
  const streak = useStore((s) => s.streak);
  const lastLessonId = useStore((s) => s.lastLessonId);

  const stats = hydrated
    ? computeStats({ lessons, completedLabs, quizAttempts, examAttempts })
    : null;

  const continueLesson =
    (lastLessonId && getLesson(lastLessonId)) ||
    LESSON_SEQUENCE.find((l) => lessons[l.id]?.status !== "completed") ||
    LESSON_SEQUENCE[0];

  const nextRecommended = LESSON_SEQUENCE.find(
    (l) => hydrated && lessons[l.id]?.status !== "completed" && l.id !== continueLesson?.id,
  );

  const recentAttempts = [...(hydrated ? examAttempts : [])].slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero / continue */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/brand/captain-corgi-avatar.png")}
            alt="Captain Corgi"
            width={96}
            height={96}
            className="rounded-full"
            style={{ boxShadow: "var(--shadow-2)" }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--fg-3)" }}>
              Welcome back, crew
            </p>
            <h1 className="font-display text-3xl font-bold">Let&apos;s keep sailing toward {EXAM_META.code}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
              {EXAM_META.credential} · {TOTAL_LESSONS} lessons · {TOTAL_LABS} labs · skills as of {EXAM_META.skillsAsOf}
            </p>
            {continueLesson && (
              <Link href={`/learn/${continueLesson.slug}`} className="cc-btn cc-btn-primary mt-4 inline-flex">
                Continue: {continueLesson.title}
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <ProgressRing value={stats ? stats.overall : 0} size={92} stroke={9} />
            <span className="text-xs font-semibold" style={{ color: "var(--fg-3)" }}>
              overall complete
            </span>
          </div>
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi Icon={Flame} label="Day streak" value={stats ? `${streak.current}` : "0"} tone="var(--corgi-orange)" sub={`Longest ${streak.longest}`} />
        <Kpi Icon={Target} label="Quiz accuracy" value={stats ? `${Math.round(stats.quizAccuracy * 100)}%` : "0%"} tone="var(--sky-cyan)" sub={`${stats?.quizCount ?? 0} attempts`} />
        <Kpi Icon={FlaskConical} label="Labs done" value={stats ? `${stats.labsDone}/${TOTAL_LABS}` : `0/${TOTAL_LABS}`} tone="var(--hub-green)" sub="hands-on" />
        <Kpi Icon={Trophy} label="Badges" value={hydrated ? `${achievements.length}` : "0"} tone="var(--star-yellow)" sub="earned" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Completion by domain */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <TrendingUp size={18} style={{ color: "var(--accent)" }} /> Completion by domain
          </h2>
          <div className="flex flex-col gap-4">
            {DOMAINS.map((d) => {
              const dl = lessonsForDomain(d.id);
              const done = hydrated ? dl.filter((l) => lessons[l.id]?.status === "completed").length : 0;
              const pct = dl.length ? done / dl.length : 0;
              const examPct = stats?.domainExam[d.id];
              return (
                <div key={d.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Link href="/learn" className="font-semibold hover:underline">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(${d.accent})` }} /> {d.code}: {d.title}
                    </Link>
                    <span style={{ color: "var(--fg-3)" }}>
                      {done}/{dl.length} lessons
                      {examPct !== undefined && ` · exam ${Math.round(examPct * 100)}%`}
                    </span>
                  </div>
                  <Bar value={pct} color={`var(${d.accent})`} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Next up + recommendations */}
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
            <BookOpen size={18} style={{ color: "var(--accent)" }} /> Recommended next
          </h2>
          <div className="flex flex-col gap-3">
            {stats && stats.weakDomains.length > 0 ? (
              <div className="rounded-[12px] p-3" style={{ background: "var(--bg-sunken)" }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>
                  Focus area
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {DOMAINS.find((d) => d.id === stats.weakDomains[0])?.title}
                </p>
                <p className="text-xs" style={{ color: "var(--fg-3)" }}>
                  Your mock-exam accuracy here is the lowest — revisit these lessons.
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                Take a mock exam to unlock personalized focus areas.
              </p>
            )}
            {nextRecommended && (
              <Link href={`/learn/${nextRecommended.slug}`} className="block rounded-[12px] p-3 transition hover:bg-[var(--bg-sunken)]" style={{ border: "1.5px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{nextRecommended.title}</span>
                  <ArrowRight size={15} style={{ color: "var(--fg-3)" }} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <DifficultyBadge tier={nextRecommended.difficulty} />
                  <span className="text-xs" style={{ color: "var(--fg-3)" }}>
                    ~{nextRecommended.estimatedMinutes} min
                  </span>
                </div>
              </Link>
            )}
            <Link href="/practice" className="cc-btn cc-btn-ghost w-full justify-center text-sm">
              Practice weak questions
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="p-5">
        <h2 className="mb-3 font-display text-xl font-bold">Recent mock-exam activity</h2>
        {recentAttempts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>
            No mock exams yet. <Link href="/exam" className="font-semibold" style={{ color: "var(--link)" }}>Take your first one</Link> to see performance analysis.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentAttempts.map((a) => (
              <Link
                key={a.id}
                href={`/exam/${a.examId}/results?attempt=${a.id}`}
                className="flex items-center justify-between rounded-[12px] px-3 py-2.5 transition hover:bg-[var(--bg-sunken)]"
                style={{ border: "1.5px solid var(--border)" }}
              >
                <span className="text-sm font-semibold">
                  {new Date(a.date).toLocaleDateString()} · {a.examId}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: a.passed ? "var(--success)" : "var(--danger)" }}
                >
                  {a.scaledScore}/1000 {a.passed ? "· Pass" : "· Keep going"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({
  Icon,
  label,
  value,
  tone,
  sub,
}: {
  Icon: typeof Flame;
  label: string;
  value: string;
  tone: string;
  sub: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--bg-sunken)", color: tone }}>
          <Icon size={16} />
        </span>
        <span className="text-xs font-semibold" style={{ color: "var(--fg-3)" }}>
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs" style={{ color: "var(--fg-4)" }}>
        {sub}
      </p>
    </Card>
  );
}
