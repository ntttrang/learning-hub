import { ArrowRight, ClipboardList, Clock, GraduationCap, History } from 'lucide-react';
import { assemblePaper } from '../engines/exam-paper';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import type { Exam, ExamAttempt } from '../sdk/types';
import { EmptyState } from './EmptyState';

interface ExamIndexProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
}

/**
 * The exams landing: one card per exam in the pack (duration, question count,
 * pass mark, selection kind) over a consolidated attempt history — newest
 * first, each row linking straight to that attempt's review.
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
  // review link stays stable against the array it was read from. Attempts for
  // exams no longer in the pack render nothing.
  const examById = new Map(content.exams.map((exam) => [exam.id, exam]));
  const history = (examAttempts ?? []).flatMap((attempt, absIndex) =>
    attempt.examId && examById.has(attempt.examId)
      ? [{ attempt, absIndex, exam: examById.get(attempt.examId)! }]
      : [],
  );

  return (
    <div className="exam-index">
      <header className="exam-head">
        <h2 className="exam-title">Mock exams</h2>
        <p className="exam-lead">
          Sit a mock, get the certification-scale verdict, then walk the review.
        </p>
      </header>

      <div className="exam-grid">
        {content.exams.map((exam) => (
          <ExamCard
            key={exam.id}
            subjectId={subjectId}
            exam={exam}
            paperSize={assemblePaper(content, exam).length}
          />
        ))}
      </div>

      <div className="exam-card">
        <h3 className="exam-history-head">
          <History size={18} strokeWidth={2} aria-hidden="true" /> Attempt history
        </h3>
        {history.length === 0 ? (
          <p className="exam-history-empty">
            No attempts yet — take an exam to build your history.
          </p>
        ) : (
          <ul className="exam-history">
            {history.map((row) => (
              <AttemptRow key={row.attempt.id} subjectId={subjectId} {...row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ExamCard({
  subjectId,
  exam,
  paperSize,
}: {
  subjectId: string;
  exam: Exam;
  paperSize: number;
}) {
  return (
    <div className="exam-card exam-card-hover">
      <div className="exam-card-head">
        <GraduationCap size={20} strokeWidth={2} aria-hidden="true" />
        <h3 className="exam-card-title">{exam.title}</h3>
      </div>
      <p className="exam-card-desc">
        {exam.description ?? `A ${exam.durationMinutes}-minute mock exam.`}
      </p>
      <div className="exam-chips">
        <span className="exam-chip">{paperSize} questions</span>
        <span className="exam-chip">
          <Clock size={12} strokeWidth={2} aria-hidden="true" /> {exam.durationMinutes} min
        </span>
        <span className="exam-chip">Pass {exam.passingScore ?? 700}/1000</span>
        {exam.caseStudies && exam.caseStudies.length > 0 && (
          <span className="exam-chip">Case study</span>
        )}
        <span className="exam-chip">
          {exam.selection.kind === 'sampled' ? 'Sampled' : 'Fixed'}
        </span>
      </div>
      <a className="exam-start" href={`#/subject/${subjectId}/exams/${exam.id}`}>
        Start exam <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
      </a>
    </div>
  );
}

function AttemptRow({
  subjectId,
  attempt,
  exam,
  absIndex,
}: {
  subjectId: string;
  attempt: ExamAttempt;
  exam: Exam;
  absIndex: number;
}) {
  return (
    <li>
      <a
        className="exam-history-row"
        href={`#/subject/${subjectId}/exams/${attempt.examId}/review/${absIndex}`}
      >
        <span className="exam-history-title">
          {exam.title}
          <span className="exam-history-meta">
            {new Date(attempt.date).toLocaleString()} ·{' '}
            {attempt.timed ? 'Timed' : 'Untimed'}
          </span>
        </span>
        <span className="exam-history-side">
          {attempt.perDomain.length > 0 && (
            <span className="exam-domain-dots">
              {attempt.perDomain.map((domain) => {
                const pct = domain.total ? domain.correct / domain.total : 0;
                return (
                  <span
                    key={domain.domainId}
                    className="exam-domain-dot"
                    title={`${domain.domainId}: ${Math.round(pct * 100)}%`}
                    style={{
                      background: `color-mix(in srgb, var(--accent) ${Math.max(15, pct * 100)}%, var(--border))`,
                    }}
                  />
                );
              })}
            </span>
          )}
          <span
            className={`exam-history-score ${
              attempt.passed ? 'exam-score-pass' : 'exam-score-fail'
            }`}
          >
            {attempt.scaledScore}
          </span>
        </span>
      </a>
    </li>
  );
}
