import { describe, expect, it } from 'vitest';
import { searchEntries, type SearchEntry } from './search';

const e = (over: Partial<SearchEntry>): SearchEntry => ({
  kind: 'lesson',
  title: '',
  subjectCode: 'DP-800',
  route: '#/subject/dp-800',
  ...over,
});

const ENTRIES: SearchEntry[] = [
  e({ kind: 'subject', title: 'DP-800', context: 'SQL AI Developer · databases', route: '#/subject/dp-800' }),
  e({ kind: 'subject', title: 'GH-200', context: 'GitHub Actions · CI/CD', subjectCode: 'GH-200', route: '#/subject/gh-200' }),
  e({ title: 'Vector search', context: 'AI workloads · Responsible AI' }),
  e({ title: 'Row-level security', context: 'Secure · Platform' }),
  e({ title: 'GitHub Actions workflows', context: 'CI/CD · Workflows', subjectCode: 'GH-200', route: '#/subject/gh-200/learn/x' }),
  e({ kind: 'lab', title: 'Vector search lab', context: 'AI workloads', route: '#/subject/dp-800/labs/x' }),
];

describe('searchEntries', () => {
  it('returns nothing for a blank query', () => {
    expect(searchEntries(ENTRIES, '')).toEqual([]);
    expect(searchEntries(ENTRIES, '   ')).toEqual([]);
  });

  it('matches titles case-insensitively', () => {
    const hits = searchEntries(ENTRIES, 'vector');
    expect(hits.map((x) => x.title)).toEqual(['Vector search', 'Vector search lab']);
  });

  it('requires every token to match somewhere', () => {
    expect(searchEntries(ENTRIES, 'vector security')).toEqual([]);
    const both = searchEntries(ENTRIES, 'row level');
    expect(both.map((x) => x.title)).toEqual(['Row-level security']);
  });

  it('matches on context and subject code, not just titles', () => {
    expect(searchEntries(ENTRIES, 'responsible')[0].title).toBe('Vector search');
    expect(searchEntries(ENTRIES, 'dp-800')[0].kind).toBe('subject');
  });

  it('ranks an exact subject-code match above title matches', () => {
    const hits = searchEntries(ENTRIES, 'gh-200');
    expect(hits[0].kind).toBe('subject');
    expect(hits[0].title).toBe('GH-200');
  });

  it('breaks score ties by kind, then title', () => {
    // Both match "search" as a title substring (40 each); the lesson
    // outranks the lab.
    const hits = searchEntries(ENTRIES, 'search');
    expect(hits.map((x) => x.title)).toEqual(['Vector search', 'Vector search lab']);
  });

  it('caps results at 12', () => {
    const many = Array.from({ length: 30 }, (_, i) => e({ title: `Lesson ${i}` }));
    expect(searchEntries(many, 'lesson').length).toBe(12);
  });
});
