import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { CodeBlock } from '../../ui/CodeBlock';
import { InlineText } from '../../ui/InlineText';
import type { Answer, Question, QuestionKind } from '../types';

/**
 * Question-kind registry: per-kind `{ render, grade }`. Graders are pure and
 * frozen — merged from learn-gh-200's per-kind functions and learn-dp-800's
 * dispatch onto the unified `Answer = string[]` encoding. No partial credit
 * anywhere: an answer is right or it is not.
 *
 * Renderers own the answering controls and their selected/revealed visual
 * states (dp-800's interaction models, brand classes). The viewer — QuizRunner,
 * ExamEngine, lesson knowledge check — owns the stem, kind chip, feedback
 * banner, explanation, doc links, progress, and actions. Answers stay
 * `string[]` end to end; the runner passes `answer[questionId] ?? []` and
 * never rewrites encodings.
 */

export class UnknownQuestionKindError extends Error {
  override readonly name = 'UnknownQuestionKindError';
  readonly kind: string;
  constructor(kind: string, registered: string[]) {
    super(`unknown question kind "${kind}" (registered: ${registered.join(', ') || 'none'})`);
    this.kind = kind;
  }
}

/** Display label per core kind — the viewer's kind chip. */
export const KIND_LABELS: Record<QuestionKind, string> = {
  single: 'Single choice',
  codeReading: 'Code reading',
  bug: 'Spot the bug',
  multi: 'Choose all that apply',
  order: 'Order the steps',
  matching: 'Match the pairs',
  fill: 'Fill in the blanks',
};

/** Neutral starting answer for a kind (order starts as the given option order). */
export function initialAnswer(question: Question): Answer {
  switch (question.kind) {
    case 'order':
      return question.options.map((option) => option.id);
    case 'fill':
      return question.blanks.map(() => '');
    default:
      return [];
  }
}

/** Can the learner submit? Every core kind needs its answer fully shaped. */
export function answerReady(question: Question, answer: Answer): boolean {
  switch (question.kind) {
    case 'multi':
      return answer.length > 0;
    case 'order':
      return answer.length === question.options.length;
    case 'matching':
      return answer.length === question.pairs.length;
    case 'fill':
      return (
        answer.length === question.blanks.length && answer.every((value) => value.trim().length > 0)
      );
    default:
      return answer.length === 1; // single, codeReading, bug
  }
}

/* ------------------------------ shared helpers ----------------------------- */

/** Compare two string arrays as sets (order-insensitive). */
export function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  return b.every((x) => sa.has(x));
}

/** Compare two string arrays as ordered sequences. */
export function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x === b[i]);
}

/** Normalize a fill blank: trim, collapse whitespace, strip wrapping `[]`,
 *  case-fold. (Confirmed: case-insensitive superset of the legacy behavior.) */
export function normalizeBlank(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\[|\]$/g, '')
    .toUpperCase();
}

/** Matching answers are `leftIndex::right` tokens (dp-800 encoding). */
export function matchingTokens(pairs: { right: string }[]): string[] {
  return pairs.map((p, i) => `${i}::${p.right}`);
}

/* ------------------------------- registration ------------------------------ */

export type QuestionOf<K extends QuestionKind> = Extract<Question, { kind: K }>;

export type QuestionRenderer<K extends QuestionKind> = (
  question: QuestionOf<K>,
  answer: Answer,
  onAnswer: (answer: Answer) => void,
  disabled?: boolean,
  /** When true, correctness is revealed (immediate feedback / review). */
  revealed?: boolean,
) => ReactNode;
export type QuestionGrader<K extends QuestionKind> = (
  question: QuestionOf<K>,
  answer: Answer,
) => boolean;

export interface QuestionHandler {
  render: (
    question: Question,
    answer: Answer,
    onAnswer: (a: Answer) => void,
    disabled?: boolean,
    revealed?: boolean,
  ) => ReactNode;
  grade: (question: Question, answer: Answer) => boolean;
}

