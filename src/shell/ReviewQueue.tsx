import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { loadSubjectWithIndex } from '../content/registry';
import { buildReviewQueue, type ReviewQueueItem } from '../engines/review-queue';
import { useSubjectDataStore } from '../engines/subject-store';
import { DocResolverProvider, registryResolver, type DocResolver } from '../ui/doc-context';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Markdown } from '../ui/Markdown';
import { Pill } from '../ui/Pill';
import { ProgressBar } from '../ui/ProgressBar';
import { answerReady, gradeQuestion, initialAnswer, KIND_LABELS, renderQuestion } from '../sdk/registry/questions';
import { listSubjectCards } from './subjects';
import type { Answer, Question, QuestionKind } from '../sdk/types';

/**
 * Hub-level spaced review: due SRS cards from every subject in one session.
 * The loop mirrors QuizRunner's (check → verdict → next), but each question
 * carries its owning subject and finishing records one partial attempt per
 * touched subject (`scope: 'hub-review'`), so SRS ingest, attempt caps, and
 * the streak all ride the existing store actions.
 */

interface PackContext {
  code: string;
  questions: Map<string, Question>;
  resolveDoc: DocResolver | undefined;
  lessonHref: (question: Question) => string | undefined;
}

/** Static per session: packs are bundled at build time (see search-entries). */
function loadPackContexts(): Map<string, PackContext> {
  const contexts = new Map<string, PackContext>();
  for (const card of listSubjectCards()) {
    if (!card.installed) continue;
    const { content } = loadSubjectWithIndex(card.id);
    const lessonById = new Map(content.lessons.map((lesson) => [lesson.id, lesson]));
    contexts.set(card.id, {
      code: card.code,
      questions: new Map(content.questions.map((question) => [question.id, question])),
      resolveDoc: registryResolver(content.docs),
      lessonHref: (question) => {
        const lesson = question.lessonId ? lessonById.get(question.lessonId) : undefined;
        return lesson ? `#/subject/${card.id}/learn/${lesson.slug ?? lesson.id}` : undefined;
      },
    });
  }
  return contexts;
}

interface QueueEntry extends ReviewQueueItem {
  question: Question;
}

