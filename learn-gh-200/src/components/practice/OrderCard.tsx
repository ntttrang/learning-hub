import { useMemo } from 'react';
import type { Question } from '../../content/types';

interface OrderCardProps {
  question: Extract<Question, { kind: 'order' }>;
  /** Authored indexes in the learner's chosen order. */
  answer: number[];
  onAnswer: (order: number[]) => void;
  revealed: boolean;
}

/**
 * Order-the-steps: click steps from the shuffled pool to append them to your
 * sequence; click a chosen step to send it back. No drag library — the items
 * are authored in the correct order, so that array is the answer key.
 */
export function OrderCard({ question, answer, onAnswer, revealed }: OrderCardProps) {
  // Shuffle the pool once per question; recompute only when the question or
  // the build state changes so buttons don't jump around mid-click.
  const poolOrder = useMemo(() => shuffle(question.items.length), [question.id, question.items.length]);

  const pool = poolOrder.filter((authoredIndex) => !answer.includes(authoredIndex));

  const append = (authoredIndex: number) => {
    if (!revealed) onAnswer([...answer, authoredIndex]);
  };

  const remove = (position: number) => {
    if (!revealed) onAnswer(answer.filter((_, i) => i !== position));
  };

  return (
    <div className="order-card">
      <p className="order-hint">
        Click the steps in the order they should run — click a chosen step to remove it.
      </p>
      <div className="order-sequence" aria-label="Your sequence">
        <span className="order-zone-label">Your sequence</span>
        {answer.length === 0 && <p className="order-empty">Nothing yet — start clicking steps below.</p>}
        <ol>
          {answer.map((authoredIndex, position) => {
            const rightSpot = authoredIndex === position;
            return (
              <li key={`${authoredIndex}-${position}`}>
                <button
                  type="button"
                  className={`order-step${revealed ? (rightSpot ? ' correct' : ' wrong') : ''}`}
                  disabled={revealed}
                  aria-label={`Remove step ${position + 1}: ${question.items[authoredIndex]}`}
                  onClick={() => remove(position)}
                >
                  <span className="order-step-no" aria-hidden>
                    {position + 1}
                  </span>
                  {question.items[authoredIndex]}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {!revealed && (
        <div className="order-pool" aria-label="Steps to place">
          <span className="order-zone-label">Remaining steps</span>
          {pool.map((authoredIndex) => (
            <button
              key={authoredIndex}
              type="button"
              className="order-chip"
              onClick={() => append(authoredIndex)}
            >
              {question.items[authoredIndex]}
            </button>
          ))}
        </div>
      )}
      {revealed && (
        <div className="order-expected">
          <span className="order-zone-label">Correct order</span>
          <ol>
            {question.items.map((item, index) => (
              <li key={index}>
                <span className="order-step-no" aria-hidden>
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Fisher–Yates over authored indexes [0..n-1]. */
function shuffle(n: number): number[] {
  const indexes = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes;
}
