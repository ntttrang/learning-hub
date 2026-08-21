"use client";

import { useState } from "react";
import { Link } from "@/components/Link";
import { GitCompare, ArrowRight } from "lucide-react";
import { LESSONS } from "@/lib/content";
import type { DbComparison } from "@/lib/types";
import { ComparisonTable } from "@/components/Comparison";
import { Card } from "@/components/ui";

interface Entry {
  cmp: DbComparison;
  lessonSlug: string;
  lessonTitle: string;
}

const ENTRIES: Entry[] = LESSONS.filter((l) => l.sections.sideBySide).map((l) => ({
  cmp: l.sections.sideBySide!,
  lessonSlug: l.slug,
  lessonTitle: l.title,
}));

export default function ComparePage() {
  const [active, setActive] = useState(ENTRIES[0]?.cmp.id);
  const current = ENTRIES.find((e) => e.cmp.id === active);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <GitCompare size={26} style={{ color: "var(--accent)" }} /> Cross-database comparison
        </h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--fg-2)" }}>
          How Microsoft SQL concepts map to PostgreSQL, MySQL, and Oracle — syntax, capabilities, migration notes, and side-by-side code. Sourced from each engine&apos;s official documentation.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {ENTRIES.map((e) => {
          const on = e.cmp.id === active;
          return (
            <button
              key={e.cmp.id}
              onClick={() => setActive(e.cmp.id)}
              className="rounded-full px-4 py-1.5 text-sm font-bold transition"
              style={{
                background: on ? "var(--accent)" : "var(--bg-sunken)",
                color: on ? "var(--accent-fg)" : "var(--fg-3)",
                border: "1.5px solid " + (on ? "transparent" : "var(--border)"),
              }}
            >
              {e.cmp.concept}
            </button>
          );
        })}
      </div>

      {current && (
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="font-display text-xl font-bold">{current.cmp.concept}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>{current.cmp.summary}</p>
            <Link href={`/learn/${current.lessonSlug}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--link)" }}>
              Full lesson: {current.lessonTitle} <ArrowRight size={13} />
            </Link>
          </Card>
          <ComparisonTable cmp={current.cmp} />
        </div>
      )}
    </div>
  );
}
