import type { Question } from '../../content/types';
import { optionState } from './SingleCard';

interface BugCardProps {
  question: Extract<Question, { kind: 'bug' }>;
  answer: number | null;
  onAnswer: (index: number) => void;
  revealed: boolean;
}

/** Spot-the-bug: numbered, clickable code lines; one of them breaks things. */
export function BugCard({ question, answer, onAnswer, revealed }: BugCardProps) {
  return (
    <div className="codeblock bug-code">
      <span className="codeblock-lang">code</span>
      <ol className="bug-lines">
        {question.codeLines.map((line, index) => {
          const state = optionState(index, question.buggyLineIndex, answer, revealed);
          return (
            <li key={index}>
              <button
                type="button"
                className={`bug-line${state ? ` ${state}` : ''}`}
                aria-pressed={answer === index}
                aria-label={`Mark line ${index + 1} as the bug`}
                disabled={revealed}
                onClick={() => onAnswer(index)}
              >
                <span className="bug-line-no" aria-hidden>
                  {index + 1}
                </span>
                <code>{line.length > 0 ? line : ' '}</code>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
