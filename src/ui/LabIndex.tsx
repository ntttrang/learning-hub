import { Check, FlaskConical } from 'lucide-react';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import { EmptyState } from './EmptyState';
import { Pill } from './Pill';

interface LabIndexProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
}

/**
 * Lab landing page: one card per lab with its state and a back-link to the
 * lesson it belongs to. Cards are divs (not anchors) so the title link and
 * the lesson link can coexist without nesting <a> inside <a>.
 */
export function LabIndex({ subjectId, content, index }: LabIndexProps) {
  // Select the stored array itself — `?? []` here would mint a new reference
  // per snapshot and loop useSyncExternalStore before any lab is completed.
  const completedLabs = useSubjectDataStore((s) => s.subjects[subjectId]?.completedLabs);

  if (content.labs.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No labs in this pack yet"
        message="This subject ships no hands-on labs — the mode stays honest about it until content lands."
      />
    );
  }

  return (
    <div className="lab-grid">
      {content.labs.map((lab) => {
        const done = completedLabs?.includes(lab.id) ?? false;
        const lesson = lab.lessonId ? index.getLesson(lab.lessonId) : undefined;
        return (
          <div key={lab.id} className={`lab-card${done ? ' done' : ''}`}>
            <div className="lab-card-head">
              <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
              <h3 className="lab-card-title">
                <a href={`#/subject/${subjectId}/labs/${lab.id}`}>{lab.title}</a>
              </h3>
            </div>
            <p>{lab.summary}</p>
            <div className="lab-card-meta">
              {done ? (
                <Pill tone="success" icon={Check}>
                  Completed
                </Pill>
              ) : (
                <Pill>{lab.minutes} min</Pill>
              )}
              {lab.difficulty && <Pill tone="accent">{lab.difficulty}</Pill>}
              {lesson && (
                <a
                  className="lab-lesson-link"
                  href={`#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}`}
                >
                  Lesson: {lesson.title}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
