import { describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import type { SubjectContent, SubjectUserData } from '../sdk/types';
import { buildHubOverview, buildSubjectStats } from './hub-stats';

const { content } = loadSubjectWithIndex('fixture');
const NOW = '2026-08-21T12:00:00.000Z';
const past = (days: number) => new Date(Date.parse(NOW) - days * 86_400_000).toISOString();

const examAttempt = (id: string, scaledScore: number) => ({
  id,
  examId: 'exam-practice',
  date: NOW,
  durationSeconds: 60,
  timed: false,
  scaledScore,
  passed: scaledScore >= 70,
  perDomain: [],
  answers: {},
  results: [],
});

const emptyData = (): SubjectUserData => ({
  lessons: {},
  completedLabs: [],
  quizAttempts: [],
  examAttempts: [],
  srs: {},
  notes: [],
  bookmarks: [],
});

describe('buildSubjectStats', () => {
  it('reports honest zeros for a subject with no data', () => {
    expect(buildSubjectStats(content, undefined, NOW)).toEqual({
      lessonsDone: 0,
      lessonsTotal: content.lessons.length,
      labsDone: 0,
      labsTotal: content.labs.length,
      bestExamPct: null,
      quizzesTaken: 0,
      dueCount: 0,
    });
  });

  it('counts completed lessons, shipped labs, best exam, quizzes, and dues', () => {
    const data: SubjectUserData = {
      ...emptyData(),
      lessons: {
        'lesson-storage-models': { status: 'completed' },
        'lesson-query-shapes': { status: 'in-progress' },
      },
      completedLabs: ['lab-explore', 'lab-retired'], // stale id must not count
      quizAttempts: [
        { id: 'a1', scope: 'all', date: NOW, total: 2, correct: 2, questionResults: [] },
      ],
      examAttempts: [examAttempt('e1', 72), examAttempt('e2', 91)],
      srs: {
        q1: { questionId: 'q1', box: 1, due: past(2), lastSeen: past(3), timesCorrect: 0, timesWrong: 1 },
        q2: { questionId: 'q2', box: 3, due: past(9), lastSeen: past(10), timesCorrect: 2, timesWrong: 0 },
        q3: { questionId: 'q3', box: 2, due: past(-9), lastSeen: past(10), timesCorrect: 1, timesWrong: 0 },
      },
    };

    expect(buildSubjectStats(content, data, NOW)).toEqual({
      lessonsDone: 1,
      lessonsTotal: 2,
      labsDone: 1,
      labsTotal: 1,
      bestExamPct: 91,
      quizzesTaken: 1,
      dueCount: 2, // q3 is scheduled in the future
    });
  });
});

describe('buildHubOverview', () => {
  const packs = [
    { id: 'fixture', content },
    {
      id: 'second',
      content: {
        ...content,
        lessons: [...content.lessons, { ...content.lessons[0]!, id: 'lesson-extra' }],
      } as SubjectContent,
    },
  ];

  it('sums per-subject stats into hub totals and reads hub streak/achievements', () => {
    const data = {
      fixture: {
        ...emptyData(),
        lessons: { 'lesson-storage-models': { status: 'completed' as const } },
        lastLessonId: 'lesson-query-shapes',
      },
      second: {
        ...emptyData(),
        lessons: { 'lesson-storage-models': { status: 'completed' as const } },
      },
    };
    const overview = buildHubOverview(
      packs,
      data,
      { streak: { current: 3, longest: 7 }, achievements: [] },
      NOW,
    );

    expect(overview.subjects).toHaveLength(2);
    expect(overview.lessonsDone).toBe(2);
    expect(overview.lessonsTotal).toBe(5); // fixture 2 + second 3
    expect(overview.totalDue).toBe(0);
    expect(overview.achievementsEarned).toBe(0);
    expect(overview.achievementsTotal).toBe(8);
    expect(overview.streakCurrent).toBe(3);
    expect(overview.streakLongest).toBe(7);
    // Continue resolves lastLessonId through the pack's slug.
    expect(overview.subjects[0]!.continueHref).toBe('#/subject/fixture/learn/query-shapes');
  });

  it('hides the continue link when lastLessonId no longer resolves in the pack', () => {
    const data = { fixture: { ...emptyData(), lastLessonId: 'lesson-deleted' } };
    const overview = buildHubOverview(
      [{ id: 'fixture', content }],
      data,
      { streak: { current: 0, longest: 0 }, achievements: [] },
      NOW,
    );
    expect(overview.subjects[0]!.continueHref).toBeUndefined();
  });

  it('is null-safe with imported-shaped data (empty subjects, unknown ids)', () => {
    const overview = buildHubOverview(
      packs,
      {},
      { streak: { current: 0, longest: 0 }, achievements: [] },
      NOW,
    );
    expect(overview.lessonsDone).toBe(0);
    expect(overview.subjects.every((entry) => entry.stats.bestExamPct === null)).toBe(true);
    expect(overview.subjects.every((entry) => entry.continueHref === undefined)).toBe(true);
  });
});
