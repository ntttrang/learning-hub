"use client";

import { Link } from "@/components/Link";
import { StickyNote, Trash2, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { getLesson } from "@/lib/content";
import { Card } from "@/components/ui";

export default function NotesPage() {
  const hydrated = useHydrated();
  const notes = useStore((s) => s.notes);
  const deleteNote = useStore((s) => s.deleteNote);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <StickyNote size={24} style={{ color: "var(--star-yellow)" }} /> Notes
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
          Everything you&apos;ve jotted down, saved locally in your browser. Open a lesson to add or edit its note.
        </p>
      </header>

      {!hydrated || notes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>
            No notes yet. Add notes at the bottom of any lesson.
          </p>
          <Link href="/learn" className="cc-btn cc-btn-primary mx-auto mt-4 text-sm">Browse lessons</Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((n) => {
            const lesson = n.lessonId ? getLesson(n.lessonId) : undefined;
            return (
              <Card key={n.id} className="p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">{n.title}</h2>
                  <button onClick={() => deleteNote(n.id)} aria-label="Delete note" className="rounded-md p-1" style={{ color: "var(--fg-3)" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-sm" style={{ color: "var(--fg-2)" }}>{n.body}</p>
                <div className="mt-2 flex items-center justify-between">
                  {lesson && (
                    <Link href={`/learn/${lesson.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--link)" }}>
                      <BookOpen size={13} /> {lesson.title}
                    </Link>
                  )}
                  <span className="text-xs" style={{ color: "var(--fg-4)" }}>{new Date(n.updated).toLocaleString()}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
