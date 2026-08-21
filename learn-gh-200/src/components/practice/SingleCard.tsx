import type { Question } from '../../content/types';
import { InlineText } from '../ui/InlineText';

interface SingleCardProps {
  question: Extract<Question, { kind: 'single' }>;
  answer: number | null;
  onAnswer: (index: number) => void;
  revealed: boolean;
}

/** One-correct-option question: a radio list that grades to one index. */
export function SingleCard({ question, answer, onAnswer, revealed }: SingleCardProps) {
  return (
    <div className="quiz-options" role="radiogroup" aria-label="Options">
      {question.options.map((option, index) => {
        const state = optionState(index, question.answerIndex, answer, revealed);
        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={answer === index}
            className={`quiz-option${state ? ` ${state}` : ''}`}
            disabled={revealed}
            onClick={() => onAnswer(index)}
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

/** Shared option highlighting: after reveal, correct wins, a wrong pick flags. */
export function optionState(
  index: number,
  correctIndex: number,
  picked: number | null,
  revealed: boolean,
): '' | 'selected' | 'correct' | 'wrong' | 'muted' {
  if (!revealed) return index === picked ? 'selected' : '';
  if (index === correctIndex) return 'correct';
  if (index === picked) return 'wrong';
  return 'muted';
}
