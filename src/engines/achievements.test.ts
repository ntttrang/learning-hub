import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, evaluateAchievements, type AchievementSnapshot } from './achievements';
import type { SubjectUserData } from '../sdk/types';

const NOW = '2026-08-21T10:00:00.000Z';

const data = (partial: Partial<SubjectUserData> = {}): SubjectUserData => ({
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
  srs: {},
  notes: [],
  bookmarks: [],
  ...partial,
});

const doneLesson = { status: 'completed' as const };

const snapshot = (partial: Partial<AchievementSnapshot> = {}): AchievementSnapshot => ({
  streak: { current: 0, longest: 0 },
  subjects: {},
  ...partial,
});

const earnedIds = (s: AchievementSnapshot, already: string[] = []) =>
  evaluateAchievements(s, already, NOW).map((a) => a.id);

describe('ACHIEVEMENTS definitions', () => {
  it('has stable unique ids with copy for every entry', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of ACHIEVEMENTS) {
      expect(def.title.trim()).not.toBe('');
      expect(def.description.trim()).not.toBe('');
    }
  });
});

describe('evaluateAchievements', () => {
  it('awards nothing for an empty snapshot', () => {
    expect(evaluateAchievements(snapshot(), [], NOW)).toEqual([]);
  });

  it('first-lesson counts only completed lessons, not mere visits', () => {
    const visited = snapshot({
      subjects: { fx: data({ lessons: { l1: { status: 'in-progress' } } }) },
    });
    expect(earnedIds(visited)).not.toContain('first-lesson');

    const completed = snapshot({
      subjects: { fx: data({ lessons: { l1: doneLesson } }) },
    });
    expect(earnedIds(completed)).toEqual(['first-lesson']);
  });

  it('lesson and lab volume thresholds aggregate across subjects', () => {
    const lessons = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`l${i}`, doneLesson]),
    );
    const ten = snapshot({ subjects: { fx: data({ lessons }), gh: data({ lessons: { x: doneLesson } }) } });
    expect(earnedIds(ten)).toEqual(['first-lesson', 'ten-lessons']);

    const labs = ['lab1', 'lab2'];
    const labState = snapshot({
      subjects: { fx: data({ completedLabs: labs, lessons: { l1: doneLesson } }) },
    });
    expect(earnedIds(labState)).toEqual(['first-lesson', 'first-lab']);
  });

  it('fifty-lessons and lab-ten fire at their thresholds', () => {
    const lessons = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`l${i}`, doneLesson]),
    );
    expect(earnedIds(snapshot({ subjects: { fx: data({ lessons }) } }))).toEqual([
      'first-lesson',
      'ten-lessons',
      'fifty-lessons',
    ]);

    const completedLabs = Array.from({ length: 10 }, (_, i) => `lab${i}`);
    expect(
      earnedIds(snapshot({ subjects: { fx: data({ completedLabs }) } })),
    ).toContain('lab-ten');
  });

  it('quiz-ace requires a perfect score with at least one question', () => {
    const perfect = { id: 'a1', scope: 'all', date: NOW, total: 3, correct: 3, questionResults: [] };
    const zero = { ...perfect, id: 'a2', total: 0, correct: 0 };
    expect(earnedIds(snapshot({ subjects: { fx: data({ quizAttempts: [zero] }) } }))).toEqual([]);
    expect(
      earnedIds(snapshot({ subjects: { fx: data({ quizAttempts: [perfect] }) } })),
    ).toContain('quiz-ace');
  });

  it('mock-pass reads the attempt pass flag', () => {
    const passed = {
      id: 'e1',
      examId: 'exam-1',
      date: NOW,
      durationSeconds: 60,
      timed: false,
      scaledScore: 800,
      passed: true,
      perDomain: [],
      answers: {},
      results: [],
    };
    expect(
      earnedIds(snapshot({ subjects: { fx: data({ examAttempts: [passed] }) } })),
    ).toContain('mock-pass');
  });

  it('streak-7 fires on current or longest streak', () => {
    expect(earnedIds(snapshot({ streak: { current: 7, longest: 3 } }))).toEqual(['streak-7']);
    expect(earnedIds(snapshot({ streak: { current: 2, longest: 9 } }))).toEqual(['streak-7']);
    expect(earnedIds(snapshot({ streak: { current: 6, longest: 6 } }))).toEqual([]);
  });

  it('skips already-earned ids and stamps earnedAt from the caller', () => {
    const s = snapshot({ subjects: { fx: data({ lessons: { l1: doneLesson } }) } });
    const first = evaluateAchievements(s, [], NOW);
    expect(first.map((a) => a.earnedAt)).toEqual([NOW]);
    expect(evaluateAchievements(s, ['first-lesson'], NOW)).toEqual([]);
  });
});
