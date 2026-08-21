"use client";

import { Link } from "@/components/Link";
import { CheckCircle2, Circle, Clock, Star } from "lucide-react";
import {
  DOMAINS,
  modulesForDomain,
  lessonsForModule,
  lessonsForDomain,
} from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { Card, DifficultyBadge, Bar } from "@/components/ui";

export default function LearnPage() {
  const hydrated = useHydrated();
  const lessons = useStore((s) => s.lessons);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Curriculum</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
          The full DP-800 skills outline, organized into three official domains. Flagship lessons (marked with a star) include deep cross-database comparisons and a hands-on lab.
        </p>
      </header>

      {DOMAINS.map((d) => {
        const dl = lessonsForDomain(d.id);
        const done = hydrated ? dl.filter((l) => lessons[l.id]?.status === "completed").length : 0;
        return (
          <section key={d.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
                <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: `var(${d.accent})` }} />
                {d.code}: {d.title}
              </h2>
              <span className="cc-chip" style={{ color: "var(--fg-3)" }}>
                {d.weight} of exam · {done}/{dl.length} done
              </span>
            </div>
            <p className="mb-3 max-w-3xl text-sm" style={{ color: "var(--fg-2)" }}>
              {d.summary}
            </p>
            <div className="mb-4 max-w-md">
              <Bar value={dl.length ? done / dl.length : 0} color={`var(${d.accent})`} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {modulesForDomain(d.id).map((m) => {
                const ml = lessonsForModule(m.id);
                const mDone = hydrated ? ml.filter((l) => lessons[l.id]?.status === "completed").length : 0;
                return (
                  <Card key={m.id} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">
                        {m.code} · {m.title}
                      </h3>
                      <span className="text-xs font-semibold" style={{ color: "var(--fg-3)" }}>
                        {mDone}/{ml.length}
                      </span>
                    </div>
                    <p className="mb-3 text-sm" style={{ color: "var(--fg-2)" }}>
                      {m.summary}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {ml.map((l) => {
                        const status = hydrated ? lessons[l.id]?.status : undefined;
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/learn/${l.slug}`}
                              className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 transition hover:bg-[var(--bg-sunken)]"
                            >
                              {status === "completed" ? (
                                <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                              ) : (
                                <Circle size={16} style={{ color: "var(--fg-4)" }} />
                              )}
                              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                                {l.title}
                                {l.flagship && (
                                  <Star size={12} className="ml-1 inline" style={{ color: "var(--star-yellow)", fill: "var(--star-yellow)" }} />
                                )}
                              </span>
                              <span className="hidden items-center gap-1 text-xs sm:flex" style={{ color: "var(--fg-4)" }}>
                                <Clock size={12} /> {l.estimatedMinutes}m
                              </span>
                              <DifficultyBadge tier={l.difficulty} />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
