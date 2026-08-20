import { AlertTriangle, ClipboardList, Clock, FileText, Flag, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import { clearInflight, loadInflight, saveInflight } from '../engines/exam-inflight';
import { assemblePaper } from '../engines/exam-paper';
import { scoreAttempt } from '../engines/scoring';
import { useSubjectDataStore } from '../engines/subject-store';
import { navigate } from '../shell/router';
import {
  answerReady,
  initialAnswer,
  KIND_LABELS,
  renderQuestion,
} from '../sdk/registry/questions';
import type { Answer, Exam, QuestionKind } from '../sdk/types';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Markdown } from './Markdown';
import { Pill } from './Pill';
import { ProgressBar } from './ProgressBar';

/** mm:ss with minutes over 60 shown as-is (99:30, 100:00). */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Seconds to record for one sitting. Timed: the start is reconstructed from
 * the wall-clock deadline (so a mid-sitting clock jump cannot fabricate
 * elapsed time) and the total never exceeds the exam duration — an expired
 * sitting submits at the deadline, never past it. Untimed: raw elapsed.
 */
export function sittingSeconds(
  exam: Exam,
  timed: boolean,
  startedAt: number,
  deadline: number | undefined,
  at: number = Date.now(),
): number {
  const capMs = exam.durationMinutes * 60_000;
  const start = timed && deadline !== undefined ? deadline - capMs : startedAt;
  const elapsedMs = at - start;
  return Math.max(0, Math.round((timed ? Math.min(elapsedMs, capMs) : elapsedMs) / 1000));
}

interface ExamEngineProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
  /** Route segment: exam id. */
  examId: string;
}

/**
 * The exam sitting: one question per screen with no feedback until submit.
 *
 * The timer is a deadline timestamp, not elapsed ticks — `setInterval` only
 * re-renders, so tab throttling can never extend the exam. The whole sitting
 * (timed flag, start, deadline, answers, flags) lives in storage under its own
 * key, so an accidental reload resumes exactly where the learner left off,
 * and a deadline that passed while away auto-submits on return. Untimed
 * sittings count up instead and end only on explicit submit.
 */
