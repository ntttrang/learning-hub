import { Bookmark, BookmarkCheck, BookOpen, Check, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { Fragment, useEffect, useMemo } from 'react';
import { useSubjectDataStore } from '../engines/subject-store';
import { renderBlock } from '../sdk/registry/blocks';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import { Button } from './Button';
import { DocLinkChips, resolvableDocLinks, useDocResolver } from './doc-context';
import { EmptyState } from './EmptyState';
import { isExternalUrl } from './external-url';
import { LessonNotes } from './LessonNotes';
import { Pill } from './Pill';
import { QuizRunner } from './QuizRunner';

interface LessonViewerProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
  /** Route segment: lesson slug or id. */
  id: string;
}

/**
 * One lesson: registry-rendered blocks, knowledge check, references, and the
 * reading-state actions. Richness lives in the block stream — this viewer
 * stays generic on purpose; specialized sections return as registered kinds.
 */
export function LessonViewer({ subjectId, index, id }: LessonViewerProps) {
  const data = useSubjectDataStore((s) => s.subjects[subjectId]);
  const visitLesson = useSubjectDataStore((s) => s.visitLesson);
  const markLesson = useSubjectDataStore((s) => s.markLesson);
  const toggleBookmark = useSubjectDataStore((s) => s.toggleBookmark);
  const resolveDoc = useDocResolver();

  const lesson = index.getLessonBySlug(id) ?? index.getLesson(id);
  const slug = lesson ? (lesson.slug ?? lesson.id) : undefined;

  useEffect(() => {
    if (lesson) visitLesson(subjectId, lesson.id);
  }, [visitLesson, subjectId, lesson]);

  // Stable bank identity for the knowledge check: getQuestions mints a fresh
  // array per call, and QuizRunner reshuffles when `questions` changes — a
  // bookmark toggle must never swap the question mid-run.
  const checkQuestions = useMemo(
    () => index.getQuestions(lesson?.questionIds ?? []),
    [index, lesson],
  );

  if (!lesson || !slug) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No such lesson"
        message={`We could not find a lesson called "${id}". Pick one from the Learn index instead.`}
      >
        <Button href={`#/subject/${subjectId}/learn`} variant="secondary">
          Back to Learn
        </Button>
      </EmptyState>
    );
  }

  const domain = index.getDomain(lesson.domainId);
  const module = lesson.moduleId ? index.getModule(lesson.moduleId) : undefined;
  const lab = lesson.labId ? index.getLab(lesson.labId) : undefined;
  const { prev, next } = index.adjacentLessons(lesson.id);
  const progress = data?.lessons[lesson.id];
  const completed = progress?.status === 'completed';
  const bookmarked = (data?.bookmarks ?? []).includes(lesson.id);
  // Only links that survive the single-href policy count toward the section —
  // a header over nothing is the empty-section defect plain labs already ban.
  const externalRefs = (lesson.references ?? []).filter((ref) => isExternalUrl(ref.url));
  const resolvableDocs = resolvableDocLinks(lesson.docIds, resolveDoc);

  return (
    <article className="lesson">
      <a className="back-link" href={`#/subject/${subjectId}/learn`}>
        ← All lessons
      </a>

      <header className="lesson-head">
        <nav className="lesson-crumbs" aria-label="Breadcrumb">
          {domain && <span>{domain.title}</span>}
          {domain && module && <span aria-hidden="true"> / </span>}
          {module && <span>{module.title}</span>}
        </nav>
        <h2 className="lesson-title">{lesson.title}</h2>
        {lesson.summary && <p className="lesson-summary">{lesson.summary}</p>}
        <div className="lesson-chips">
          {lesson.difficulty && <Pill tone="accent">{lesson.difficulty}</Pill>}
          <Pill>{lesson.minutes} min</Pill>
          {lesson.flagship && <Pill tone="warn">Flagship depth</Pill>}
          <button
            type="button"
            className={`chip-toggle${bookmarked ? ' on' : ''}`}
            aria-pressed={bookmarked}
            onClick={() => toggleBookmark(subjectId, lesson.id)}
          >
            {bookmarked ? <BookmarkCheck size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />}
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        </div>
      </header>

      <div className="lesson-body">
        {lesson.blocks.map((block, blockIndex) => (
          <Fragment key={blockIndex}>{renderBlock(block)}</Fragment>
        ))}
      </div>

      {lab && (
        <a className="lesson-lab-card" href={`#/subject/${subjectId}/labs/${lab.id}`}>
          <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>
            <strong>Lab:</strong> {lab.title} · {lab.minutes} min
          </span>
        </a>
      )}

      {checkQuestions.length > 0 && (
        <section className="lesson-check" aria-label="Knowledge check">
          <h3 className="lesson-check-title">Knowledge check</h3>
          <QuizRunner
            subjectId={subjectId}
            scope={lesson.moduleId ?? 'review'}
            questions={checkQuestions}
            title="Knowledge check"
            backHref={null}
            index={index}
          />
        </section>
      )}

      {(externalRefs.length > 0 || resolvableDocs.length > 0) && (
        <section className="lesson-refs" aria-label="References">
          <h3 className="lesson-check-title">References</h3>
          {externalRefs.length > 0 && (
            <ul className="lesson-ref-list">
              {/* Single href policy: only http(s) references become links. */}
              {externalRefs.map((ref) => (
                <li key={ref.url}>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer">
                    {ref.title}
                  </a>
                  {ref.publisher && <span className="lesson-ref-meta"> · {ref.publisher}</span>}
                </li>
              ))}
            </ul>
          )}
          <DocLinkChips docIds={lesson.docIds} />
        </section>
      )}

      {/* Keyed per lesson: the learn path stays mounted across lesson hops, so
          without the key an unsaved draft would bleed into the next lesson. */}
      <LessonNotes key={lesson.id} subjectId={subjectId} lessonId={lesson.id} lessonTitle={lesson.title} />

      <footer className="lesson-actions">
        {completed ? (
          <>
            <span className="done-flag">
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
              Completed
              {progress?.lastVisited ? ` on ${new Date(progress.lastVisited).toLocaleDateString()}` : ''}
            </span>
            <Button variant="secondary" onClick={() => markLesson(subjectId, lesson.id, 'in-progress')}>
              Mark as in progress
            </Button>
          </>
        ) : (
          <Button onClick={() => markLesson(subjectId, lesson.id, 'completed')}>
            Mark as completed
          </Button>
        )}
        <nav className="block-nav" aria-label="Lesson navigation">
          {prev ? (
            <a className="block-nav-link" href={`#/subject/${subjectId}/learn/${prev.slug ?? prev.id}`}>
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>
                <small>Previous</small>
                {prev.title}
              </span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a
              className="block-nav-link block-nav-next"
              href={`#/subject/${subjectId}/learn/${next.slug ?? next.id}`}
            >
              <span>
                <small>Next</small>
                {next.title}
              </span>
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </a>
          ) : (
            <span />
          )}
        </nav>
      </footer>
    </article>
  );
}
