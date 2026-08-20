import type { SubjectContent } from '../types';
import type { ValidationIssue } from '../validate';
import { getBlockRenderer, UnknownBlockKindError } from './blocks';
import { getQuestionHandler, UnknownQuestionKindError } from './questions';

/**
 * Registry coverage: every block and question kind a pack actually uses must
 * have a registered renderer/grader before the app renders it. Schema
 * validation proves packs are well-formed; this proves the runtime can draw
 * them. `content:check` runs both, so an unregistered kind fails the gate
 * the same way a schema violation does.
 */

export function registryCoverageIssues(content: SubjectContent): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const lesson of content.lessons) {
    for (const block of lesson.blocks) {
      try {
        getBlockRenderer(block.kind);
      } catch (error) {
        if (error instanceof UnknownBlockKindError) {
          issues.push({
            code: 'unknown-block-kind',
            path: `lessons/${lesson.id}/blocks/${block.kind}`,
            message: error.message,
          });
        } else {
          throw error;
        }
      }
    }
  }

  for (const question of content.questions) {
    try {
      getQuestionHandler(question.kind);
    } catch (error) {
      if (error instanceof UnknownQuestionKindError) {
        issues.push({
          code: 'unknown-question-kind',
          path: `questions/${question.id}`,
          message: error.message,
        });
      } else {
        throw error;
      }
    }
  }

  return issues;
}

/** Throw with a collected report if any kind in the pack lacks a handler. */
export function assertKindsRegistered(content: SubjectContent): void {
  const issues = registryCoverageIssues(content);
  if (issues.length > 0) {
    const lines = issues.map((issue) => `  - [${issue.code}] ${issue.path}: ${issue.message}`);
    throw new Error(`registry coverage failed:\n${lines.join('\n')}`);
  }
}