export function ExamEngine({ subjectId, content, index, examId }: ExamEngineProps) {
  const recordExam = useSubjectDataStore((s) => s.recordExam);
  const exam = index.getExam(examId);
  const paper = useMemo(() => (exam ? assemblePaper(content, exam) : []), [content, exam]);

  // Resume a stored sitting for THIS exam; one stored for any other exam or
  // subject is discarded by this visit. Lazy init — storage is read once,
  // never on the half-second clock re-render.
  const [resumed] = useState(() => (exam ? loadInflight() : null));
  const restored =
    resumed !== null && resumed.subjectId === subjectId && resumed.examId === examId
      ? resumed
      : null;
  const [running, setRunning] = useState(restored !== null);
  const [timed, setTimed] = useState(restored?.timed ?? true);
  const [startedAt, setStartedAt] = useState(restored?.startedAt ?? 0);
  const [deadline, setDeadline] = useState<number | undefined>(restored?.deadline);
  const [answers, setAnswers] = useState<Record<string, Answer>>(restored?.answers ?? {});
  const [flags, setFlags] = useState<string[]>(restored?.flags ?? []);
  const [position, setPosition] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const submitted = useRef(false);

  // A stored sitting for another exam (or subject) is discarded by this visit.
  useEffect(() => {
    if (resumed !== null && restored === null) clearInflight();
  }, [resumed, restored]);

  // Persist the sitting on every change while running.
  useEffect(() => {
    if (running && exam) {
      saveInflight({ subjectId, examId: exam.id, timed, startedAt, deadline, answers, flags });
    }
  }, [running, exam, subjectId, timed, startedAt, deadline, answers, flags]);

  // Re-render every half second from the wall clock; the deadline decides.
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, [running]);

  const submit = () => {
    if (submitted.current || !exam) return;
    submitted.current = true;
    const score = scoreAttempt(exam, paper, answers);
    recordExam(subjectId, {
      id: `exam-${Date.now()}`,
      examId: exam.id,
      date: new Date().toISOString(),
      durationSeconds: sittingSeconds(exam, timed, startedAt, deadline),
      timed,
      scaledScore: score.scaledScore,
      passed: score.passed,
      perDomain: score.perDomain,
      answers,
      results: score.results,
    });
    clearInflight();
    // The store prepends, so the fresh attempt sits at history index 0.
    navigate(`#/subject/${subjectId}/exams/${exam.id}/review/0`);
  };

  // Auto-submit the moment the wall clock passes the deadline — including on
  // mount with a sitting that expired while away.
  const expired = timed && deadline !== undefined && deadline - now <= 0;
  useEffect(() => {
    if (running && expired) submit();
  }, [running, expired]);

  // Escape keeps working from anywhere: a backdrop click leaves focus on
  // <body>, where a dialog-scoped keydown handler never fires.
  useEffect(() => {
    if (!confirming) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirming(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirming]);

  if (!exam || paper.length === 0) {
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

  if (!running) {
    return (
      <div className="exam-intro">
        <a className="back-link" href={`#/subject/${subjectId}/exams`}>
          ← All exams
        </a>
        <header className="lesson-head">
          <h2 className="lesson-title">{exam.title}</h2>
          {exam.description && <p className="lesson-summary">{exam.description}</p>}
          <div className="lesson-chips">
            <Pill tone="accent">
              {exam.selection.kind === 'sampled' ? 'Sampled paper' : 'Fixed paper'}
            </Pill>
            <Pill>{paper.length} questions</Pill>
            <Pill>{exam.durationMinutes} min</Pill>
            <Pill>Pass {exam.passingScore ?? 700}/1000</Pill>
          </div>
        </header>

        <section className="lab-panel" aria-label="Before you begin">
          <h3 className="lab-section-title">Before you begin</h3>
          <ul className="lab-list">
            <li>
              The clock starts the moment you begin and runs on wall time — a reload resumes
              where you left off, it never pauses the exam.
            </li>
            <li>One question per screen, any order via the navigator; flag anything to revisit.</li>
            <li>No feedback until you submit. Unanswered questions score as wrong.</li>
            <li>When the clock hits zero, a timed exam submits itself with whatever is on paper.</li>
          </ul>

          <div className="exam-toggle" role="group" aria-label="Sitting mode">
            {([true, false] as const).map((option) => (
              <button
                key={String(option)}
                type="button"
                className={`exam-toggle-btn${timed === option ? ' on' : ''}`}
                aria-pressed={timed === option}
                onClick={() => setTimed(option)}
              >
                {option ? 'Timed' : 'Untimed'}
              </button>
            ))}
          </div>
          <p className="exam-toggle-note">
            {timed
              ? `The ${exam.durationMinutes}-minute deadline is wall-clock and auto-submits at zero.`
              : 'Untimed counts up and never auto-submits — it ends only when you submit.'}
          </p>

          <div className="quiz-actions">
            <Button
              icon={Timer}
              onClick={() => {
                const at = Date.now();
                setStartedAt(at);
                setDeadline(timed ? at + exam.durationMinutes * 60_000 : undefined);
                setNow(at);
                setRunning(true);
              }}
            >
              {timed ? `Begin — ${exam.durationMinutes} minutes` : 'Begin untimed'}
            </Button>
            <Button href={`#/subject/${subjectId}/exams`} variant="secondary">
              Not yet
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const current = paper[position];
  const answeredCount = paper.filter((question) =>
    answerReady(question, answers[question.id] ?? []),
  ).length;
  const caseStudy = exam.caseStudies?.find((cs) => cs.questionIds.includes(current.id));
  const flagged = flags.includes(current.id);
  const remainingMs = timed && deadline !== undefined ? deadline - now : now - startedAt;
  const lowTime = timed && deadline !== undefined && remainingMs <= 5 * 60_000;

  /** Store one answer; unanswered questions simply have no entry. */
  const onAnswer = (answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
  };

  const toggleFlag = () => {
    setFlags((prev) =>
      prev.includes(current.id) ? prev.filter((id) => id !== current.id) : [...prev, current.id],
    );
  };

  return (
    <div className="exam-sitting">
      <div className="exam-sit-head">
        <span className="exam-sit-title">{exam.title}</span>
        <div className="quiz-meta">
          <Pill>
            {answeredCount}/{paper.length} answered
          </Pill>
          <span
            className={`exam-timer${lowTime ? ' warning' : ''}`}
            role="timer"
            aria-live="off"
          >
            <Clock size={14} strokeWidth={1.75} aria-hidden="true" />
            {formatClock(remainingMs)}
            {!timed && ' elapsed'}
          </span>
          <Button onClick={() => setConfirming(true)}>Submit exam</Button>
        </div>
        <ProgressBar value={answeredCount / paper.length} label="Questions answered" />
      </div>

      <nav className="exam-navigator" aria-label="Question navigator">
        {paper.map((question, cell) => {
          const done = answerReady(question, answers[question.id] ?? []);
          const isFlagged = flags.includes(question.id);
          return (
            <button
              key={question.id}
              type="button"
              className={[
                'exam-nav-cell',
                done ? 'answered' : '',
                isFlagged ? 'flagged' : '',
                cell === position ? 'current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={cell === position ? 'true' : undefined}
              aria-label={`Question ${cell + 1}${done ? ', answered' : ''}${
                isFlagged ? ', flagged' : ''
              }`}
              onClick={() => setPosition(cell)}
            >
              {cell + 1}
            </button>
          );
        })}
      </nav>

      {caseStudy && (
        <section className="exam-case" aria-label={`Case study: ${caseStudy.title}`}>
          <p className="exam-case-title">
            <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
            {caseStudy.title}
          </p>
          <Markdown>{caseStudy.background}</Markdown>
        </section>
      )}

      <div className="quiz-card">
        <div className="exam-q-head">
          <div className="quiz-meta">
            <Pill>
              Question {position + 1} of {paper.length}
            </Pill>
            <Pill tone="accent">{KIND_LABELS[current.kind as QuestionKind] ?? current.kind}</Pill>
          </div>
          <button
            type="button"
            className={`exam-flag${flagged ? ' on' : ''}`}
            aria-pressed={flagged}
            onClick={toggleFlag}
          >
            <Flag size={14} strokeWidth={1.75} aria-hidden="true" />
            {flagged ? 'Flagged' : 'Flag for review'}
          </button>
        </div>

        <div className="quiz-stem">
          <Markdown>{current.prompt}</Markdown>
        </div>

        {renderQuestion(
          current,
          answers[current.id] ?? initialAnswer(current),
          onAnswer,
          false,
          false,
        )}

        <div className="quiz-actions">
          <Button
            variant="secondary"
            disabled={position === 0}
            onClick={() => setPosition((p) => p - 1)}
          >
            Previous
          </Button>
          {position + 1 < paper.length ? (
            <Button onClick={() => setPosition((p) => p + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setConfirming(true)}>Submit exam</Button>
          )}
        </div>
      </div>

      {confirming && (
        <div className="exam-dialog-backdrop" role="presentation">
          <div
            className="exam-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exam-dialog-title"
          >
            <h3 id="exam-dialog-title">
              <AlertTriangle size={20} strokeWidth={1.75} aria-hidden="true" /> Submit this exam?
            </h3>
            <p>
              {answeredCount === paper.length
                ? 'Every question is answered.'
                : `${paper.length - answeredCount} question${
                    paper.length - answeredCount === 1 ? ' is' : 's are'
                  } still unanswered — each scores as wrong.`}
            </p>
            <p className="exam-dialog-note">
              Scored on the 100–1000 scale, {exam.passingScore ?? 700} to pass. The review screen
              walks every question afterwards.
            </p>
            <div className="quiz-actions">
              <Button onClick={submit}>Submit and score</Button>
              {/* Focus lands on the safe action when the dialog opens; Escape
                  also keeps working. */}
              <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>
                Keep working
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
