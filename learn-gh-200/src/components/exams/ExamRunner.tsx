import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Flag, Timer } from 'lucide-react';
import type { QuestionAnswer } from '../../utils/grade';
import { examById, examQuestions } from '../../content/exams';
import { useProgress } from '../../hooks/useProgress';
import { navigate } from '../../router';
import { scoreAttempt } from '../../utils/score';
import { Badge, Pill } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { InlineText } from '../ui/InlineText';
import { ProgressBar } from '../ui/ProgressBar';
import { KIND_LABELS, QuestionCard, answerReady } from '../practice/QuestionCard';

/**
 * The exam runner: a 100-minute, 35-question sitting with no feedback until
 * submit.
 *
 * The timer is a deadline timestamp, not elapsed ticks — `setInterval` only
 * re-renders, so tab throttling can never extend the exam. The whole
 * in-flight attempt (deadline, answers, flags) lives in localStorage under
 * its own key, so an accidental reload resumes exactly where the learner
 * left off, and a deadline that passed while away auto-submits on return.
 */

const INFLIGHT_KEY = 'gh-site-exam-inflight-v1';

/** The one in-flight sitting, persisted on every answer and flag change. */
interface InflightAttempt {
  examId: string;
  /** Wall-clock deadline in epoch ms — the single source of time truth. */
  deadline: number;
  answers: Record<string, QuestionAnswer>;
  /** Question ids the learner flagged for review. */
  flags: string[];
}

