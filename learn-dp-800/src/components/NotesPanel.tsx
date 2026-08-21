"use client";

import { useState } from "react";
import { StickyNote, Trash2, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";

export function LessonNotes({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const hydrated = useHydrated();
  const notes = useStore((s) => s.notes);
  const upsertNote = useStore((s) => s.upsertNote);
  const deleteNote = useStore((s) => s.deleteNote);

  const existing = hydrated ? notes.find((n) => n.lessonId === lessonId) : undefined;
  const [draft, setDraft] = useState<string | null>(null);
  const body = draft ?? existing?.body ?? "";

  const save = () => {
    const id = existing?.id ?? `note-${lessonId}`;
    if (!body.trim()) {
      if (existing) deleteNote(existing.id);
      setDraft(null);
      return;
    }
    upsertNote({ id, lessonId, title: lessonTitle, body, updated: new Date().toISOString() });
    setDraft(null);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <StickyNote size={16} style={{ color: "var(--star-yellow)" }} />
        <h3 className="font-display text-lg font-bold">Your notes</h3>
      </div>
      <textarea
        value={body}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Jot down anything you want to remember from this lesson..."
        rows={4}
        className="w-full resize-y rounded-[12px] p-3 text-sm outline-none"
        style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)", color: "var(--fg)" }}
      />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={save} disabled={draft === null} className="cc-btn cc-btn-primary text-sm" style={{ opacity: draft === null ? 0.5 : 1 }}>
          <Save size={14} /> Save note
        </button>
        {existing && (
          <button
            onClick={() => {
              deleteNote(existing.id);
              setDraft(null);
            }}
            className="cc-btn cc-btn-ghost text-sm"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
        {existing && <span className="text-xs" style={{ color: "var(--fg-4)" }}>Saved {new Date(existing.updated).toLocaleString()}</span>}
      </div>
    </div>
  );
}
