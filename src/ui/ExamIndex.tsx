import { ClipboardList } from 'lucide-react';
import { assemblePaper } from '../engines/exam-paper';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import type { Exam, ExamAttempt } from '../sdk/types';
import { EmptyState } from './EmptyState';
import { Pill } from './Pill';

interface ExamIndexProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
}

/**
 * The exams landing: one card per exam in the pack (duration, question count,
 * pass mark, selection kind) with that exam's attempt history underneath —
 * newest first, linking straight to each attempt's review.
 */
export function ExamIndex({ subjectId, content }: ExamIndexProps) {
  // Select the stored array itself — `?? []` here would mint a new reference
  // per snapshot and loop useSyncExternalStore before any exam is attempted.
  const examAttempts = useSubjectDataStore((s) => s.subjects[subjectId]?.examAttempts);

  if (content.exams.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No exams in this pack yet"
        message="This subject ships no mock exams — the mode stays honest about it until content lands."
      />
    );
  }

  // Attempts are stored newest-first; keep each one's absolute index so its
  // review link stays stable against the array it was read from.
  const history = (examAttempts ?? []).flatMap((attempt, absIndex) =>
    attempt.examId ? [{ attempt, absIndex }] : [],
  );

  return (
    <div className="exam-index">
      <p className="practice-lead">
        Sit a mock, get the certification-scale verdict, then walk the review.
      </p>
      <div className="practice-grid">
        {content.exams.map((exam) => (
          <ExamCard
            key={exam.id}
            subjectId={subjectId}
            exam={exam}
            paperSize={assemblePaper(content, exam).length}
            history={history.filter((row) => row.attempt.examId === exam.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ExamCard({
  subjectId,
  exam,
  paperSize,
  history,
}: {
  subjectId: string;
  exam: Exam;
  paperSize: number;
  history: { attempt: ExamAttempt; absIndex: number }[];
}) {
  return (
    <div className="exam-card">
      <a className="practice-card" href={`#/subject/${subjectId}/exams/${exam.id}`}>
        <div className="practice-card-head">
          <h3 className="practice-card-title">{exam.title}</h3>
          <Pill tone="accent">{exam.selection.kind === 'sampled' ? 'Sampled' : 'Fixed'}</Pill>
        </div>
        <p>{exam.description ?? `A ${exam.durationMinutes}-minute mock exam.`}</p>
        <div className="lesson-chips">
          <Pill>{paperSize} questions</Pill>
          <Pill>{exam.durationMinutes} min</Pill>
          <Pill>Pass {exam.passingScore ?? 700}</Pill>
        </div>
      </a>

      {history.length > 0 && (
        <ul className="exam-history">
          {history.map(({ attempt, absIndex }) => (
            <li key={attempt.id} className="exam-history-row">
              <Pill tone={attempt.passed ? 'success' : 'danger'}>
                {attempt.scaledScore}/1000
              </Pill>
              <span className="exam-history-meta">
                {new Date(attempt.date).toLocaleDateString()} ·{' '}
                {attempt.timed ? 'Timed' : 'Untimed'}
              </span>
              <a
                className="exam-history-link"
                href={`#/subject/${subjectId}/exams/${exam.id}/review/${absIndex}`}
              >
                Review
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
