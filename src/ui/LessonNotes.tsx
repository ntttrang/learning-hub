import { Save, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSubjectDataStore } from '../engines/subject-store';
import { Button } from './Button';

interface LessonNotesProps {
  subjectId: string;
  lessonId: string;
  lessonTitle: string;
}

/**
 * One note per lesson, ported from dp-800's NotesPanel. The textarea always
 * shows the saved body (or the empty draft); Save commits, and committing an
 * empty body deletes the note — same semantics as the donor. Save is disabled
 * until there are unsaved edits, so a reload never loses anything silently.
 */
export function LessonNotes({ subjectId, lessonId, lessonTitle }: LessonNotesProps) {
  // Selector law: read the stored array, default at the use site.
  const notes = useSubjectDataStore((s) => s.subjects[subjectId]?.notes);
  const upsertNote = useSubjectDataStore((s) => s.upsertNote);
  const deleteNote = useSubjectDataStore((s) => s.deleteNote);

  const existing = (notes ?? []).find((note) => note.lessonId === lessonId);
  const [draft, setDraft] = useState<string | null>(null);
  const body = draft ?? existing?.body ?? '';

  const save = () => {
    if (!body.trim()) {
      if (existing) deleteNote(subjectId, existing.id);
      setDraft(null);
      return;
    }
    upsertNote(subjectId, {
      id: existing?.id ?? `note-${lessonId}`,
      lessonId,
      title: lessonTitle,
      body,
      updated: new Date().toISOString(),
    });
    setDraft(null);
  };

  return (
    <section className="lesson-notes" aria-label="Your notes">
      <h3 className="lesson-check-title">
        <StickyNote size={16} strokeWidth={1.75} aria-hidden="true" /> Your notes
      </h3>
      <textarea
        value={body}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Jot down anything you want to remember from this lesson…"
        rows={4}
        aria-label={`Notes for ${lessonTitle}`}
      />
      <div className="lesson-notes-actions">
        <Button icon={Save} onClick={save} disabled={draft === null}>
          Save note
        </Button>
        {existing && (
          <Button
            variant="ghost"
            icon={Trash2}
            onClick={() => {
              deleteNote(subjectId, existing.id);
              setDraft(null);
            }}
          >
            Delete
          </Button>
        )}
        {existing && (
          <span className="lesson-notes-stamp">Saved {new Date(existing.updated).toLocaleString()}</span>
        )}
      </div>
    </section>
  );
}
