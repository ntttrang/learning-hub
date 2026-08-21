import { describe, expect, it } from 'vitest';
import { searchEntries } from '../engines/search';
import { buildHubSearchEntries } from './search-entries';

describe('buildHubSearchEntries', () => {
  const entries = buildHubSearchEntries();

  it('covers subjects, lessons, and labs', () => {
    for (const kind of ['subject', 'lesson', 'lab'] as const) {
      expect(entries.some((e) => e.kind === kind)).toBe(true);
    }
  });

  it('routes every entry into a subject workspace', () => {
    for (const entry of entries) {
      expect(entry.route.startsWith('#/subject/')).toBe(true);
    }
    expect(entries.some((e) => e.kind === 'lesson' && e.route.includes('/learn/'))).toBe(true);
    expect(entries.some((e) => e.kind === 'lab' && e.route.includes('/labs/'))).toBe(true);
  });

  it('indexes real pack titles', () => {
    const lessons = entries.filter((e) => e.kind === 'lesson');
    expect(lessons.length).toBeGreaterThan(5);
    // Searching a known subject code finds it, subject first.
    const hits = searchEntries(entries, 'gh-200');
    expect(hits[0].kind).toBe('subject');
    expect(hits[0].title).toBe('GH-200');
  });
});
