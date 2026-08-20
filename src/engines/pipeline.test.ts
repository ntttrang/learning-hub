/**
 * End-to-end over the real fixture pack: files → glob → validate → registry
 * coverage → deterministic exam sampling → grading → scoring. This is the
 * Phase 1 spine Phase 2's UI will sit on; if it holds, the content SDK and
 * engines compose correctly.
 */
import { describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { matchingTokens } from '../sdk/registry/questions';
import { assertKindsRegistered } from '../sdk/registry/coverage';
import type { Answer, Question } from '../sdk/types';
import { sampleIds } from './sampling';
import { scoreAttempt } from './scoring';

/** Canonical correct answer for any question kind (the Answer encoding). */
function correctAnswerFor(question: Question): Answer {
  switch (question.kind) {
    case 'single':
    case 'codeReading':
      return [question.correct];
    case 'bug':
      return [String(question.buggyLineIndex)];
    case 'multi':
    case 'order':
      return question.correct;
    case 'matching':
      return matchingTokens(question.pairs);
    case 'fill':
      return question.blanks.map((blank) => blank.answer);
  }
}

/** Guaranteed-wrong answer of the right shape for any kind. */
function wrongAnswerFor(question: Question): Answer {
  switch (question.kind) {
    case 'bug':
      return [String(question.buggyLineIndex + 1)];
    case 'matching':
      return question.pairs.map((_pair, i) => `${i}::definitely-wrong`);
    case 'fill':
      return question.blanks.map(() => 'definitely-wrong');
    default:
      return ['definitely-wrong'];
  }
}

describe('fixture pipeline: load → validate → cover → sample → grade → score', () => {
  const { content, index } = loadSubjectWithIndex('fixture');
  const exam = content.exams.find((e) => e.id === 'exam-practice') ?? content.exams[0];

  it('the pack loads, validates, and every used kind is registered', () => {
    expect(content.subject.id).toBe('fixture');
    expect(() => assertKindsRegistered(content)).not.toThrow();
  });

  it('samples the pinned deterministic selection (seed 42)', () => {
    // Golden value pinned in sampling.test.ts — shared here to prove the
    // whole chain consumes the same draw.
    expect(sampleIds(exam, content.questions)).toEqual([
      'q-single',
      'q-code-reading',
      'q-matching',
      'q-bug',
    ]);
  });

  it('a perfect run scores 1000 and passes', () => {
    const drawn = sampleIds(exam, content.questions).map((id) => index.getQuestion(id)!);
    const answers = Object.fromEntries(
      drawn.map((question) => [question.id, correctAnswerFor(question)]),
    );
    const score = scoreAttempt(exam, drawn, answers);
    expect(score).toMatchObject({ total: 4, correct: 4, accuracy: 1, scaledScore: 1000, passed: true });
    expect(score.perDomain).toHaveLength(2); // one entry per drawn domain
  });

  it('an all-wrong run floors at 100 and fails', () => {
    const drawn = sampleIds(exam, content.questions).map((id) => index.getQuestion(id)!);
    const answers = Object.fromEntries(
      drawn.map((question) => [question.id, wrongAnswerFor(question)]),
    );
    const score = scoreAttempt(exam, drawn, answers);
    expect(score).toMatchObject({ correct: 0, accuracy: 0, scaledScore: 100, passed: false });
  });
});
