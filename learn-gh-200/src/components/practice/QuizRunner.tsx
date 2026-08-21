import { useEffect, useMemo, useState } from 'react';
import { CircleHelp, RotateCcw } from 'lucide-react';
import { byDomain } from '../../content/questions';
import { domainById } from '../../content/domains';
import { docTitle, docUrl } from '../../content/docs';
import { useProgress } from '../../hooks/useProgress';
import { gradeQuestion, type QuestionAnswer } from '../../utils/grade';
import { Badge, Pill } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { InlineText } from '../ui/InlineText';
import { ProgressBar } from '../ui/ProgressBar';
import { KIND_LABELS, QuestionCard, answerReady, initialAnswer } from './QuestionCard';

/** Fisher–Yates copy shuffle; practice order is fresh every run. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** One graded question, kept for the finish screen's sub-skill review. */
interface RunResult {
  questionId: string;
  subSkillId: string;
  correct: boolean;
}

/**
 * The quiz loop for one domain: one question at a time, submit → feedback →
 * next, then a finish screen with the score and the sub-skills to revisit.
 * Every submitted answer lands in the progress store as it happens, so an
 * abandoned run still keeps its stats.
 */
export function QuizRunner({ domainId }: { domainId: string }) {
  const domain = domainById(domainId);
  const bank = useMemo(() => byDomain(domainId), [domainId]);
  const { recordPractice } = useProgress();

  // `runId` bumps to reshuffle and restart; questions recompute from it.
  const [runId, setRunId] = useState(0);
  const questions = useMemo(() => shuffle(bank), [bank, runId]);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<QuestionAnswer | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [finished, setFinished] = useState(false);

  // A fresh run (mount or restart): reset the whole loop.
  useEffect(() => {
    setIndex(0);
    setAnswer(questions.length > 0 ? initialAnswer(questions[0]) : null);
    setRevealed(false);
    setResults([]);
    setFinished(false);
  }, [questions]);

  if (!domain || questions.length === 0) {
    return (
      <EmptyState
        icon={CircleHelp}
        title={domain ? 'Questions coming soon' : 'No such domain'}
        message={
          domain
            ? 'This domain has no questions in the bank yet — try a GH-900 domain while the rest are written.'
            : 'That domain id does not exist. Head back to the practice index and pick a domain card.'
        }
      >
        <Button href="#/practice" variant="secondary">
          Back to Practice
        </Button>
      </EmptyState>
    );
  }

  const current = questions[index];
  const ready = answerReady(current, answer!);

  const submit = () => {
    const correct = gradeQuestion(current, answer!);
    setResults((prev) => [
      ...prev,
      { questionId: current.id, subSkillId: current.subSkillId, correct },
    ]);
    recordPractice(domainId, correct);
    setRevealed(true);
  };

  const advance = () => {
    if (index + 1 < questions.length) {
      const next = questions[index + 1];
      setIndex(index + 1);
      setAnswer(initialAnswer(next));
      setRevealed(false);
    } else {
      setFinished(true);
    }
  };

  const restart = () => setRunId((id) => id + 1);

  const subSkill = domain.subSkills.find((skill) => skill.id === current.subSkillId);
  const correctCount = results.filter((result) => result.correct).length;
  const misses = results.filter((result) => !result.correct);
  const missCounts = new Map<string, number>();
  for (const miss of misses) {
    missCounts.set(miss.subSkillId, (missCounts.get(miss.subSkillId) ?? 0) + 1);
  }

  return (
    <>
      <div className="section-head enter">
        <a className="back-link" href="#/practice">
          ← All domains
        </a>
        <span className="caption">Practice</span>
        <h2>{domain.title}</h2>
        <div className="quiz-meta">
          <Badge tone={domain.cert}>Domain {domain.number}</Badge>
          <Pill>
            Question {Math.min(index + 1, questions.length)} of {questions.length}
          </Pill>
          {!finished && <Pill>{KIND_LABELS[current.kind]}</Pill>}
        </div>
        <ProgressBar value={results.length / questions.length} />
      </div>

      {finished ? (
        <div className="quiz-finish card">
          <span className="caption">Run complete</span>
          <p className="quiz-score">
            {correctCount} of {questions.length} correct
          </p>
          {misses.length === 0 ? (
            <p className="lead">Perfect run — every sub-skill in this domain held up.</p>
          ) : (
            <div className="quiz-misses">
              <h3>Sub-skills to revisit</h3>
              <ul>
                {[...missCounts.entries()].map(([skillId, count]) => {
                  const skill = domain.subSkills.find((entry) => entry.id === skillId);
                  return (
                    <li key={skillId}>
                      <a href={`#/learn/${domain.id}`}>{skill ? skill.title : skillId}</a>
                      <Pill>
                        {count} missed
                      </Pill>
                    </li>
                  );
                })}
              </ul>
              <p className="small">
                Each links back to the {domain.title.toLowerCase()} lesson.
              </p>
            </div>
          )}
          <div className="quiz-actions">
            <Button onClick={restart}>
              <RotateCcw size={16} strokeWidth={2} aria-hidden /> Practice again
            </Button>
            <Button href="#/practice" variant="secondary">
              All domains
            </Button>
          </div>
        </div>
      ) : (
        <div className="card quiz-card">
          <p className="quiz-subskill">
            <span className="caption">Sub-skill</span> {subSkill ? subSkill.title : current.subSkillId}
          </p>
          <h3 className="quiz-stem">
            <InlineText text={current.stem} />
          </h3>

          <QuestionCard question={current} answer={answer} onAnswer={setAnswer} revealed={revealed} />

          {revealed && (
            <div className={`quiz-feedback${gradeQuestion(current, answer!) ? ' correct' : ' incorrect'}`}>
              <span className="quiz-feedback-verdict">
                {gradeQuestion(current, answer!) ? 'Correct' : 'Not quite'}
              </span>
              <p>
                <InlineText text={current.explanation} />
              </p>
              <a href={docUrl(current.docId)} target="_blank" rel="noopener noreferrer">
                Read the docs: {docTitle(current.docId)}
              </a>
            </div>
          )}

          <div className="quiz-actions">
            {revealed ? (
              <Button onClick={advance}>
                {index + 1 < questions.length ? 'Next question' : 'See results'}
              </Button>
            ) : (
              <Button onClick={submit} disabled={!ready}>
                Check answer
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
