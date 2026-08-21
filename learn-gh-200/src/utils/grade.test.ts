import { describe, expect, it } from 'vitest';
import type { Question } from '../content/types';
import {
  gradeBug,
  gradeFill,
  gradeMulti,
  gradeOrder,
  gradeQuestion,
  gradeSingle,
  type QuestionAnswer,
} from './grade';

const single: Question = {
  id: 't-single',
  cert: 'gh900',
  domainId: 'gh900-d1',
  subSkillId: 'd1-version-control',
  stem: 'Pick one',
  kind: 'single',
  options: ['a', 'b', 'c', 'd'],
  answerIndex: 2,
  explanation: 'Because c.',
  docId: 'about-git',
};

const multi: Question = {
  id: 't-multi',
  cert: 'gh900',
  domainId: 'gh900-d1',
  subSkillId: 'd1-git-vs-github',
  stem: 'Pick all that apply',
  kind: 'multi',
  options: ['a', 'b', 'c', 'd', 'e'],
  answerIndexes: [1, 3],
  explanation: 'Because b and d.',
  docId: 'hello-world',
};

const fill: Question = {
  id: 't-fill',
  cert: 'gh900',
  domainId: 'gh900-d4',
  subSkillId: 'd4-actions-purpose',
  stem: 'Complete the trigger',
  kind: 'fill',
  codeTemplate: 'on:\n  push:\n    branches: [___]',
  blanks: [{ answer: 'main', alternatives: ['Main'] }],
  explanation: 'Because branches.',
  docId: 'gh-docs-actions',
};

const bug: Question = {
  id: 't-bug',
  cert: 'gh900',
  domainId: 'gh900-d4',
  subSkillId: 'd4-actions-purpose',
  stem: 'Find the broken line',
  kind: 'bug',
  codeLines: ['on:', '  push:', 'jobs:', '  build:'],
  buggyLineIndex: 2,
  explanation: 'Because jobs.',
  docId: 'gh-docs-actions',
};

const order: Question = {
  id: 't-order',
  cert: 'gh900',
  domainId: 'gh900-d1',
  subSkillId: 'd1-github-flow',
  stem: 'Order the steps',
  kind: 'order',
  items: ['branch', 'commit', 'pull request', 'merge'],
  explanation: 'Because flow.',
  docId: 'github-flow',
};

describe('gradeSingle', () => {
  it('is right only on the exact answer index', () => {
    expect(gradeSingle(single as never, 2)).toBe(true);
    expect(gradeSingle(single as never, 0)).toBe(false);
    expect(gradeSingle(single as never, 3)).toBe(false);
  });
});

describe('gradeMulti', () => {
  const q = multi as Extract<Question, { kind: 'multi' }>;

  it('accepts the correct set in any order', () => {
    expect(gradeMulti(q, [1, 3])).toBe(true);
    expect(gradeMulti(q, [3, 1])).toBe(true);
  });

  it('rejects a subset, a superset, and a wrong member', () => {
    expect(gradeMulti(q, [1])).toBe(false);
    expect(gradeMulti(q, [1, 3, 0])).toBe(false);
    expect(gradeMulti(q, [1, 2])).toBe(false);
  });

  it('rejects duplicates of the right members', () => {
    expect(gradeMulti(q, [1, 1, 3])).toBe(false);
  });
});

describe('gradeFill normalization', () => {
  const q = fill as Extract<Question, { kind: 'fill' }>;

  it('accepts the exact answer and authored alternatives', () => {
    expect(gradeFill(q, ['main'])).toBe(true);
    expect(gradeFill(q, ['Main'])).toBe(true);
  });

  it('trims and collapses whitespace but keeps case-sensitivity', () => {
    expect(gradeFill(q, ['  main '])).toBe(true);
    expect(gradeFill(q, ['m a i n'])).toBe(false);
    expect(gradeFill(q, ['MAIN'])).toBe(false);
  });

  it('treats empty and missing answers as wrong', () => {
    expect(gradeFill(q, [''])).toBe(false);
    expect(gradeFill(q, ['   '])).toBe(false);
    expect(gradeFill(q, [])).toBe(false);
  });

  it('requires every blank to match its own position', () => {
    const twoBlanks: Extract<Question, { kind: 'fill' }> = {
      ...q,
      blanks: [
        { answer: 'on', alternatives: [] },
        { answer: 'push', alternatives: [] },
      ],
    };
    expect(gradeFill(twoBlanks, ['on', 'push'])).toBe(true);
    expect(gradeFill(twoBlanks, ['push', 'on'])).toBe(false);
    expect(gradeFill(twoBlanks, ['on'])).toBe(false);
  });

  it('never fuzzy-matches a substring', () => {
    expect(gradeFill(q, ['main-branch'])).toBe(false);
    expect(gradeFill(q, ['the main'])).toBe(false);
  });
});

describe('gradeBug', () => {
  it('is right only on the buggy line', () => {
    expect(gradeBug(bug as never, 2)).toBe(true);
    expect(gradeBug(bug as never, 0)).toBe(false);
  });
});

describe('gradeOrder', () => {
  const q = order as Extract<Question, { kind: 'order' }>;

  it('accepts the authored sequence', () => {
    expect(gradeOrder(q, [0, 1, 2, 3])).toBe(true);
  });

  it('rejects any swap, truncation, or extra item', () => {
    expect(gradeOrder(q, [0, 2, 1, 3])).toBe(false);
    expect(gradeOrder(q, [0, 1, 2])).toBe(false);
    expect(gradeOrder(q, [0, 1, 2, 3, 0])).toBe(false);
  });
});

describe('gradeQuestion dispatcher', () => {
  it('grades each kind through its own grader', () => {
    expect(gradeQuestion(single, 2)).toBe(true);
    expect(gradeQuestion(single, 1)).toBe(false);
    expect(gradeQuestion(multi, [3, 1])).toBe(true);
    expect(gradeQuestion(multi, [1])).toBe(false);
    expect(gradeQuestion(fill, [' main '])).toBe(true);
    expect(gradeQuestion(fill, ['nope'])).toBe(false);
    expect(gradeQuestion(bug, 2)).toBe(true);
    expect(gradeQuestion(bug, 1)).toBe(false);
    expect(gradeQuestion(order, [0, 1, 2, 3])).toBe(true);
    expect(gradeQuestion(order, [3, 2, 1, 0])).toBe(false);
  });

  it('rejects answers of the wrong shape for the kind', () => {
    // Casts are the point: callers feed junk and the dispatcher guards it.
    expect(gradeQuestion(single, [2] as unknown as QuestionAnswer)).toBe(false);
    expect(gradeQuestion(bug, '2' as unknown as QuestionAnswer)).toBe(false);
    expect(gradeQuestion(order, [0, 1, 2, '3'] as unknown as QuestionAnswer)).toBe(false);
    expect(gradeQuestion(fill, [2] as unknown as QuestionAnswer)).toBe(false);
  });
});
