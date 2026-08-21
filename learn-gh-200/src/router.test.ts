import { describe, expect, it } from 'vitest';
import { parseHash } from './router';

describe('parseHash', () => {
  it('treats an empty hash as home', () => {
    expect(parseHash('')).toEqual({ section: 'home' });
    expect(parseHash('#')).toEqual({ section: 'home' });
    expect(parseHash('#/')).toEqual({ section: 'home' });
  });

  it('parses each section root', () => {
    expect(parseHash('#/learn')).toEqual({ section: 'learn' });
    expect(parseHash('#/lab')).toEqual({ section: 'lab' });
    expect(parseHash('#/practice')).toEqual({ section: 'practice' });
    expect(parseHash('#/exams')).toEqual({ section: 'exams' });
    expect(parseHash('#/compare')).toEqual({ section: 'compare' });
  });

  it('parses section detail ids', () => {
    expect(parseHash('#/learn/git-basics')).toEqual({ section: 'learn', id: 'git-basics' });
    expect(parseHash('#/exams/gh900-mock-a')).toEqual({ section: 'exams', id: 'gh900-mock-a' });
  });

  it('captures segments beyond the id as rest', () => {
    expect(parseHash('#/learn/git-basics/extra')).toEqual({
      section: 'learn',
      id: 'git-basics',
      rest: ['extra'],
    });
    expect(parseHash('#/exams/gh900-mock-a/run')).toEqual({
      section: 'exams',
      id: 'gh900-mock-a',
      rest: ['run'],
    });
    expect(parseHash('#/exams/gh900-mock-a/review/2')).toEqual({
      section: 'exams',
      id: 'gh900-mock-a',
      rest: ['review', '2'],
    });
  });

  it('falls back to home on unknown sections or raw paths', () => {
    expect(parseHash('#/nope')).toEqual({ section: 'home' });
    expect(parseHash('#/learn/../..')).toEqual({ section: 'learn', id: '..', rest: ['..'] });
    expect(parseHash('#whatever')).toEqual({ section: 'home' });
  });

  it('is lenient about the leading slash', () => {
    expect(parseHash('#compare')).toEqual({ section: 'compare' });
    expect(parseHash('#learn')).toEqual({ section: 'learn' });
  });
});
