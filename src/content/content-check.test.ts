/**
 * `npm run content:check` — every installed content pack must pass the full
 * pipeline (files → glob → Zod shape → graph validation → registry coverage).
 * One failing pack fails the build, so schema changes and pack edits meet
 * here first.
 */
import { describe, expect, it } from 'vitest';
import { assertKindsRegistered } from '../sdk/registry/coverage';
import { contentSource, loadAllContent } from './registry';

describe('content:check — every installed pack validates', () => {
  it('at least one pack is installed', () => {
    expect(contentSource.listSubjects().length).toBeGreaterThan(0);
  });

  it('every pack loads and validates clean', () => {
    // loadSubject throws ContentValidationError on any schema or contract issue.
    expect(() => loadAllContent()).not.toThrow();
    expect(loadAllContent().length).toBeGreaterThan(0);
  });

  it('every used block and question kind has a registered handler', () => {
    for (const content of loadAllContent()) {
      expect(() => assertKindsRegistered(content)).not.toThrow();
    }
  });
});
