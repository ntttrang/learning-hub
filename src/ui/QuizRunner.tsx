import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { gradeQuestion, initialAnswer, KIND_LABELS, renderQuestion, answerReady } from '../sdk/registry/questions';
import type { SubjectIndex } from '../sdk/content-source';
import type { Answer, Question, QuestionKind } from '../sdk/types';
import { useSubjectDataStore } from '../engines/subject-store';
import { useDocResolver } from './doc-context';
import { isExternalUrl } from './external-url';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Markdown } from './Markdown';
import { Pill } from './Pill';
import { ProgressBar } from './ProgressBar';

/** Fisher–Yates copy shuffle; practice order is fresh every run (gh-200). */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface QuizRunnerProps {
  subjectId: string;
  /** Practice scope recorded on the attempt (domainId, moduleId, 'all', 'review'). */
  scope: string;
  questions: Question[];
  /** Section title shown in the header (domain title, lesson title, …). */
  title?: string;
  /** Where the back link points (practice index by default; null hides it). */
  backHref?: string | null;
  /** Lesson lookup for missed-question and review links. */
  index?: SubjectIndex;
}

/**
 * The practice loop: one question at a time → check answer → verdict with the
 * explanation and doc trail → next; a finish screen with the score and the
 * lessons to revisit. gh-200's loop with dp-800's feedback. One `QuizAttempt`
 * is recorded through the subject store on finish — unanswered questions count
 * as wrong, and the SRS ingest rides the store.
 */
export function QuizRunner({
  subjectId,
  scope,
  questions: bank,
  title = 'Practice',
  backHref,
  index,
}: QuizRunnerProps) {
  const recordQuiz = useSubjectDataStore((s) => s.recordQuiz);
  const resolveDoc = useDocResolver();

  const back = backHref === undefined ? `#/subject/${subjectId}/practice` : backHref ?? undefined;
  const [runId, setRunId] = useState(0);
  const questions = useMemo(() => shuffle(bank), [bank, runId]);

  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={RotateCcw}
        title="No questions in this scope"
        message="This run has nothing to draw on — pick another scope from the practice index."
      >
        {back && (
          <Button href={back} variant="secondary">
            Back to practice
          </Button>
        )}
      </EmptyState>
    );
  }

  const current = questions[position];
  // One answer source everywhere: order questions are submit-ready from their
  // seeded list without ever emitting onAnswer, so the fallback must feed the
  // verdict AND the finish/record grading alike.
  const answerFor = (question: Question) => answers[question.id] ?? initialAnswer(question);
  const answer = answerFor(current);
  const isChecked = !!checked[current.id];
  const correct = isChecked && gradeQuestion(current, answer);

  const check = () => setChecked((prev) => ({ ...prev, [current.id]: true }));

  const next = () => {
    if (position + 1 < questions.length) {
      setPosition(position + 1);
      return;
    }
    // Finish: unanswered questions count as wrong, exactly like the exams.
    const results = questions.map((question) => ({
      questionId: question.id,
      correct: gradeQuestion(question, answerFor(question)),
    }));
    recordQuiz(subjectId, {
      id: `quiz-${Date.now()}`,
      scope,
      date: new Date().toISOString(),
      total: questions.length,
      correct: results.filter((result) => result.correct).length,
      questionResults: results,
    });
    setFinished(true);
  };

  const restart = () => {
    setPosition(0);
    setAnswers({});
    setChecked({});
    setFinished(false);
    setRunId((id) => id + 1); // reshuffle
  };

  const lessonFor = (question: Question) => {
    const lesson = question.lessonId ? index?.getLesson(question.lessonId) : undefined;
    return lesson ? `#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}` : undefined;
  };

  if (finished) {
    const results = questions.map((question) => ({
      question,
      correct: gradeQuestion(question, answerFor(question)),
    }));
    const correctCount = results.filter((result) => result.correct).length;
    const misses = results.filter((result) => !result.correct);
    const pct = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="quiz-finish">
        <span className="caption">Run complete</span>
        <p className={`quiz-score${pct >= 70 ? ' good' : ''}`}>
          {correctCount} of {questions.length} correct ({pct}%)
        </p>
        <p className="lead">
          {misses.length === 0
            ? 'Perfect run — every question in this scope held up.'
            : 'Missed questions resurface in spaced review. Revisit the lessons below and run it again.'}
        </p>
        {misses.length > 0 && (
          <div className="quiz-misses">
            <h3>To revisit</h3>
            <ul>
              {misses.map(({ question }) => {
                const href = lessonFor(question);
                return (
                  <li key={question.id}>
                    {href ? (
                      <a href={href}>{question.prompt}</a>
                    ) : (
                      <span>{question.prompt}</span>
                    )}
                    <Pill tone="warn">{KIND_LABELS[question.kind as QuestionKind] ?? question.kind}</Pill>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="quiz-actions">
          <Button onClick={restart} icon={RotateCcw}>
            Practice again
          </Button>
          {back && (
            <Button href={back} variant="secondary">
              Back to practice
            </Button>
          )}
        </div>
      </div>
    );
  }

  const docLinks = (current.docIds ?? []).flatMap((docId) => {
    const doc = resolveDoc?.(docId);
    // Same single href policy as prose: registry urls that are not plain
    // http(s) degrade away instead of becoming clickable anchors.
    return doc && isExternalUrl(doc.url) ? [{ docId, doc }] : [];
  });
  const reviewHref = lessonFor(current);

  return (
    <>
      <div className="quiz-head">
        {back && (
          <a className="back-link" href={back}>
            ← All scopes
          </a>
        )}
        <h2 className="quiz-title">{title}</h2>
        <div className="quiz-meta">
          <Pill>
            Question {Math.min(position + 1, questions.length)} of {questions.length}
          </Pill>
          <Pill tone="accent">{KIND_LABELS[current.kind as QuestionKind] ?? current.kind}</Pill>
        </div>
        <ProgressBar value={(position + (isChecked ? 1 : 0)) / questions.length} label="Run progress" />
      </div>

      <div className="quiz-card">
        <div className="quiz-stem">
          <Markdown>{current.prompt}</Markdown>
        </div>

        {renderQuestion(
          current,
          answer,
          (nextAnswer) => setAnswers((prev) => ({ ...prev, [current.id]: nextAnswer })),
          isChecked, // locked = revealed
          isChecked,
        )}

        {isChecked && (
          <div className={`quiz-feedback${correct ? ' correct' : ' incorrect'}`}>
            <span className="quiz-feedback-verdict">{correct ? 'Correct' : 'Not quite'}</span>
            <Markdown>{current.explanation}</Markdown>
            {(docLinks.length > 0 || reviewHref) && (
              <div className="quiz-feedback-links">
                {docLinks.map(({ docId, doc }) => (
                  <a key={docId} href={doc.url} target="_blank" rel="noopener noreferrer">
                    Read the docs: {doc.title}
                  </a>
                ))}
                {reviewHref && <a href={reviewHref}>Review the lesson</a>}
              </div>
            )}
          </div>
        )}

        <div className="quiz-actions">
          {isChecked ? (
            <Button onClick={next}>
              {position + 1 < questions.length ? 'Next question' : 'See results'}
            </Button>
          ) : (
            <Button onClick={check} disabled={!answerReady(current, answer)}>
              Check answer
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
