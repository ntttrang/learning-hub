"use client";

import { useEffect } from "react";
import { Link } from "@/components/Link";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Target,
  Lightbulb,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  FlaskConical,
} from "lucide-react";
import type { Lesson, ContentBlock } from "@/lib/types";
import { getDomain, getModule, adjacentLessons, getLab } from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { Markdown } from "./Markdown";
import { Mermaid } from "./Mermaid";
import { ComparisonTable } from "./Comparison";
import { QuizRunner } from "./QuizRunner";
import { LessonNotes } from "./NotesPanel";
import { SourceBadge, DifficultyBadge, Card } from "./ui";
import { getQuestions } from "@/lib/content";

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-3 font-display text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-[16px] p-4" style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border-soft)" }}>
          <div className="mb-2 flex items-center gap-2">
            <SourceBadge kind={b.kind} />
            {b.heading && <span className="font-display text-base font-bold">{b.heading}</span>}
          </div>
          <Markdown>{b.body}</Markdown>
        </div>
      ))}
    </div>
  );
}

export function LessonViewer({ lesson }: { lesson: Lesson }) {
  const hydrated = useHydrated();
  const domain = getDomain(lesson.domainId);
  const module = getModule(lesson.moduleId);
  const { prev, next } = adjacentLessons(lesson.id);
  const s = lesson.sections;
  const lab = lesson.labId ? getLab(lesson.labId) : undefined;
  const kcQuestions = getQuestions(lesson.knowledgeCheck.questionIds);

  const status = useStore((st) => st.lessons[lesson.id]?.status);
  const bookmarks = useStore((st) => st.bookmarks);
  const markLesson = useStore((st) => st.markLesson);
  const visitLesson = useStore((st) => st.visitLesson);
  const toggleBookmark = useStore((st) => st.toggleBookmark);

  const bookmarked = hydrated && bookmarks.includes(lesson.id);
  const completed = hydrated && status === "completed";

  useEffect(() => {
    visitLesson(lesson.id);
  }, [lesson.id, visitLesson]);

  return (
    <article className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--fg-3)" }}>
          <Link href="/learn" className="hover:underline">Curriculum</Link>
          <span>/</span>
          {domain && <span>{domain.code}</span>}
          <span>/</span>
          {module && <span>{module.code} {module.title}</span>}
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-4xl font-bold" style={{ lineHeight: 1.1 }}>
            {lesson.title}
          </h1>
          <button
            onClick={() => toggleBookmark(lesson.id)}
            className="cc-btn cc-btn-ghost shrink-0 text-sm"
            aria-pressed={bookmarked}
          >
            {bookmarked ? <BookmarkCheck size={16} style={{ color: "var(--accent)" }} /> : <Bookmark size={16} />}
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
        <p className="max-w-3xl text-base" style={{ color: "var(--fg-2)" }}>
          {lesson.summary}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge tier={lesson.difficulty} />
          <span className="cc-chip" style={{ color: "var(--fg-3)" }}>
            <Clock size={13} /> ~{lesson.estimatedMinutes} min
          </span>
          {lesson.flagship && (
            <span className="cc-chip" style={{ background: "var(--star-yellow)", color: "#3a2c00", borderColor: "transparent" }}>
              Flagship lesson
            </span>
          )}
        </div>
      </header>

      {/* Learning objectives */}
      <Section title="Learning objectives">
        <Card className="p-4">
          <ul className="flex flex-col gap-2">
            {lesson.learningObjectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Target size={16} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span style={{ color: "var(--fg)" }}>{o}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      {s.overview && (
        <Section title="Overview">
          <Markdown>{s.overview}</Markdown>
        </Section>
      )}

      {/* Key terms */}
      {lesson.keyTerms.length > 0 && (
        <Section title="Key terminology">
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.keyTerms.map((k, i) => (
              <div key={i} className="rounded-[12px] p-3" style={{ background: "var(--bg-sunken)" }}>
                <p className="font-mono text-sm font-bold" style={{ color: "var(--code-inline-fg)" }}>
                  {k.term}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
                  {k.definition}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {s.officialConcepts && (
        <Section title="Official Microsoft concepts">
          <Blocks blocks={s.officialConcepts} />
        </Section>
      )}

      {s.visualExplanation && (
        <Section title="Visual explanation">
          {s.visualExplanation.mermaid && <Mermaid chart={s.visualExplanation.mermaid} />}
          <p className="mt-2 text-sm" style={{ color: "var(--fg-3)" }}>
            {s.visualExplanation.caption}
          </p>
        </Section>
      )}

      {s.sqlServerImplementation && (
        <Section title="Microsoft SQL implementation">
          <Blocks blocks={s.sqlServerImplementation} />
        </Section>
      )}

      {(s.postgresComparison || s.mysqlComparison || s.oracleComparison) && (
        <Section title="Cross-database comparison">
          <div className="flex flex-col gap-4">
            {s.postgresComparison && <Blocks blocks={s.postgresComparison} />}
            {s.mysqlComparison && <Blocks blocks={s.mysqlComparison} />}
            {s.oracleComparison && <Blocks blocks={s.oracleComparison} />}
          </div>
        </Section>
      )}

      {s.sideBySide && (
        <Section title="Side-by-side comparison">
          <p className="mb-3 text-sm" style={{ color: "var(--fg-2)" }}>{s.sideBySide.summary}</p>
          <ComparisonTable cmp={s.sideBySide} />
        </Section>
      )}

      {s.realWorldScenario && (
        <Section title="Real-world scenario">
          <Blocks blocks={s.realWorldScenario} />
        </Section>
      )}

      {lab && (
        <Section title="Guided lab">
          <Card hover className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <FlaskConical size={16} style={{ color: "var(--corgi-orange)" }} />
                  <span className="font-display text-lg font-bold">{lab.title}</span>
                </div>
                <p className="text-sm" style={{ color: "var(--fg-2)" }}>{lab.objective}</p>
              </div>
              <Link href={`/labs/${lab.id}`} className="cc-btn cc-btn-primary shrink-0 text-sm">
                Open lab <ArrowRight size={15} />
              </Link>
            </div>
          </Card>
        </Section>
      )}

      {s.commonMistakes && (
        <Section title="Common mistakes">
          <div className="flex flex-col gap-3">
            {s.commonMistakes.map((m, i) => (
              <div key={i} className="rounded-[12px] p-3" style={{ background: "color-mix(in srgb, var(--danger) 8%, var(--bg-elevated))", border: "1.5px solid color-mix(in srgb, var(--danger) 30%, transparent)" }}>
                <p className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--danger)" }}>
                  <AlertTriangle size={15} /> {m.mistake}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
                  <span className="font-semibold" style={{ color: "var(--success)" }}>Fix: </span>
                  {m.fix}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {s.performanceSecurity && (
        <Section title="Performance & security considerations">
          <div className="flex flex-col gap-3">
            {s.performanceSecurity.map((b, i) => (
              <div key={i} className="rounded-[12px] p-4" style={{ background: "var(--bg-sunken)", borderLeft: "3px solid var(--hub-green)" }}>
                <div className="mb-1 flex items-center gap-2">
                  <ShieldCheck size={15} style={{ color: "var(--hub-green)" }} />
                  <SourceBadge kind={b.kind} />
                </div>
                <Markdown>{b.body}</Markdown>
              </div>
            ))}
          </div>
        </Section>
      )}

      {s.examTips && (
        <Section title="Exam tips">
          <div className="rounded-[16px] p-4" style={{ background: "color-mix(in srgb, var(--star-yellow) 14%, var(--bg-elevated))", border: "1.5px solid color-mix(in srgb, var(--star-yellow) 40%, transparent)" }}>
            <ul className="flex flex-col gap-2">
              {s.examTips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--star-yellow-deep)" }} />
                  <span style={{ color: "var(--fg)" }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* Knowledge check */}
      {kcQuestions.length > 0 && (
        <Section title="Knowledge check">
          <QuizRunner questions={kcQuestions} scope={lesson.moduleId} title="Knowledge check" />
        </Section>
      )}

      {s.summary && (
        <Section title="Summary">
          <Card className="p-4">
            <Markdown>{s.summary}</Markdown>
          </Card>
        </Section>
      )}

      {/* References */}
      <Section title="Official references">
        <ul className="flex flex-col gap-2">
          {lesson.references.map((r, i) => (
            <li key={i}>
              <a href={r.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-sm" style={{ color: "var(--link)" }}>
                <ExternalLink size={14} className="mt-0.5 shrink-0" />
                <span>
                  {r.title} <span style={{ color: "var(--fg-4)" }}>— {r.publisher}, accessed {r.accessed}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <LessonNotes lessonId={lesson.id} lessonTitle={lesson.title} />
      </Section>

      {/* Complete + nav */}
      <div className="flex flex-col gap-4 border-t pt-6" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => markLesson(lesson.id, completed ? "in-progress" : "completed")}
          className="cc-btn mx-auto text-sm"
          style={{
            background: completed ? "var(--bg-sunken)" : "var(--success)",
            color: completed ? "var(--fg-2)" : "#fff",
          }}
        >
          {completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          {completed ? "Completed — mark as in progress" : "Mark lesson complete"}
        </button>

        <div className="flex items-stretch justify-between gap-3">
          {prev ? (
            <Link href={`/learn/${prev.slug}`} className="flex flex-1 items-center gap-2 rounded-[12px] p-3 transition hover:bg-[var(--bg-sunken)]" style={{ border: "1.5px solid var(--border)" }}>
              <ArrowLeft size={16} style={{ color: "var(--fg-3)" }} />
              <span className="min-w-0">
                <span className="block text-xs" style={{ color: "var(--fg-4)" }}>Previous</span>
                <span className="block truncate text-sm font-semibold">{prev.title}</span>
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link href={`/learn/${next.slug}`} className="flex flex-1 items-center justify-end gap-2 rounded-[12px] p-3 text-right transition hover:bg-[var(--bg-sunken)]" style={{ border: "1.5px solid var(--border)" }}>
              <span className="min-w-0">
                <span className="block text-xs" style={{ color: "var(--fg-4)" }}>Next</span>
                <span className="block truncate text-sm font-semibold">{next.title}</span>
              </span>
              <ArrowRight size={16} style={{ color: "var(--fg-3)" }} />
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </div>
      </div>
    </article>
  );
}
