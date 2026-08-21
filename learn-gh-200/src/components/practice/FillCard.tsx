import { Fragment } from 'react';
import type { Question } from '../../content/types';
import { gradeFill } from '../../utils/grade';

interface FillCardProps {
  question: Extract<Question, { kind: 'fill' }>;
  answer: string[];
  onAnswer: (values: string[]) => void;
  revealed: boolean;
}

/**
 * YAML fill-in-the-blank: the code template renders as a code block with a
 * text input at each `___` placeholder. Grading is exact (see gradeFill), so
 * the reveal shows the expected spelling next to any blank the learner missed.
 */
export function FillCard({ question, answer, onAnswer, revealed }: FillCardProps) {
  const segments = question.codeTemplate.split('___');

  const setBlank = (index: number, value: string) => {
    onAnswer(answer.map((existing, i) => (i === index ? value : existing)));
  };

  return (
    <div className="codeblock fill-code">
      <span className="codeblock-lang">yaml</span>
      <pre>
        <code>
          {segments.map((segment, index) => (
            <Fragment key={index}>
              {segment}
              {index < question.blanks.length && (
                <>
                  <input
                    type="text"
                    className={`fill-input${revealed ? (blankOk(question, answer, index) ? ' correct' : ' wrong') : ''}`}
                    value={answer[index] ?? ''}
                    disabled={revealed}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label={`Blank ${index + 1} of ${question.blanks.length}`}
                    style={{ width: `${inputWidth(question, answer, index)}ch` }}
                    onChange={(event) => setBlank(index, event.target.value)}
                  />
                  {revealed && !blankOk(question, answer, index) && (
                    <span className="fill-expected">{question.blanks[index].answer}</span>
                  )}
                </>
              )}
            </Fragment>
          ))}
        </code>
      </pre>
    </div>
  );
}

/** Did this one blank pass? Reuses the real grader on a single-blank view. */
function blankOk(
  question: Extract<Question, { kind: 'fill' }>,
  answer: string[],
  index: number,
): boolean {
  const singleBlank: Extract<Question, { kind: 'fill' }> = {
    ...question,
    blanks: [question.blanks[index]],
  };
  return gradeFill(singleBlank, [answer[index] ?? '']);
}

/** Input grows with typing, but never narrower than the expected answer. */
function inputWidth(
  question: Extract<Question, { kind: 'fill' }>,
  answer: string[],
  index: number,
): number {
  const typed = answer[index]?.length ?? 0;
  const expected = question.blanks[index].answer.length;
  return Math.max(typed + 1, expected, 4);
}
