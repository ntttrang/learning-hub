"use client";

import { useState } from "react";
import { Link } from "@/components/Link";
import {
  FlaskConical,
  CheckCircle2,
  Circle,
  Lightbulb,
  Eye,
  Database,
  ListChecks,
  BookOpen,
  Target,
} from "lucide-react";
import type { Lab } from "@/lib/types";
import { ENGINE_LABELS } from "@/lib/types";
import { getLesson } from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { Markdown } from "./Markdown";
import { SqlBlock } from "./SqlBlock";
import { Card, DifficultyBadge } from "./ui";

export function LabViewer({ lab }: { lab: Lab }) {
  const hydrated = useHydrated();
  const completedLabs = useStore((s) => s.completedLabs);
  const completeLab = useStore((s) => s.completeLab);
  const done = hydrated && completedLabs.includes(lab.id);
  const lesson = lab.lessonId ? getLesson(lab.lessonId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/labs" className="text-xs font-semibold hover:underline" style={{ color: "var(--fg-3)" }}>
          ← All labs
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical size={22} style={{ color: "var(--corgi-orange)" }} />
          <h1 className="font-display text-3xl font-bold">{lab.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge tier={lab.difficulty} />
          <span className="cc-chip" style={{ color: "var(--fg-3)" }}>~{lab.estimatedMinutes} min</span>
          {lesson && (
            <Link href={`/learn/${lesson.slug}`} className="cc-chip" style={{ color: "var(--link)" }}>
              <BookOpen size={12} /> {lesson.title}
            </Link>
          )}
        </div>
      </header>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Target size={16} style={{ color: "var(--accent)" }} />
          <h2 className="font-display text-lg font-bold">Scenario & objective</h2>
        </div>
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>{lab.scenario}</p>
        <p className="mt-2 text-sm font-semibold">{lab.objective}</p>
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>Prerequisites</p>
          <ul className="mt-1 list-disc pl-5 text-sm" style={{ color: "var(--fg-2)" }}>
            {lab.prerequisites.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
          <p className="mt-2 text-xs" style={{ color: "var(--fg-4)" }}>
            Runs on: {lab.engines.map((e) => ENGINE_LABELS[e]).join(", ")}
          </p>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-bold">
          <Database size={18} style={{ color: "var(--sky-cyan)" }} /> Schema & sample data
        </h2>
        <div className="flex flex-col gap-3">
          <SqlBlock code={lab.schemaSql} engine="sqlserver" label="Schema (SQL Server)" />
          <SqlBlock code={lab.seedSql} engine="sqlserver" label="Sample data" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Steps</h2>
        <div className="flex flex-col gap-4">
          {lab.steps.map((step, i) => (
            <LabStepCard key={i} step={step} index={i} />
          ))}
        </div>
      </section>

      {lab.engineNotes && (
        <section>
          <h2 className="mb-2 font-display text-xl font-bold">Other databases</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(lab.engineNotes).map(([engine, note]) => (
              <div key={engine} className="rounded-[12px] p-3" style={{ background: "var(--bg-sunken)" }}>
                <p className="mb-1 text-sm font-bold">{ENGINE_LABELS[engine as keyof typeof ENGINE_LABELS]}</p>
                <p className="text-sm" style={{ color: "var(--fg-2)" }}>{note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-display text-xl font-bold">Solution explanation</h2>
        <Card className="p-4">
          <Markdown>{lab.solutionExplanation}</Markdown>
        </Card>
      </section>

      <div className="border-t pt-6 text-center" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => completeLab(lab.id, lab.domainId)}
          disabled={done}
          className="cc-btn mx-auto text-sm"
          style={{ background: done ? "var(--bg-sunken)" : "var(--success)", color: done ? "var(--fg-2)" : "#fff", opacity: done ? 0.8 : 1 }}
        >
          {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          {done ? "Lab completed" : "Mark lab complete"}
        </button>
      </div>
    </div>
  );
}

function LabStepCard({ step, index }: { step: import("@/lib/types").LabStep; index: number }) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          {index + 1}
        </span>
        <h3 className="font-display text-lg font-bold">{step.title}</h3>
      </div>

      <Markdown>{step.instructions}</Markdown>

      {step.starterSql && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>Starter SQL</p>
          <SqlBlock code={step.starterSql} engine="sqlserver" />
        </div>
      )}

      {step.expectedOutput && (
        <div className="mt-3 rounded-[12px] p-3" style={{ background: "var(--bg-sunken)" }}>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-4)" }}>Expected output</p>
          <Markdown>{step.expectedOutput}</Markdown>
        </div>
      )}

      {step.validation && (
        <div className="mt-3 flex items-start gap-2 rounded-[12px] p-3" style={{ background: "color-mix(in srgb, var(--hub-green) 10%, var(--bg-elevated))" }}>
          <ListChecks size={15} className="mt-0.5 shrink-0" style={{ color: "var(--hub-green)" }} />
          <div className="text-sm" style={{ color: "var(--fg-2)" }}>
            <span className="font-semibold">Validation: </span>
            {step.validation}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {step.hint && (
          <button onClick={() => setShowHint((v) => !v)} className="cc-btn cc-btn-ghost text-sm">
            <Lightbulb size={14} /> {showHint ? "Hide hint" : "Show hint"}
          </button>
        )}
        {step.solution && (
          <button onClick={() => setShowSolution((v) => !v)} className="cc-btn cc-btn-ghost text-sm">
            <Eye size={14} /> {showSolution ? "Hide solution" : "Reveal solution"}
          </button>
        )}
      </div>

      {showHint && step.hint && (
        <div className="mt-2 rounded-[12px] p-3 cc-rise" style={{ background: "color-mix(in srgb, var(--star-yellow) 14%, var(--bg-elevated))" }}>
          <p className="text-sm" style={{ color: "var(--fg-2)" }}>{step.hint}</p>
        </div>
      )}
      {showSolution && step.solution && (
        <div className="mt-2 cc-rise">
          <SqlBlock code={step.solution} engine="sqlserver" label="Solution" />
        </div>
      )}
    </Card>
  );
}