/** Handler form for kinds outside the core question schema. */
export type ExtensionQuestionHandler = {
  render: (
    question: Question,
    answer: Answer,
    onAnswer: (a: Answer) => void,
    disabled?: boolean,
    revealed?: boolean,
  ) => ReactNode;
  grade: (question: Question, answer: Answer) => boolean;
};

const handlers = new Map<string, QuestionHandler>();

/**
 * Register a handler for a question kind. Core kinds get render/grade narrowed
 * to their exact shape; extension kinds take the open form.
 */
export function registerQuestionKind<K extends string>(
  kind: K,
  handler: K extends QuestionKind
    ? { render: QuestionRenderer<K & QuestionKind>; grade: QuestionGrader<K & QuestionKind> }
    : ExtensionQuestionHandler,
): void {
  handlers.set(kind, handler as unknown as QuestionHandler);
}

export function getQuestionHandler(kind: string): QuestionHandler {
  const handler = handlers.get(kind);
  if (!handler) throw new UnknownQuestionKindError(kind, [...handlers.keys()]);
  return handler;
}

export function getQuestionGrader(kind: string): (question: Question, answer: Answer) => boolean {
  return getQuestionHandler(kind).grade;
}

export function registeredQuestionKinds(): string[] {
  return [...handlers.keys()];
}

/** Render one question's answering UI. */
export function renderQuestion(
  question: Question,
  answer: Answer,
  onAnswer: (a: Answer) => void,
  disabled?: boolean,
  revealed?: boolean,
): ReactNode {
  return getQuestionHandler(question.kind).render(question, answer, onAnswer, disabled, revealed);
}

/**
 * Grade any question by dispatching through the registry. Empty answers are
 * wrong (unanswered questions count as wrong, matching the real exams).
 */
export function gradeQuestion(question: Question, answer: Answer): boolean {
  if (!answer || answer.length === 0) return false;
  return getQuestionHandler(question.kind).grade(question, answer);
}

/* --------------------------------- graders --------------------------------- */

const gradeSingleLike = (correct: string) => (answer: Answer) =>
  answer.length === 1 && answer[0] === correct;

const gradeOptionSet = (correct: string[]) => (answer: Answer) => sameSet(answer, correct);
const gradeSequence = (correct: string[]) => (answer: Answer) => sameOrder(answer, correct);

/* ----------------------------- render scaffolding --------------------------- */
/* dp-800's interaction models re-keyed to the unified schema and brand
 * classes. `locked` = disabled || revealed: a revealed control is inert. */

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong';

function optionState(
  selected: boolean,
  isCorrect: boolean,
  revealed: boolean,
): OptionState {
  if (!revealed) return selected ? 'selected' : 'idle';
  if (isCorrect) return 'correct';
  return selected ? 'wrong' : 'idle';
}

