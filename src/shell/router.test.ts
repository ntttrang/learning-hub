import { describe, expect, it } from 'vitest';
import { navigate, parseHash } from './router';

describe('parseHash', () => {
  it('treats empty, #, and #/ as hub home', () => {
    expect(parseHash('')).toEqual({ view: 'home' });
    expect(parseHash('#')).toEqual({ view: 'home' });
    expect(parseHash('#/')).toEqual({ view: 'home' });
  });

  it('parses subject routes with an id', () => {
    expect(parseHash('#/subject/dp-800')).toEqual({ view: 'subject', subjectId: 'dp-800' });
    expect(parseHash('#/subject/gh-900')).toEqual({ view: 'subject', subjectId: 'gh-900' });
  });

  it('falls back to home for subject routes without an id', () => {
    expect(parseHash('#/subject')).toEqual({ view: 'home' });
    expect(parseHash('#/subject/')).toEqual({ view: 'home' });
  });

  it('parses mode, item id, and rest segments', () => {
    expect(parseHash('#/subject/fixture/learn')).toEqual({
      view: 'subject',
      subjectId: 'fixture',
      mode: 'learn',
    });
    expect(parseHash('#/subject/fixture/learn/storage-models')).toEqual({
      view: 'subject',
      subjectId: 'fixture',
      mode: 'learn',
      id: 'storage-models',
    });
    expect(parseHash('#/subject/fixture/exams/exam-1/run')).toEqual({
      view: 'subject',
      subjectId: 'fixture',
      mode: 'exams',
      id: 'exam-1',
      rest: ['run'],
    });
    expect(parseHash('#/subject/fixture/exams/exam-1/review/2')).toEqual({
      view: 'subject',
      subjectId: 'fixture',
      mode: 'exams',
      id: 'exam-1',
      rest: ['review', '2'],
    });
  });

  it('tolerates trailing slashes at every depth', () => {
    expect(parseHash('#/subject/fixture/learn/')).toEqual({
      view: 'subject',
      subjectId: 'fixture',
      mode: 'learn',
    });
    expect(parseHash('#/subject/fixture/learn/slug/')).toEqual({
      view: 'subject',
      subjectId: 'fixture',
      mode: 'learn',
      id: 'slug',
    });
  });

  it('parses unknown modes too — fallback is the workspace call', () => {
    expect(parseHash('#/subject/dp-800/extra')).toEqual({
      view: 'subject',
      subjectId: 'dp-800',
      mode: 'extra',
    });
  });

  it('falls back to home for unknown paths', () => {
    expect(parseHash('#/nope')).toEqual({ view: 'home' });
    expect(parseHash('#/deep/nested/path')).toEqual({ view: 'home' });
  });
});

describe('navigate', () => {
  it('sets the location hash', () => {
    navigate('/subject/gh-200');
    expect(window.location.hash).toBe('#/subject/gh-200');
  });
});