function loadInflight(): InflightAttempt | null {
  try {
    const raw = window.localStorage.getItem(INFLIGHT_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const value = parsed as Record<string, unknown>;
    // Strict shape check: `typeof null === 'object'` and `typeof NaN === 'number'`,
    // so a hand-edited or half-written record must fail here and restart at begin,
    // never reach the runner where a null answers map or NaN clock would crash.
    if (
      typeof value.examId !== 'string' ||
      typeof value.deadline !== 'number' ||
      !Number.isFinite(value.deadline)
    ) {
      return null;
    }
    if (
      typeof value.answers !== 'object' ||
      value.answers === null ||
      Array.isArray(value.answers) ||
      !Array.isArray(value.flags)
    ) {
      return null;
    }
    return {
      examId: value.examId,
      deadline: value.deadline,
      answers: value.answers as Record<string, QuestionAnswer>,
      flags: value.flags as string[],
    };
  } catch {
    // Unreadable or blocked storage — start clean rather than crash.
    return null;
  }
}

function saveInflight(attempt: InflightAttempt): void {
  try {
    window.localStorage.setItem(INFLIGHT_KEY, JSON.stringify(attempt));
  } catch {
    // Storage unavailable — the sitting still works, it just won't resume.
  }
}

function clearInflight(): void {
  try {
    window.localStorage.removeItem(INFLIGHT_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** mm:ss with minutes over 60 shown as-is (99:30, 100:00). */
function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function ExamRunner({ examId }: { examId: string }) {
  const exam = examById(examId);
  const paper = useMemo(() => (exam ? examQuestions(exam) : []), [exam]);
  const { progress, recordExamAttempt } = useProgress();

  // Resume a stored sitting for this exam; anything else starts at begin.
  // Lazy state init (not a ref initializer) so the storage read happens once,
  // not on every half-second clock re-render.
  const [resumed] = useState(loadInflight);
  const startsRunning = resumed !== null && resumed.examId === examId;
  const [running, setRunning] = useState(startsRunning);
  // 0 until Begin is clicked — the clock must not run on the intro screen.
  const [deadline, setDeadline] = useState(() => (startsRunning ? resumed.deadline : 0));
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>(() =>
    startsRunning ? resumed.answers : {},
  );
  const [flags, setFlags] = useState<string[]>(() =>
    startsRunning ? resumed.flags : [],
  );
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // A stored sitting for a different exam is discarded by this visit.
  useEffect(() => {
    if (resumed !== null && resumed.examId !== examId) {
      clearInflight();
    }
    // `resumed` is a read-once snapshot; only the exam id re-fires this.
  }, [examId]);

  // Persist the sitting on every change while running.
  useEffect(() => {
    if (running && exam) {
      saveInflight({ examId: exam.id, deadline, answers, flags });
    }
  }, [running, exam, deadline, answers, flags]);

  // Re-render every half second from the wall clock; the deadline decides.
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, [running]);

  const submitted = useRef(false);
  const remainingMs = deadline - now;

  const submit = () => {
    if (submitted.current || !exam) return;
    submitted.current = true;
    const score = scoreAttempt(paper, answers);
    const startedAt = deadline - exam.durationMin * 60_000;
    const durationSec = Math.min(
      Math.round((Date.now() - startedAt) / 1000),
      exam.durationMin * 60,
    );
    recordExamAttempt({
      examId: exam.id,
      date: new Date().toISOString(),
      scaledScore: score.scaledScore,
      passed: score.passed,
      perDomain: score.perDomain,
      answers,
      durationSec,
    });
    clearInflight();
    // The attempt is appended at the current length; land on its review.
    navigate(`#/exams/${exam.id}/review/${progress.examAttempts.length}`);
  };

  // Auto-submit the moment the wall clock passes the deadline.
  useEffect(() => {
    if (running && remainingMs <= 0) {
      submit();
    }
  }, [running, remainingMs]);

  if (!exam || paper.length === 0) {
    return (
      <EmptyState
        icon={Timer}
        title="No such exam"
        message="That exam id does not exist. Head back to the mock exams index and pick a card."
      >
        <Button href="#/exams" variant="secondary">
          Back to Mock exams
        </Button>
      </EmptyState>
    );
  }

  const current = paper[index]!;
  const answeredCount = paper.filter((question) => answerReady(question, answers[question.id] as QuestionAnswer)).length;

  /** Store one answer; unanswered questions simply have no entry. */
  const onAnswer = (answer: QuestionAnswer) => {
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
  };

  const toggleFlag = () => {
    setFlags((prev) =>
      prev.includes(current.id) ? prev.filter((id) => id !== current.id) : [...prev, current.id],
    );
  };

  if (!running) {
    return (
      <>
        <div className="section-head enter">
          <a className="back-link" href="#/exams">
            ← All exams
          </a>
          <span className="caption">Mock exams</span>
          <h2>{exam.title}</h2>
          <div className="quiz-meta">
            <Badge tone={exam.cert}>{exam.cert === 'gh900' ? 'GH-900' : 'GH-200'}</Badge>
            <Pill>{exam.durationMin} minutes</Pill>
            <Pill>{exam.totalQuestions} questions</Pill>
            <Pill>Pass at 700</Pill>
          </div>
        </div>
        <div className="card exam-begin">
          <h3>Before you begin</h3>
          <ul>
            <li>The clock starts the moment you begin and runs on wall time — a reload resumes where you left off, it never pauses the exam.</li>
            <li>One question per screen, any order via the navigator; flag anything to revisit.</li>
            <li>No feedback until you submit. Unanswered questions score as wrong.</li>
            <li>When the clock hits zero, the exam submits itself with whatever is on paper.</li>
          </ul>
          <div className="quiz-actions">
            <Button
              onClick={() => {
                setDeadline(Date.now() + exam.durationMin * 60_000);
                setNow(Date.now());
                setRunning(true);
              }}
            >
              <Timer size={16} strokeWidth={1.75} aria-hidden /> Begin — {exam.durationMin} minutes
            </Button>
            <Button href="#/exams" variant="secondary">
              Not yet
            </Button>
          </div>
        </div>
      </>
    );
  }

  const flagged = flags.includes(current.id);
  const unanswered = exam.totalQuestions - answeredCount;

  return (
    <>
      <div className="section-head enter">
        <span className="caption">Mock exams</span>
        <h2>{exam.title}</h2>
        <div className="quiz-meta exam-meta">
          <Badge tone={exam.cert}>{exam.cert === 'gh900' ? 'GH-900' : 'GH-200'}</Badge>
          <Pill>
            Question {index + 1} of {paper.length}
          </Pill>
          <Pill>{KIND_LABELS[current.kind]}</Pill>
          <span
            className={`exam-timer${remainingMs <= 5 * 60_000 ? ' warning' : ''}`}
            role="timer"
            aria-live="off"
          >
            {formatClock(remainingMs)}
          </span>
        </div>
        <ProgressBar value={answeredCount / paper.length} />
      </div>

      <div className="card quiz-card">
        <p className="quiz-subskill exam-question-head">
          <button
            type="button"
            className={`exam-flag${flagged ? ' on' : ''}`}
            aria-pressed={flagged}
            onClick={toggleFlag}
          >
            <Flag size={14} strokeWidth={1.75} aria-hidden />
            {flagged ? 'Flagged' : 'Flag for review'}
          </button>
        </p>
        <h3 className="quiz-stem">
          <InlineText text={current.stem} />
        </h3>

        <QuestionCard question={current} answer={answers[current.id] ?? null} onAnswer={onAnswer} revealed={false} />

        <div className="quiz-actions">
          <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Previous
          </Button>
          {index + 1 < paper.length ? (
            <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setConfirming(true)}>Submit exam</Button>
          )}
        </div>
      </div>

      <nav className="exam-navigator" aria-label="Question navigator">
        {paper.map((question, position) => {
          const done = answerReady(question, answers[question.id] as QuestionAnswer);
          const isFlagged = flags.includes(question.id);
          return (
            <button
              key={question.id}
              type="button"
              className={[
                'exam-nav-cell',
                done ? 'answered' : '',
                isFlagged ? 'flagged' : '',
                position === index ? 'current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={position === index ? 'true' : undefined}
              aria-label={`Question ${position + 1}${done ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
              onClick={() => setIndex(position)}
            >
              {position + 1}
            </button>
          );
        })}
      </nav>
      <div className="exam-submit-row">
        <Button onClick={() => setConfirming(true)}>Submit exam</Button>
      </div>

      {confirming && (
        <div className="exam-dialog-backdrop" role="presentation">
          <div className="exam-dialog card" role="dialog" aria-modal="true" aria-labelledby="exam-dialog-title">
            <h3 id="exam-dialog-title">
              <AlertTriangle size={20} strokeWidth={1.75} aria-hidden /> Submit this exam?
            </h3>
            <p>
              {unanswered === 0
                ? 'Every question is answered.'
                : `${unanswered} question${unanswered === 1 ? ' is' : 's are'} still unanswered — each scores as wrong.`}
            </p>
            <p className="small">
              Scored on the 100–1000 scale, 700 to pass. The review screen
              walks every question afterwards.
            </p>
            <div className="quiz-actions">
              <Button onClick={submit}>Submit and score</Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Keep working
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
