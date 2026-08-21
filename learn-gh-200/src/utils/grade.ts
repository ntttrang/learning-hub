import type { Question } from '../content/types';

/**
 * Pure grading for the five question kinds. Practice uses these directly and
 * the mock exams import the same functions, so the signatures are frozen:
 * every grader returns a plain boolean and never mutates its arguments.
 *
 * No partial credit anywhere — an answer is right or it is not, matching how
 * the real exams score a question.
 */

/** What a learner submits, by kind: index (single, bug), indexes (multi,
 * order), or one string per blank (fill). */
export type QuestionAnswer = number | number[] | string[];

/** Collapse whitespace and trim: the only normalization fill answers get. */
function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Index sets match when they hold exactly the same members, any order. */
function sameIndexSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((index) => b.includes(index));
}

export function gradeSingle(
  question: Extract<Question, { kind: 'single' }>,
  answer: number,
): boolean {
  return answer === question.answerIndex;
}

/** Every correct option and nothing else — missing one or adding one is wrong. */
export function gradeMulti(
  question: Extract<Question, { kind: 'multi' }>,
  answer: number[],
): boolean {
  return sameIndexSet(answer, question.answerIndexes);
}

/**
 * Fill answers are compared case-sensitively after trimming and collapsing
 * internal whitespace. Each blank must match its own answer or one of the
 * authored alternatives exactly; an empty or missing entry is wrong.
 */
export function gradeFill(
  question: Extract<Question, { kind: 'fill' }>,
  answer: string[],
): boolean {
  if (answer.length !== question.blanks.length) return false;
  return question.blanks.every((blank, index) => {
    const given = normalize(answer[index] ?? '');
    if (given.length === 0) return false;
    return (
      given === normalize(blank.answer) ||
      blank.alternatives.some((alt) => given === normalize(alt))
    );
  });
}

export function gradeBug(
  question: Extract<Question, { kind: 'bug' }>,
  answer: number,
): boolean {
  return answer === question.buggyLineIndex;
}

/**
 * Order answers are sequences of authored indexes. Items are authored in the
 * correct order, so the right sequence is the identity [0, 1, 2, …].
 */
export function gradeOrder(
  question: Extract<Question, { kind: 'order' }>,
  answer: number[],
): boolean {
  return (
    answer.length === question.items.length &&
    answer.every((authoredIndex, position) => authoredIndex === position)
  );
}

/** Grade any question by dispatching on its kind. */
export function gradeQuestion(question: Question, answer: QuestionAnswer): boolean {
  switch (question.kind) {
    case 'single':
      return typeof answer === 'number' && gradeSingle(question, answer);
    case 'multi':
      return Array.isArray(answer) && answer.every((a) => typeof a === 'number') && gradeMulti(question, answer);
    case 'fill':
      return Array.isArray(answer) && answer.every((a) => typeof a === 'string') && gradeFill(question, answer);
    case 'bug':
      return typeof answer === 'number' && gradeBug(question, answer);
    case 'order':
      return Array.isArray(answer) && answer.every((a) => typeof a === 'number') && gradeOrder(question, answer);
  }
}
