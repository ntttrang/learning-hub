import type { Question } from '../../content/types';
import type { QuestionAnswer } from '../../utils/grade';
import { SingleCard } from './SingleCard';
import { MultiCard } from './MultiCard';
import { FillCard } from './FillCard';
import { BugCard } from './BugCard';
import { OrderCard } from './OrderCard';

/**
 * The per-kind card dispatcher plus the answer-shaping helpers every quiz
 * flow shares. Practice (immediate feedback) and the mock exams (no
 * feedback until submit) render the exact same cards — only `revealed`
 * differs, so an exam question is never a forked copy of a practice one.
 */

export const KIND_LABELS: Record<Question['kind'], string> = {
  single: 'Single choice',
  multi: 'Choose all that apply',
  fill: 'Fill in the blank',
  bug: 'Spot the bug',
  order: 'Order the steps',
};

/** Pull only the numeric entries: multi and order answers. */
export function numberArray(value: QuestionAnswer | null): number[] {
  return Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === 'number') : [];
}

/** Pull only the string entries: fill answers, one per blank. */
export function stringArray(value: QuestionAnswer | null): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

/** A fill answer always carries one entry per blank, padding with ''. */
function fillArray(
  question: Extract<Question, { kind: 'fill' }>,
  value: QuestionAnswer | null,
): string[] {
  const typed = stringArray(value);
  return question.blanks.map((_, index) => typed[index] ?? '');
}

/** Neutral starting answer for a kind: null = nothing selected yet. */
export function initialAnswer(question: Question): QuestionAnswer | null {
  switch (question.kind) {
    case 'multi':
    case 'order':
      return [];
    case 'fill':
      return question.blanks.map(() => '');
    default:
      return null;
  }
}

/** Can the learner submit? Every kind needs its answer fully shaped. */
export function answerReady(question: Question, answer: QuestionAnswer): boolean {
  switch (question.kind) {
    case 'single':
    case 'bug':
      return typeof answer === 'number';
    case 'multi':
      return Array.isArray(answer) && answer.length > 0;
    case 'fill':
      return (
        Array.isArray(answer) &&
        answer.length === question.blanks.length &&
        answer.every((value) => typeof value === 'string' && value.trim().length > 0)
      );
    case 'order':
      return Array.isArray(answer) && answer.length === question.items.length;
  }
}

interface QuestionCardProps {
  question: Question;
  /** The learner's current answer, null when untouched. */
  answer: QuestionAnswer | null;
  /** Omitted on review screens — revealed cards are inert anyway. */
  onAnswer?: (answer: QuestionAnswer) => void;
  revealed: boolean;
}

/** Render the right card for a question, normalizing the answer per kind. */
export function QuestionCard({ question, answer, onAnswer, revealed }: QuestionCardProps) {
  const change = onAnswer ?? (() => {});
  switch (question.kind) {
    case 'single':
      return (
        <SingleCard
          question={question}
          answer={typeof answer === 'number' ? answer : null}
          onAnswer={change}
          revealed={revealed}
        />
      );
    case 'multi':
      return <MultiCard question={question} answer={numberArray(answer)} onAnswer={change} revealed={revealed} />;
    case 'fill':
      return <FillCard question={question} answer={fillArray(question, answer)} onAnswer={change} revealed={revealed} />;
    case 'bug':
      return (
        <BugCard
          question={question}
          answer={typeof answer === 'number' ? answer : null}
          onAnswer={change}
          revealed={revealed}
        />
      );
    case 'order':
      return <OrderCard question={question} answer={numberArray(answer)} onAnswer={change} revealed={revealed} />;
  }
}
