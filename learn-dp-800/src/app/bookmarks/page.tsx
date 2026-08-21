"use client";

import { Link } from "@/components/Link";
import { Bookmark, ArrowRight, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { getLesson, getModule, getDomain } from "@/lib/content";
import { Card, DifficultyBadge } from "@/components/ui";

export default function BookmarksPage() {
  const hydrated = useHydrated();
  const bookmarks = useStore((s) => s.bookmarks);
  const toggleBookmark = useStore((s) => s.toggleBookmark);

  const lessons = hydrated ? bookmarks.map((id) => getLesson(id)).filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <Bookmark size={24} style={{ color: "var(--accent)" }} /> Bookmarks
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
          Lessons you&apos;ve saved to revisit. Bookmark any lesson from its header.
        </p>
      </header>

      {lessons.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>No bookmarks yet.</p>
          <Link href="/learn" className="cc-btn cc-btn-primary mx-auto mt-4 text-sm">Browse lessons</Link>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lessons.map((l) => {
            if (!l) return null;
            const module = getModule(l.moduleId);
            const domain = getDomain(l.domainId);
            return (
              <Card key={l.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/learn/${l.slug}`} className="min-w-0">
                    <p className="text-xs" style={{ color: "var(--fg-4)" }}>{domain?.code} · {module?.title}</p>
                    <h2 className="font-display text-base font-bold">{l.title}</h2>
                  </Link>
                  <button onClick={() => toggleBookmark(l.id)} aria-label="Remove bookmark" style={{ color: "var(--accent)" }}>
                    <Bookmark size={16} style={{ fill: "var(--accent)" }} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <DifficultyBadge tier={l.difficulty} />
                  <span className="cc-chip" style={{ color: "var(--fg-3)" }}><Clock size={12} /> {l.estimatedMinutes}m</span>
                  <Link href={`/learn/${l.slug}`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--link)" }}>
                    Open <ArrowRight size={13} />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
