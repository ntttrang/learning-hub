import { ArrowRight, BookOpen, Check, Star } from 'lucide-react';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import type { Domain, Lesson } from '../sdk/types';
import { EmptyState } from './EmptyState';
import { Pill } from './Pill';

interface LearnIndexProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
}

/** Exam weights arrive as a range string or min/max numbers. */
function weightLabel(weight: NonNullable<Domain['weight']>): string {
  return typeof weight === 'string' ? weight : `${weight.min}–${weight.max}%`;
}

/**
 * Learn landing page: every domain with its modules and lessons, read state
 * straight from the subject store. Structure comes from the index accessors,
 * so it renders any pack without per-subject branches.
 */
export function LearnIndex({ subjectId, content, index }: LearnIndexProps) {
  const data = useSubjectDataStore((s) => s.subjects[subjectId]);
  const lessons = content.lessons;

  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No lessons in this pack yet"
        message="This subject ships no lesson content — the mode stays honest about it until content lands."
      />
    );
  }

  const lessonHref = (lesson: Lesson) =>
    `#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}`;
  const status = (lessonId: string) => data?.lessons[lessonId]?.status;
  const lastLesson = data?.lastLessonId ? index.getLesson(data.lastLessonId) : undefined;
  const domains = [...content.domains].sort((a, b) => a.order - b.order);

  return (
    <div className="learn-index">
      {lastLesson && (
        <a className="continue-card" href={lessonHref(lastLesson)}>
          <span>
            <span className="continue-eyebrow">Continue where you left off</span>
            <span className="continue-title">{lastLesson.title}</span>
          </span>
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </a>
      )}

      {domains.map((domain) => {
        const modules = index.modulesForDomain(domain.id);
        const orphans = index.lessonsForDomain(domain.id).filter((lesson) => !lesson.moduleId);
        if (modules.length === 0 && orphans.length === 0) return null;
        return (
          <section key={domain.id} className="learn-domain" aria-label={domain.title}>
            <header className="learn-domain-head">
              <h3 className="learn-domain-title">{domain.title}</h3>
              {domain.weight && <Pill tone="accent">Weight {weightLabel(domain.weight)}</Pill>}
            </header>

            {modules.map((module) => {
              const moduleLessons = index.lessonsForModule(module.id);
              const questionCount = index.questionsForModule(module.id).length;
              const labCount = moduleLessons.filter((lesson) => lesson.labId).length;
              return (
                <div key={module.id} className="learn-module">
                  <div className="learn-module-head">
                    <h4 className="learn-module-title">{module.title}</h4>
                    <span className="learn-module-meta">
                      {labCount > 0 && `${labCount} lab${labCount === 1 ? '' : 's'} · `}
                      {questionCount} question{questionCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  {module.officialSkills && module.officialSkills.length > 0 && (
                    <ul className="learn-skills">
                      {module.officialSkills.map((skill) => (
                        <li key={skill}>{skill}</li>
                      ))}
                    </ul>
                  )}
                  <ul className="learn-rows">
                    {moduleLessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        href={lessonHref(lesson)}
                        done={status(lesson.id) === 'completed'}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}

            {orphans.length > 0 && (
              <ul className="learn-rows">
                {orphans.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    href={lessonHref(lesson)}
                    done={status(lesson.id) === 'completed'}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson, href, done }: { lesson: Lesson; href: string; done: boolean }) {
  return (
    <li>
      <a className="learn-row" href={href}>
        <span className={`learn-tick${done ? ' done' : ''}`} aria-hidden="true">
          {done && <Check size={13} strokeWidth={2.5} />}
        </span>
        <span className="learn-row-title">
          {lesson.title}
          {lesson.flagship && (
            <Pill tone="warn" icon={Star}>
              Flagship
            </Pill>
          )}
        </span>
        <span className="learn-row-meta">
          {lesson.difficulty && <span>{lesson.difficulty}</span>}
          <span>{lesson.minutes} min</span>
        </span>
      </a>
    </li>
  );
}
