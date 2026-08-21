"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  LessonProgress,
  QuizAttempt,
  ExamAttempt,
  SrsCard,
  Note,
  Achievement,
} from "./types";
import { ingestResults } from "./srs";
import { bumpStreak, type StreakState } from "./streak";

export type ThemeChoice = "auto" | "light" | "dark" | "night";

export const ACHIEVEMENTS: Omit<Achievement, "earnedAt">[] = [
  { id: "first-lesson", title: "Cast off", description: "Complete your first lesson." },
  { id: "domain-1", title: "Foundations laid", description: "Finish every lesson in Domain 1." },
  { id: "ten-lessons", title: "Making way", description: "Complete 10 lessons." },
  { id: "first-lab", title: "Hands on deck", description: "Complete your first hands-on lab." },
  { id: "quiz-ace", title: "Sharp shooter", description: "Score 100% on any knowledge check." },
  { id: "mock-pass", title: "Dry run", description: "Pass a full mock exam." },
  { id: "streak-7", title: "Steady sailing", description: "Reach a 7-day learning streak." },
  { id: "all-labs", title: "Deckhand", description: "Complete a lab in every domain." },
];

interface StoreState {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;

  lessons: Record<string, LessonProgress>;
  markLesson: (lessonId: string, status: LessonProgress["status"]) => void;
  visitLesson: (lessonId: string) => void;
  lastLessonId?: string;

  bookmarks: string[]; // lesson ids
  toggleBookmark: (lessonId: string) => void;

  completedLabs: string[];
  completeLab: (labId: string, domainId: string) => void;

  notes: Note[];
  upsertNote: (note: Note) => void;
  deleteNote: (id: string) => void;

  quizAttempts: QuizAttempt[];
  recordQuiz: (attempt: QuizAttempt) => void;

  examAttempts: ExamAttempt[];
  recordExam: (attempt: ExamAttempt) => void;

  srs: Record<string, SrsCard>;

  streak: StreakState;

  achievements: Achievement[];
  grant: (id: string) => void;

  resetProgress: () => void;
}

const now = () => new Date().toISOString();

const initialStreak: StreakState = { current: 0, longest: 0 };

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      theme: "auto",
      setTheme: (t) => set({ theme: t }),

      lessons: {},
      lastLessonId: undefined,
      markLesson: (lessonId, status) => {
        set((s) => ({
          lessons: {
            ...s.lessons,
            [lessonId]: { ...s.lessons[lessonId], status, lastVisited: now() },
          },
          streak: bumpStreak(s.streak, now()),
        }));
        if (status === "completed") {
          const completed = Object.values(get().lessons).filter(
            (l) => l.status === "completed",
          ).length;
          get().grant("first-lesson");
          if (completed >= 10) get().grant("ten-lessons");
        }
      },
      visitLesson: (lessonId) =>
        set((s) => ({
          lastLessonId: lessonId,
          lessons: {
            ...s.lessons,
            [lessonId]: {
              ...s.lessons[lessonId],
              status: s.lessons[lessonId]?.status ?? "in-progress",
              lastVisited: now(),
            },
          },
          streak: bumpStreak(s.streak, now()),
        })),

      bookmarks: [],
      toggleBookmark: (lessonId) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(lessonId)
            ? s.bookmarks.filter((b) => b !== lessonId)
            : [...s.bookmarks, lessonId],
        })),

      completedLabs: [],
      completeLab: (labId) => {
        set((s) => ({
          completedLabs: s.completedLabs.includes(labId)
            ? s.completedLabs
            : [...s.completedLabs, labId],
          streak: bumpStreak(s.streak, now()),
        }));
        get().grant("first-lab");
      },

      notes: [],
      upsertNote: (note) =>
        set((s) => {
          const exists = s.notes.some((n) => n.id === note.id);
          return {
            notes: exists
              ? s.notes.map((n) => (n.id === note.id ? note : n))
              : [note, ...s.notes],
          };
        }),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      quizAttempts: [],
      recordQuiz: (attempt) => {
        set((s) => ({
          quizAttempts: [attempt, ...s.quizAttempts].slice(0, 200),
          srs: ingestResults(s.srs, attempt.questionResults, now()),
          streak: bumpStreak(s.streak, now()),
        }));
        if (attempt.total > 0 && attempt.correct === attempt.total) {
          get().grant("quiz-ace");
        }
      },

      examAttempts: [],
      recordExam: (attempt) => {
        set((s) => ({
          examAttempts: [attempt, ...s.examAttempts].slice(0, 50),
          srs: ingestResults(s.srs, attempt.results, now()),
          streak: bumpStreak(s.streak, now()),
        }));
        if (attempt.passed) get().grant("mock-pass");
      },

      srs: {},

      streak: initialStreak,

      achievements: [],
      grant: (id) =>
        set((s) => {
          if (s.achievements.some((a) => a.id === id)) return s;
          const def = ACHIEVEMENTS.find((a) => a.id === id);
          if (!def) return s;
          return { achievements: [...s.achievements, { ...def, earnedAt: now() }] };
        }),

      resetProgress: () =>
        set({
          lessons: {},
          lastLessonId: undefined,
          bookmarks: [],
          completedLabs: [],
          notes: [],
          quizAttempts: [],
          examAttempts: [],
          srs: {},
          streak: initialStreak,
          achievements: [],
        }),
    }),
    {
      name: "dp800-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
