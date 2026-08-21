import type { LessonProgress, QuizAttempt, ExamAttempt } from "./types";
import { LESSONS, DOMAINS, lessonsForDomain, LABS } from "./content";

export interface DerivedStats {
  overall: number; // 0..1 lessons completed
  completedLessons: number;
  totalLessons: number;
  quizAccuracy: number;
  quizCount: number;
  labsDone: number;
  domainCompletion: Record<string, number>;
  domainExam: Record<string, number>; // accuracy from latest exam attempts
  weakDomains: string[]; // sorted worst-first (by exam accuracy)
}

export function computeStats(input: {
  lessons: Record<string, LessonProgress>;
  completedLabs: string[];
  quizAttempts: QuizAttempt[];
  examAttempts: ExamAttempt[];
}): DerivedStats {
  const { lessons, completedLabs, quizAttempts, examAttempts } = input;

  const completedLessons = LESSONS.filter((l) => lessons[l.id]?.status === "completed").length;
  const totalLessons = LESSONS.length;

  const domainCompletion: Record<string, number> = {};
  for (const d of DOMAINS) {
    const dl = lessonsForDomain(d.id);
    const done = dl.filter((l) => lessons[l.id]?.status === "completed").length;
    domainCompletion[d.id] = dl.length ? done / dl.length : 0;
  }

  // Quiz accuracy across all attempts
  let qc = 0;
  let qt = 0;
  for (const a of quizAttempts) {
    qc += a.correct;
    qt += a.total;
  }

  // Exam accuracy per domain — aggregate across attempts
  const domainExamAgg: Record<string, { correct: number; total: number }> = {};
  for (const a of examAttempts) {
    for (const pd of a.perDomain) {
      const e = domainExamAgg[pd.domainId] ?? { correct: 0, total: 0 };
      e.correct += pd.correct;
      e.total += pd.total;
      domainExamAgg[pd.domainId] = e;
    }
  }
  const domainExam: Record<string, number> = {};
  for (const [id, v] of Object.entries(domainExamAgg)) {
    domainExam[id] = v.total ? v.correct / v.total : 0;
  }

  const weakDomains = Object.entries(domainExam)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);

  return {
    overall: totalLessons ? completedLessons / totalLessons : 0,
    completedLessons,
    totalLessons,
    quizAccuracy: qt ? qc / qt : 0,
    quizCount: quizAttempts.length,
    labsDone: completedLabs.filter((id) => LABS.some((l) => l.id === id)).length,
    domainCompletion,
    domainExam,
    weakDomains,
  };
}
