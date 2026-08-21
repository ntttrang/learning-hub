import { CheckCircle2, Clock, FileSearch, XCircle } from 'lucide-react';
import { domainById } from '../../content/domains';
import { examById, examQuestions } from '../../content/exams';
import { docTitle, docUrl } from '../../content/docs';
import { useProgress } from '../../hooks/useProgress';
import { gradeQuestion } from '../../utils/grade';
import { Badge, Pill } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { InlineText } from '../ui/InlineText';
import { QuestionCard } from '../practice/QuestionCard';
import { BreakdownBar } from './BreakdownBar';

/** m:ss for the "time used" stat on the verdict card. */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Post-exam review: the verdict, the per-domain breakdown against official
 * weights, and every question replayed — the learner's answer beside the
 * correct one, the explanation, the doc citation, and a link into the
 * owning sub-skill's lesson. The paper is re-sampled deterministically, so
 * the replay is always the exact paper that was sat.
 */
export function ExamReview({ examId, attemptIndex }: { examId: string; attemptIndex: number }) {
  const exam = examById(examId);
  const { progress } = useProgress();
  const attempt = Number.isInteger(attemptIndex)
    ? progress.examAttempts[attemptIndex]
    : undefined;

  if (!exam || !attempt || attempt.examId !== exam.id) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Attempt not found"
        message="That attempt does not exist for this exam. Start a sitting or pick one from the history list."
      >
        <Button href="#/exams" variant="secondary">
          Back to Mock exams
        </Button>
      </EmptyState>
    );
  }

  const paper = examQuestions(exam);
  const answers = attempt.answers ?? {};
  // Recompute from the stored answers; pre-phase-6 attempts carry none.
  const hasAnswers = attempt.answers !== undefined;
  const correctCount = paper.filter(
    (question) => answers[question.id] != null && gradeQuestion(question, answers[question.id]!),
  ).length;
  const date = new Date(attempt.date).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className="section-head enter">
        <a className="back-link" href="#/exams">
          ← All exams
        </a>
        <span className="caption">Review</span>
        <h2>{exam.title}</h2>
        <div className="quiz-meta">
          <Badge tone={exam.cert}>{exam.cert === 'gh900' ? 'GH-900' : 'GH-200'}</Badge>
          <Pill>{date}</Pill>
        </div>
      </div>

      <div className={`card exam-verdict${attempt.passed ? ' pass' : ' fail'}`}>
        <div>
          <span className="caption">{attempt.passed ? 'Passed' : 'Not passed'}</span>
          <p className="exam-score-big">
            {attempt.scaledScore}
            <span className="exam-score-of">/ 1000</span>
          </p>
          <p className="small">Pass mark is 700 — about two-thirds correct.</p>
        </div>
        <ul className="exam-verdict-stats">
          <li>
            <CheckCircle2 size={16} strokeWidth={1.75} aria-hidden />
            {hasAnswers
              ? `${correctCount} of ${paper.length} correct`
              : `${paper.length} questions`}
          </li>
          {typeof attempt.durationSec === 'number' && (
            <li>
              <Clock size={16} strokeWidth={1.75} aria-hidden />
              {formatDuration(attempt.durationSec)} of {exam.durationMin} minutes used
            </li>
          )}
        </ul>
      </div>

      <section aria-label="Per-domain breakdown">
        <h3>Where the marks went</h3>
        {Object.entries(exam.domainPlan).map(([domainId, planned]) => {
          const domain = domainById(domainId);
          const tally = attempt.perDomain[domainId] ?? { correct: 0, total: 0 };
          return (
            <div className="exam-domain-row" key={domainId}>
              <BreakdownBar
                label={domain ? domain.title : domainId}
                caption={`Domain ${domain?.number ?? '?'} · ${domain?.weightMin}–${domain?.weightMax}% official weight · ${planned} questions`}
                correct={tally.correct}
                total={tally.total}
              />
              <div className="exam-domain-links">
                <a href={`#/practice/${domainId}`}>Practice this domain</a>
                <a href={`#/learn/${domainId}`}>Reread the lesson</a>
              </div>
            </div>
          );
        })}
      </section>

      <section aria-label="Question-by-question review">
        <h3>Every question, replayed</h3>
        {paper.map((question, position) => {
          const answer = answers[question.id] ?? null;
          const correct = answer !== null && gradeQuestion(question, answer);
          const domain = domainById(question.domainId);
          const subSkill = domain?.subSkills.find((skill) => skill.id === question.subSkillId);
          return (
            <article key={question.id} className={`review-item${correct ? '' : ' missed'}`}>
              <div className="review-item-head">
                <span className="review-item-no">Q{position + 1}</span>
                {correct ? (
                  <span className="review-verdict ok">
                    <CheckCircle2 size={16} strokeWidth={1.75} aria-hidden /> Correct
                  </span>
                ) : (
                  <span className="review-verdict miss">
                    <XCircle size={16} strokeWidth={1.75} aria-hidden />
                    {answer === null ? 'Unanswered' : 'Missed'}
                  </span>
                )}
                <a className="review-subskill" href={`#/learn/${question.domainId}`}>
                  {subSkill ? subSkill.title : question.subSkillId}
                </a>
              </div>
              <h4 className="quiz-stem">
                <InlineText text={question.stem} />
              </h4>
              <QuestionCard question={question} answer={answer} revealed />
              <div className={`quiz-feedback${correct ? ' correct' : ' incorrect'}`}>
                <span className="quiz-feedback-verdict">{correct ? 'Correct' : 'The answer'}</span>
                <p>
                  <InlineText text={question.explanation} />
                </p>
                <a href={docUrl(question.docId)} target="_blank" rel="noopener noreferrer">
                  Read the docs: {docTitle(question.docId)}
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
