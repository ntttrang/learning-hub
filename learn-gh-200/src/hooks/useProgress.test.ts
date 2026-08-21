import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_PROGRESS, useProgress } from './useProgress';

const KEY = 'gh-site-progress-v1';

/** Swap window.localStorage for a throwing getter, the way blocked storage looks. */
function blockStorage() {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Storage denied', 'SecurityError');
    },
  });
  return () => {
    if (original) Object.defineProperty(window, 'localStorage', original);
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('useProgress', () => {
  it('starts empty with nothing stored', () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current.progress).toEqual(EMPTY_PROGRESS);
  });

  it('restores a previously persisted state', () => {
    const stored = {
      ...EMPTY_PROGRESS,
      lessonsRead: { 'gh900-d1': '2026-08-19T00:00:00.000Z' },
    };
    window.localStorage.setItem(KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useProgress());
    expect(result.current.progress.lessonsRead['gh900-d1']).toBeDefined();
  });

  it('marks a domain lesson read and persists it', () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.markLessonRead('gh900-d1'));

    expect(result.current.progress.lessonsRead['gh900-d1']).toBeTruthy();
    const raw = window.localStorage.getItem(KEY);
    expect(raw).toContain('gh900-d1');
  });

  it('marks a lab done and persists it', () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.markLabDone('gh900-d1-lab1'));

    expect(result.current.progress.labsDone['gh900-d1-lab1']).toBeTruthy();
  });

  it('accumulates practice tallies per domain', () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.recordPractice('gh200-d1', true));
    act(() => result.current.recordPractice('gh200-d1', false));
    act(() => result.current.recordPractice('gh200-d1', true));

    expect(result.current.progress.practiceStats['gh200-d1']).toEqual({
      seen: 3,
      correct: 2,
    });
  });

  it('appends exam attempts with per-domain results in order', () => {
    const { result } = renderHook(() => useProgress());
    act(() => result.current.recordExamAttempt({
      examId: 'gh900-mock-a',
      date: '2026-08-19T00:00:00.000Z',
      scaledScore: 820,
      passed: true,
      perDomain: { 'gh900-d1': { correct: 7, total: 10 } },
    }));
    act(() => result.current.recordExamAttempt({
      examId: 'gh200-mock-a',
      date: '2026-08-20T00:00:00.000Z',
      scaledScore: 640,
      passed: false,
      perDomain: { 'gh200-d1': { correct: 4, total: 8 } },
    }));

    expect(result.current.progress.examAttempts).toHaveLength(2);
    expect(result.current.progress.examAttempts[1].examId).toBe('gh200-mock-a');
    expect(result.current.progress.examAttempts[0].perDomain['gh900-d1']).toEqual({
      correct: 7,
      total: 10,
    });
  });

  it('resets to empty when stored JSON is corrupt', () => {
    window.localStorage.setItem(KEY, '{not json at all');
    const { result } = renderHook(() => useProgress());
    expect(result.current.progress).toEqual(EMPTY_PROGRESS);
  });

  it('resets to empty when stored JSON has the wrong shape', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 99, lessonsRead: 'nope' }));
    const { result } = renderHook(() => useProgress());
    expect(result.current.progress).toEqual(EMPTY_PROGRESS);
  });

  it('keeps working in memory when storage is unavailable', () => {
    const restore = blockStorage();
    try {
      const { result } = renderHook(() => useProgress());
      act(() => result.current.markLessonRead('gh900-d1'));
      expect(result.current.progress.lessonsRead['gh900-d1']).toBeTruthy();
    } finally {
      restore();
    }
  });
});
