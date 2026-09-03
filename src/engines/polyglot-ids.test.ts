import { describe, expect, it } from 'vitest';
import {
  POLYGLOT_ID_PREFIX,
  assertKebabCleanIds,
  assertUniqueIds,
  polyglotId,
} from './polyglot-ids';

describe('polyglot-ids — shared migration id rule', () => {
  it('prefixes donor ids without rewriting them', () => {
    expect(POLYGLOT_ID_PREFIX).toBe('plg-');
    expect(polyglotId('java-q-volatile')).toBe('plg-java-q-volatile');
    expect(polyglotId('ruby-q-01-objects-output-1')).toBe('plg-ruby-q-01-objects-output-1');
  });

  it('accepts the donor id vocabulary', () => {
    expect(() => assertKebabCleanIds(['java-q-volatile', 'go-fw-router-json'], 'quiz.json')).not.toThrow();
  });

  it('fails loudly naming ids that would need a rewrite', () => {
    expect(() => assertKebabCleanIds(['java_q_volatile'], 'quiz.json')).toThrow(/kebab-clean/);
    expect(() => assertKebabCleanIds(['Java Q'], 'learn.json')).toThrow(/kebab-clean/);
  });

  it('fails loudly on duplicate migrated ids', () => {
    expect(() => assertUniqueIds(['plg-a', 'plg-b', 'plg-a'], 'questions')).toThrow(/duplicate/);
    expect(() => assertUniqueIds(['plg-a', 'plg-b'], 'questions')).not.toThrow();
  });
});
