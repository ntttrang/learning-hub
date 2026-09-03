import { useEffect, useMemo, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { QuizQuestion } from '../components/QuizQuestion';
import { loadQuiz } from '../lib/data';
import { loadProgress, quizScore } from '../lib/progress';
import { useApp } from '../lib/AppContext';
import type { QuizQuestion as Q } from '../lib/types';

export function KnowledgeCheck() {
  const { lang } = useApp();
  const [questions, setQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIndex(0);
    loadQuiz(lang)
      .then((file) => {
        if (cancelled) return;
        setQuestions(file.questions);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const score = useMemo(() => {
    void tick;
    void loadProgress();
    return quizScore(questions.map((q) => q.id));
  }, [questions, tick]);

  const current = questions[index] ?? null;

  return (
    <div>
      <div className="page-header row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="kicker">Knowledge check</p>
          <h1>Quiz deck</h1>
          <p className="muted">
            Mixed MCQ, multi-select, output prediction, fill-in, and coding (self-check).
          </p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <span className="badge">
          Question {questions.length ? index + 1 : 0} / {questions.length}
        </span>
        <span className="badge success">
          Score {score.correct}/{score.answered} answered
        </span>
      </div>

      <div className="card">
        {!current && <div className="empty">No questions loaded.</div>}
        {current && (
          <QuizQuestion
            key={current.id}
            question={current}
            onGraded={() => setTick((t) => t + 1)}
          />
        )}
      </div>

      <div className="row" style={{ marginTop: 'var(--space-4)' }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={index >= questions.length - 1}
          onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
