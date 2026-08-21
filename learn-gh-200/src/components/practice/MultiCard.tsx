import type { Question } from '../../content/types';
import { InlineText } from '../ui/InlineText';

interface MultiCardProps {
  question: Extract<Question, { kind: 'multi' }>;
  answer: number[];
  onAnswer: (indexes: number[]) => void;
  revealed: boolean;
}

/** Choose-all-that-apply question: toggles graded as an exact set. */
export function MultiCard({ question, answer, onAnswer, revealed }: MultiCardProps) {
  const correctSet = question.answerIndexes;

  const toggle = (index: number) => {
    if (revealed) return;
    onAnswer(answer.includes(index) ? answer.filter((i) => i !== index) : [...answer, index]);
  };

  return (
    <div className="quiz-options" aria-label="Options">
      {question.options.map((option, index) => {
        // A multi option is "correct-flagged" only when the whole set is right
        // or wrong — per-option truth comes from the authored answer set.
        const state = revealed
          ? correctSet.includes(index)
            ? 'correct'
            : answer.includes(index)
              ? 'wrong'
              : 'muted'
          : answer.includes(index)
            ? 'selected'
            : '';
        return (
          <button
            key={index}
            type="button"
            role="checkbox"
            aria-checked={answer.includes(index)}
            className={`quiz-option${state ? ` ${state}` : ''}`}
            disabled={revealed}
            onClick={() => toggle(index)}
          >
            <span className="quiz-option-key" aria-hidden>
              {String.fromCharCode(65 + index)}
            </span>
            <span className="quiz-option-text">
              <InlineText text={option} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
