import { Clock, FileCheck2, History, Timer } from 'lucide-react';
import { EXAMS } from '../../content/exams';
import { useProgress } from '../../hooks/useProgress';
import { Badge, Pill } from '../ui/Badge';
import { Button } from '../ui/Button';

/** "12 Aug 2026, 14:05" — stable, locale-light rendering for history rows. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Mock exams landing page: one card per simulation plus the full attempt
 * history, newest first. Every row of the history links back into that
 * attempt's review screen so past papers stay replayable.
 */
export function ExamIndex() {
  const { progress } = useProgress();

  // Newest first, but keep the absolute index for the review deep link.
  const history = progress.examAttempts
    .map((attempt, index) => ({ attempt, index }))
    .reverse();

  return (
    <>
      <div className="section-head enter">
        <span className="caption">Mock exams</span>
        <h2>Sit the real thing</h2>
        <p className="lead">
          Four timed simulations — two per certification — each 35 questions
          drawn from the bank by official domain weightings and scored on the
          exams' 100–1000 scale, where 700 passes. The timer runs on wall
          clock, the paper survives a reload, and zero on the clock submits
          for you.
        </p>
      </div>

      <div className="card-grid">
        {EXAMS.map((exam) => {
          const attempts = progress.examAttempts.filter((row) => row.examId === exam.id);
          const best = attempts.length > 0 ? Math.max(...attempts.map((row) => row.scaledScore)) : null;
          return (
            <article key={exam.id} className="card">
              <div className="card-head">
                <Badge tone={exam.cert}>{exam.cert === 'gh900' ? 'GH-900' : 'GH-200'}</Badge>
                <Pill>{Object.keys(exam.domainPlan).length} domains</Pill>
              </div>
              <h3 className="card-title">{exam.title}</h3>
              <div className="card-meta">
                <span>
                  <Clock size={16} strokeWidth={1.75} aria-hidden /> {exam.durationMin} minutes
                </span>
                <span>
                  <FileCheck2 size={16} strokeWidth={1.75} aria-hidden /> {exam.totalQuestions} questions
                </span>
              </div>
              <p className="small">
                {best === null
                  ? 'No attempts yet — your first sitting starts fresh.'
                  : `Best score ${best} of 1000 across ${attempts.length} attempt${attempts.length === 1 ? '' : 's'}.`}
              </p>
              <div className="card-foot">
                <Button href={`#/exams/${exam.id}/run`}>
                  <Timer size={16} strokeWidth={1.75} aria-hidden /> Start exam
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="history-section" aria-label="Attempt history">
        <div className="history-head">
          <History size={18} strokeWidth={1.75} aria-hidden />
          <h3>Attempt history</h3>
        </div>
        {history.length === 0 ? (
          <p className="small">
            No attempts recorded yet. Finished exams land here with score,
            verdict, and a per-domain breakdown — and they stay after a reload.
          </p>
        ) : (
          <ul className="history-list">
            {history.map(({ attempt, index }) => {
              const exam = EXAMS.find((row) => row.id === attempt.examId);
              const domains = Object.entries(attempt.perDomain);
              return (
                <li key={index} className="history-row">
                  <a className="history-link" href={`#/exams/${attempt.examId}/review/${index}`}>
                    <span className="history-title">{exam ? exam.title : attempt.examId}</span>
                    <span className="small">{formatDate(attempt.date)}</span>
                    <span className="history-domains small">
                      {domains.map(([domainId, tally]) => (
                        <span key={domainId} className="history-domain">
                          {domainId.slice(-2)} {tally.correct}/{tally.total}
                        </span>
                      ))}
                    </span>
                  </a>
                  <span className={`history-verdict${attempt.passed ? ' pass' : ' fail'}`}>
                    {attempt.scaledScore} · {attempt.passed ? 'Pass' : 'Fail'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