interface OptionRowProps {
  chip: string;
  state: OptionState;
  multi: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function OptionRow({ chip, state, multi, disabled, onClick, children }: OptionRowProps) {
  return (
    <button
      type="button"
      className={`q-opt q-opt-${state}`}
      aria-pressed={state === 'selected' || state === 'wrong'}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={`q-chip q-chip-${state} ${multi ? 'q-chip-box' : ''}`} aria-hidden="true">
        {state === 'correct' ? (
          <Check size={13} strokeWidth={2.25} />
        ) : state === 'wrong' ? (
          <X size={13} strokeWidth={2.25} />
        ) : (
          chip
        )}
      </span>
      <span className="q-opt-text">{children}</span>
    </button>
  );
}

/* -------------------------- core kind registrations ------------------------- */

registerQuestionKind('single', {
  grade: (question, answer) => gradeSingleLike(question.correct)(answer),
  render: (question, answer, onAnswer, disabled, revealed) => (
    <div className="q-opts" role="group" aria-label="Answer options">
      {question.options.map((option, index) => (
        <OptionRow
          key={option.id}
          chip={String.fromCharCode(65 + index)}
          state={optionState(answer[0] === option.id, question.correct === option.id, !!revealed)}
          multi={false}
          disabled={!!disabled || !!revealed}
          onClick={() => onAnswer([option.id])}
        >
          <InlineText text={option.text} />
        </OptionRow>
      ))}
    </div>
  ),
});

registerQuestionKind('codeReading', {
  grade: (question, answer) => gradeSingleLike(question.correct)(answer),
  render: (question, answer, onAnswer, disabled, revealed) => (
    <div className="q-body">
      <CodeBlock code={question.code} />
      <div className="q-opts" role="group" aria-label="Answer options">
        {question.options.map((option, index) => (
          <OptionRow
            key={option.id}
            chip={String.fromCharCode(65 + index)}
            state={optionState(
              answer[0] === option.id,
              question.correct === option.id,
              !!revealed,
            )}
            multi={false}
            disabled={!!disabled || !!revealed}
            onClick={() => onAnswer([option.id])}
          >
            <InlineText text={option.text} />
          </OptionRow>
        ))}
      </div>
    </div>
  ),
});

registerQuestionKind('bug', {
  grade: (question, answer) => gradeSingleLike(String(question.buggyLineIndex))(answer),
  render: (question, answer, onAnswer, disabled, revealed) => (
    <div className="q-opts q-opts-lines" role="group" aria-label="Pick the buggy line">
      {question.codeLines.map((line, index) => (
        <OptionRow
          key={index}
          chip={String(index + 1)}
          state={optionState(
            answer[0] === String(index),
            question.buggyLineIndex === index,
            !!revealed,
          )}
          multi={false}
          disabled={!!disabled || !!revealed}
          onClick={() => onAnswer([String(index)])}
        >
          <code>{line}</code>
        </OptionRow>
      ))}
    </div>
  ),
});

registerQuestionKind('multi', {
  grade: (question, answer) => gradeOptionSet(question.correct)(answer),
  render: (question, answer, onAnswer, disabled, revealed) => (
    <div className="q-opts" role="group" aria-label="Answer options">
      {question.options.map((option, index) => (
        <OptionRow
          key={option.id}
          chip={String.fromCharCode(65 + index)}
          state={optionState(
            answer.includes(option.id),
            question.correct.includes(option.id),
            !!revealed,
          )}
          multi
          disabled={!!disabled || !!revealed}
          onClick={() =>
            onAnswer(
              answer.includes(option.id)
                ? answer.filter((id) => id !== option.id)
                : [...answer, option.id],
            )
          }
        >
          <InlineText text={option.text} />
        </OptionRow>
      ))}
    </div>
  ),
});

registerQuestionKind('order', {
  grade: (question, answer) => gradeSequence(question.correct)(answer),
  render: (question, answer, onAnswer, disabled, revealed) => {
    const locked = !!disabled || !!revealed;
    const byId = new Map(question.options.map((o) => [o.id, o] as const));
    // The displayed order IS the answer: the given option order until the
    // learner moves something (the runner seeds it via initialAnswer).
    const list =
      answer.length === question.options.length ? answer : question.options.map((o) => o.id);

    const move = (index: number, direction: -1 | 1) => {
      if (locked) return;
      const target = index + direction;
      if (target < 0 || target >= list.length) return;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      onAnswer(next);
    };

    return (
      <ol className="q-order">
        {list.map((id, index) => {
          const state: OptionState = revealed
            ? question.correct[index] === id
              ? 'correct'
              : 'wrong'
            : 'idle';
          const label = byId.get(id)?.text ?? id;
          return (
            <li key={id} className={`q-order-row q-order-${state}`}>
              <span className="q-order-pos" aria-hidden="true">
                {index + 1}
              </span>
              <span className="q-order-text">
                <InlineText text={label} />
              </span>
              {!locked && (
                <span className="q-order-moves">
                  <button
                    type="button"
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp size={15} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${label} down`}
                    disabled={index === list.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown size={15} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    );
  },
});

registerQuestionKind('matching', {
  grade: (question, answer) => sameSet(answer, matchingTokens(question.pairs)),
  render: (question, answer, onAnswer, disabled, revealed) => {
    const locked = !!disabled || !!revealed;
    // Keyed by left index throughout: duplicate (or `::`-bearing) right values
    // must never break rendering or React keys.
    const rights = question.pairs.map((p) => p.right);
    const chosen = (leftIndex: number) =>
      // Slice past the `<leftIndex>::` prefix — the right value itself may
      // contain `::` (std::vector), so split-indexing would truncate it.
      answer.find((token) => token.startsWith(`${leftIndex}::`))?.slice(String(leftIndex).length + 2) ?? '';

    const set = (leftIndex: number, right: string) => {
      if (locked) return;
      const rest = answer.filter((token) => !token.startsWith(`${leftIndex}::`));
      onAnswer(right === '' ? rest : [...rest, `${leftIndex}::${right}`]);
    };

    return (
      <div className="q-match">
        {question.pairs.map((pair, leftIndex) => {
          const picked = chosen(leftIndex);
          const ok = revealed && picked === pair.right;
          const missed = revealed && picked !== pair.right;
          return (
            <div key={leftIndex} className={`q-match-row q-match-${ok ? 'ok' : missed ? 'bad' : 'idle'}`}>
              <span className="q-match-left">
                <InlineText text={pair.left} />
              </span>
              <span className="q-match-pick">
                <select
                  aria-label={pair.left}
                  value={picked}
                  disabled={locked}
                  onChange={(event) => set(leftIndex, event.target.value)}
                >
                  <option value="">Choose…</option>
                  {rights.map((right, rightIndex) => (
                    <option key={rightIndex} value={right}>
                      {right}
                    </option>
                  ))}
                </select>
                {missed && (
                  <span className="q-match-answer" role="note" aria-label="Correct answer">
                    → {pair.right}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  },
});

registerQuestionKind('fill', {
  grade: (question, answer) => {
    if (answer.length !== question.blanks.length) return false;
    return question.blanks.every((blank, i) => {
      const given = normalizeBlank(answer[i] ?? '');
      if (given.length === 0) return false;
      const allowed = [blank.answer, ...(blank.alternatives ?? [])].map(normalizeBlank);
      return allowed.includes(given);
    });
  },
  render: (question, answer, onAnswer, disabled, revealed) => {
    const locked = !!disabled || !!revealed;
    const parts = question.template.split('___');
    const blankOk = (index: number) => {
      if (!revealed) return false;
      const blank = question.blanks[index];
      const allowed = [blank.answer, ...(blank.alternatives ?? [])].map(normalizeBlank);
      return allowed.includes(normalizeBlank(answer[index] ?? ''));
    };

    return (
      <div className="q-fill">
        <pre className="q-fill-pre">
          <code>
            {parts.map((part, index) => (
              <span key={index}>
                {part}
                {index < question.blanks.length && (
                  <input
                    type="text"
                    className={`q-fill-input${revealed ? (blankOk(index) ? ' q-fill-ok' : ' q-fill-bad') : ''}`}
                    value={answer[index] ?? ''}
                    aria-label={`Blank ${index + 1} of ${question.blanks.length}`}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    disabled={locked}
                    onChange={(event) => {
                      const next = answer.slice(0, question.blanks.length);
                      next[index] = event.target.value;
                      onAnswer(next);
                    }}
                  />
                )}
              </span>
            ))}
          </code>
        </pre>
        {revealed && (
          <p className="q-fill-expected">
            Expected: {question.blanks.map((blank) => blank.answer).join(' · ')}
          </p>
        )}
      </div>
    );
  },
});
