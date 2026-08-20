import { ClipboardList } from 'lucide-react';
import { useMemo } from 'react';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import { assemblePaper } from '../engines/exam-paper';
import { useSubjectDataStore } from '../engines/subject-store';
import { KIND_LABELS, renderQuestion } from '../sdk/registry/questions';
import type { Domain, Question, QuestionKind } from '../sdk/types';
import { BreakdownBar } from './BreakdownBar';
import { Button } from './Button';
import { useDocResolver } from './doc-context';
import { EmptyState } from './EmptyState';
import { formatClock } from './ExamEngine';
import { isExternalUrl } from './external-url';
import { Markdown } from './Markdown';
import { Pill } from './Pill';

/** Official weight caption: "35-40%" verbatim, or a min/max range rendered. */
function weightCaption(weight: Domain['weight']): string | undefined {
  if (!weight) return undefined;
  return typeof weight === 'string' ? weight : `${weight.min}–${weight.max}%`;
}

interface ExamReviewProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
  /** Route segment: exam id. */
  examId: string;
  /** Route segment: absolute index into the subject's stored attempts. */
  attemptIndex?: string;
}

/**
 * One attempt's review: the verdict on the certification scale, per-domain
 * breakdowns against the official weights, and a question-by-question replay
 * of the exact deterministic paper with the learner's answers marked. The
 * paper is re-derived, never stored — same seed, same bank, same questions.
 */
export function ExamReview({ subjectId, content, index, examId, attemptIndex }: ExamReviewProps) {
  const resolveDoc = useDocResolver();
  // Select the stored array itself — `?? []` here would mint a new reference
  // per snapshot and loop useSyncExternalStore before any exam is attempted.
  const attempts = useSubjectDataStore((s) => s.subjects[subjectId]?.examAttempts);

  const exam = index.getExam(examId);
  // Route indexes are strings; anything that is not a real index into this
  // subject's stored attempts (or points at another exam's attempt) renders
  // the honest empty state instead of a fabricated review.
  const parsedIndex = Number(attemptIndex);
  const attempt =
    attempts !== undefined &&
    Number.isInteger(parsedIndex) &&
    parsedIndex >= 0 &&
    parsedIndex < attempts.length
      ? attempts[parsedIndex]
      : undefined;
  const owned = attempt !== undefined && attempt.examId === examId ? attempt : undefined;

  const paper = useMemo(
    () => (exam && owned ? assemblePaper(content, exam) : []),
    [content, exam, owned],
  );

  if (!exam) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No such exam"
        message={`We could not find an exam called "${examId}". Pick one from the exams index instead.`}
      >
        <Button href={`#/subject/${subjectId}/exams`} variant="secondary">
          Back to exams
        </Button>
      </EmptyState>
    );
  }

  if (!owned) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No such attempt"
        message={`There is no recorded attempt #${attemptIndex ?? ''} for ${exam.title}. Sit the exam first, or pick an attempt from the history under its card.`}
      >
        <Button href={`#/subject/${subjectId}/exams`} variant="secondary">
          Back to exams
        </Button>
      </EmptyState>
    );
  }

  const correctCount = owned.results.filter((result) => result.correct).length;
  const verdicts = new Map(owned.results.map((result) => [result.questionId, result.correct]));
  const domainById = new Map(content.domains.map((domain) => [domain.id, domain] as const));

  return (
    <article className="exam-review">
      <a className="back-link" href={`#/subject/${subjectId}/exams`}>
        ← All exams
      </a>

      <header className={`exam-verdict${owned.passed ? ' passed' : ' failed'}`}>
        <span className="caption">{exam.title}</span>
        <p className="exam-verdict-score">
          {owned.scaledScore}
          <span className="exam-verdict-out">/1000</span>
        </p>
        <Pill tone={owned.passed ? 'success' : 'danger'}>{owned.passed ? 'Passed' : 'Failed'}</Pill>
        <p className="exam-verdict-meta">
          Passing mark {exam.passingScore ?? 700} · {correctCount} of {owned.results.length} correct
          ({Math.round((correctCount / owned.results.length) * 100)}%) ·{' '}
          {formatClock(owned.durationSeconds * 1000)} · {owned.timed ? 'Timed' : 'Untimed'} ·{' '}
          {new Date(owned.date).toLocaleDateString()}
        </p>
        <div className="quiz-actions">
          <Button href={`#/subject/${subjectId}/exams/${exam.id}`}>Sit again</Button>
        </div>
      </header>

      <section aria-label="Score by domain">
        <h3 className="lab-section-title">Score by domain</h3>
        {owned.perDomain.map((row) => {
          const domain = domainById.get(row.domainId);
          return (
            <BreakdownBar
              key={row.domainId}
              label={domain ? `${domain.code ? `${domain.code} · ` : ''}${domain.title}` : row.domainId}
              caption={domain ? weightCaption(domain.weight) : undefined}
              correct={row.correct}
              total={row.total}
            />
          );
        })}
      </section>

      <section aria-label="Question review">
        <h3 className="lab-section-title">Every question</h3>
        <div className="exam-replay">
          {paper.map((question, position) => (
            <ReplayQuestion
              key={question.id}
              subjectId={subjectId}
              index={index}
              resolveDoc={resolveDoc}
              question={question}
              position={position}
              answer={owned.answers[question.id] ?? []}
              correct={verdicts.get(question.id) ?? false}
            />
          ))}
        </div>
      </section>
    </article>
  );
}

/** One replayed question: revealed renderer, verdict, explanation, doc trail. */
function ReplayQuestion({
  subjectId,
  index,
  resolveDoc,
  question,
  position,
  answer,
  correct,
}: {
  subjectId: string;
  index: SubjectIndex;
  resolveDoc: ReturnType<typeof useDocResolver>;
  question: Question;
  position: number;
  answer: string[];
  correct: boolean;
}) {
  const unanswered = answer.length === 0;
  const lesson = question.lessonId ? index.getLesson(question.lessonId) : undefined;
  const docLinks = (question.docIds ?? []).flatMap((docId) => {
    const doc = resolveDoc?.(docId);
    // Same single href policy as prose: registry urls that are not plain
    // http(s) degrade away instead of becoming clickable anchors.
    return doc && isExternalUrl(doc.url) ? [{ docId, doc }] : [];
  });

  return (
    <div className="exam-replay-q">
      <div className="exam-q-head">
        <div className="quiz-meta">
          <Pill>Question {position + 1}</Pill>
          <Pill tone="accent">{KIND_LABELS[question.kind as QuestionKind] ?? question.kind}</Pill>
        </div>
        {unanswered ? (
          <Pill tone="warn">Unanswered</Pill>
        ) : correct ? (
          <Pill tone="success">Correct</Pill>
        ) : (
          <Pill tone="danger">Missed</Pill>
        )}
      </div>

      <div className="quiz-stem">
        <Markdown>{question.prompt}</Markdown>
      </div>

      {renderQuestion(question, answer, () => {}, true, true)}

      <div className="quiz-feedback correct">
        <span className="quiz-feedback-verdict">
          {unanswered ? 'Left blank' : correct ? 'Correct' : 'Not quite'}
        </span>
        <Markdown>{question.explanation}</Markdown>
        {(docLinks.length > 0 || lesson) && (
          <div className="quiz-feedback-links">
            {docLinks.map(({ docId, doc }) => (
              <a key={docId} href={doc.url} target="_blank" rel="noopener noreferrer">
                Read the docs: {doc.title}
              </a>
            ))}
            {lesson && (
              <a href={`#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}`}>
                Review the lesson: {lesson.title}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