export default function ReviewQueue() {
  const subjectsData = useSubjectDataStore((s) => s.subjects);
  const recordQuiz = useSubjectDataStore((s) => s.recordQuiz);

  const [runId, setRunId] = useState(0);
  const packs = useMemo(loadPackContexts, []);

  // Built once per run: mid-session SRS changes (there are none until finish)
  // must not reshape the queue under the learner. Restarts rebuild.
  const entries = useMemo<QueueEntry[]>(() => {
    const items = buildReviewQueue(
      subjectsData,
      (subjectId, questionId) => packs.get(subjectId)?.questions.has(questionId) ?? false,
      new Date().toISOString(),
    );
    return items.flatMap((item) => {
      const question = packs.get(item.subjectId)?.questions.get(item.questionId);
      return question ? [{ ...item, question }] : [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runId is the only rebuild trigger by design
  }, [runId]);

  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  if (entries.length === 0 && !finished) {
    return (
      <EmptyState
        icon={RotateCcw}
        title="Nothing due right now"
        message="Every spaced-review card is ahead of schedule. Answer practice questions or mock exams and missed ones will land here."
      >
        <Button href="#/" variant="secondary">
          Back to the hub
        </Button>
      </EmptyState>
    );
  }

  const current = entries[position];
  const answerFor = (question: Question) => answers[question.id] ?? initialAnswer(question);
  const answer = answerFor(current.question);
  const isChecked = !!checked[current.question.id];
  const correct = isChecked && gradeQuestion(current.question, answer);
  const pack = packs.get(current.subjectId);

  const check = () => setChecked((prev) => ({ ...prev, [current.question.id]: true }));

  const next = () => {
    if (position + 1 < entries.length) {
      setPosition(position + 1);
      return;
    }
    // Finish: unanswered entries count as wrong (QuizRunner semantics), and
    // one partial attempt lands per touched subject so ingest stays per-deck.
    const resultsBySubject = new Map<string, { questionId: string; correct: boolean }[]>();
    for (const entry of entries) {
      const list = resultsBySubject.get(entry.subjectId) ?? [];
      list.push({
        questionId: entry.question.id,
        correct: gradeQuestion(entry.question, answerFor(entry.question)),
      });
      resultsBySubject.set(entry.subjectId, list);
    }
    const stamp = Date.now();
    const date = new Date().toISOString();
    for (const [subjectId, results] of resultsBySubject) {
      recordQuiz(subjectId, {
        id: `hub-review-${stamp}`,
        scope: 'hub-review',
        date,
        total: results.length,
        correct: results.filter((result) => result.correct).length,
        questionResults: results,
      });
    }
    setFinished(true);
  };

  const restart = () => {
    setPosition(0);
    setAnswers({});
    setChecked({});
    setFinished(false);
    setRunId((id) => id + 1); // re-pull whatever is still due
  };

  if (finished) {
    const total = entries.length;
    const correctCount = entries.filter(
      (entry) => checked[entry.question.id] && gradeQuestion(entry.question, answerFor(entry.question)),
    ).length;
    const misses = entries.filter(
      (entry) => !(checked[entry.question.id] && gradeQuestion(entry.question, answerFor(entry.question))),
    );
    const pct = Math.round((correctCount / total) * 100);

    return (
      <div className="quiz-finish">
        <span className="caption">Review session complete</span>
        <p className={`quiz-score${pct >= 70 ? ' good' : ''}`}>
          {correctCount} of {total} correct ({pct}%)
        </p>
        <p className="lead">
          {misses.length === 0
            ? 'Clean sweep — every due card held up. Boxes move up; see you next interval.'
            : 'Missed cards went back to box 1 and resurface soonest. The lessons below are worth another pass.'}
        </p>
        {misses.length > 0 && (
          <div className="quiz-misses">
            <h3>To revisit</h3>
            <ul>
              {misses.map((entry) => {
                const href = packs.get(entry.subjectId)?.lessonHref(entry.question);
                return (
                  <li key={`${entry.subjectId}:${entry.question.id}`}>
                    {href ? (
                      <a href={href}>{entry.question.prompt}</a>
                    ) : (
                      <span>{entry.question.prompt}</span>
                    )}
                    <Pill tone="warn">{packs.get(entry.subjectId)?.code ?? entry.subjectId}</Pill>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="quiz-actions">
          <Button onClick={restart} icon={RotateCcw}>
            Review what's still due
          </Button>
          <Button href="#/" variant="secondary">
            Back to the hub
          </Button>
        </div>
      </div>
    );
  }

  const reviewHref = pack?.lessonHref(current.question);

  return (
    <DocResolverProvider resolveDoc={pack?.resolveDoc}>
      <div className="quiz-head">
        <a className="back-link" href="#/">
          ← Hub home
        </a>
        <h2 className="quiz-title">Spaced review</h2>
        <div className="quiz-meta">
          <Pill>
            Question {position + 1} of {entries.length}
          </Pill>
          {pack && <Pill tone="accent">{pack.code}</Pill>}
          <Pill>{KIND_LABELS[current.question.kind as QuestionKind] ?? current.question.kind}</Pill>
        </div>
        <ProgressBar value={(position + (isChecked ? 1 : 0)) / entries.length} label="Review progress" />
      </div>

      <div className="quiz-card">
        <div className="quiz-stem">
          <Markdown>{current.question.prompt}</Markdown>
        </div>

        {renderQuestion(
          current.question,
          answer,
          (nextAnswer) => setAnswers((prev) => ({ ...prev, [current.question.id]: nextAnswer })),
          isChecked, // locked = revealed
          isChecked,
        )}

        {isChecked && (
          <div className={`quiz-feedback${correct ? ' correct' : ' incorrect'}`}>
            <span className="quiz-feedback-verdict">{correct ? 'Correct' : 'Not quite'}</span>
            <Markdown>{current.question.explanation}</Markdown>
            {reviewHref && (
              <div className="quiz-feedback-links">
                <a href={reviewHref}>Review the lesson</a>
              </div>
            )}
          </div>
        )}

        <div className="quiz-actions">
          {isChecked ? (
            <Button onClick={next}>
              {position + 1 < entries.length ? 'Next question' : 'See results'}
            </Button>
          ) : (
            <Button onClick={check} disabled={!answerReady(current.question, answer)}>
              Check answer
            </Button>
          )}
        </div>
      </div>
    </DocResolverProvider>
  );
}
