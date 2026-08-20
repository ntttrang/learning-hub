import { BookOpen, BookmarkCheck, StickyNote, Trash2 } from 'lucide-react';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectIndex } from '../content/registry';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Pill } from './Pill';

interface NotesProps {
  subjectId: string;
  index: SubjectIndex;
}

/**
 * The Notes tab — a pure projection of the subject's user data joined against
 * the index. Every note links back to its lesson, every bookmark links into
 * Learn with an un-bookmark action; both sections degrade to honest empty
 * states instead of hiding.
 */
export function Notes({ subjectId, index }: NotesProps) {
  // Selector law: read the stored arrays, default at the use site.
  const notes = useSubjectDataStore((s) => s.subjects[subjectId]?.notes);
  const bookmarks = useSubjectDataStore((s) => s.subjects[subjectId]?.bookmarks);
  const deleteNote = useSubjectDataStore((s) => s.deleteNote);
  const toggleBookmark = useSubjectDataStore((s) => s.toggleBookmark);

  const noteList = notes ?? [];
  // Unknown ids (a lesson removed from a pack) degrade away rather than
  // rendering an orphan card.
  const bookmarkedLessons = (bookmarks ?? []).flatMap((lessonId) => {
    const lesson = index.getLesson(lessonId);
    return lesson ? [lesson] : [];
  });

  return (
    <div className="notes-tab">
      <section className="notes-section" aria-label="Your notes">
        <h3 className="lesson-check-title">
          <StickyNote size={16} strokeWidth={1.75} aria-hidden="true" /> Your notes
        </h3>
        {noteList.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title="No notes yet"
            message="Open any lesson, scroll to Your notes, and jot down what you want to remember."
          >
            <Button href={`#/subject/${subjectId}/learn`} variant="secondary">
              Browse lessons
            </Button>
          </EmptyState>
        ) : (
          <ul className="notes-list">
            {noteList.map((note) => {
              const lesson = note.lessonId ? index.getLesson(note.lessonId) : undefined;
              return (
                <li key={note.id} className="notes-card">
                  <div className="notes-card-head">
                    <h4 className="notes-card-title">{note.title}</h4>
                    <button
                      type="button"
                      className="notes-icon-btn"
                      aria-label={`Delete note for ${note.title}`}
                      onClick={() => deleteNote(subjectId, note.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="notes-card-body">{note.body}</p>
                  <div className="notes-card-meta">
                    {lesson && (
                      <a
                        className="notes-lesson-link"
                        href={`#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}`}
                      >
                        <BookOpen size={13} aria-hidden="true" /> {lesson.title}
                      </a>
                    )}
                    <span>Saved {new Date(note.updated).toLocaleString()}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="notes-section" aria-label="Bookmarks">
        <h3 className="lesson-check-title">
          <BookmarkCheck size={16} strokeWidth={1.75} aria-hidden="true" /> Bookmarks
        </h3>
        {bookmarkedLessons.length === 0 ? (
          <EmptyState
            icon={BookmarkCheck}
            title="No bookmarks yet"
            message="Bookmark any lesson from its header — it will show up here for a quick revisit."
          >
            <Button href={`#/subject/${subjectId}/learn`} variant="secondary">
              Browse lessons
            </Button>
          </EmptyState>
        ) : (
          <ul className="notes-bm-grid">
            {bookmarkedLessons.map((lesson) => {
              const domain = index.getDomain(lesson.domainId);
              return (
                <li key={lesson.id} className="notes-bm-card">
                  <div className="notes-card-head">
                    <a
                      className="notes-bm-link"
                      href={`#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}`}
                    >
                      {domain && <span className="notes-bm-crumb">{domain.code ?? domain.title}</span>}
                      <span className="notes-bm-title">{lesson.title}</span>
                    </a>
                    <button
                      type="button"
                      className="chip-toggle on"
                      aria-pressed={true}
                      aria-label={`Remove bookmark for ${lesson.title}`}
                      onClick={() => toggleBookmark(subjectId, lesson.id)}
                    >
                      <BookmarkCheck size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="notes-card-meta">
                    <Pill>{lesson.minutes} min</Pill>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
