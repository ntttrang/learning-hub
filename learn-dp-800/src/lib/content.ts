import { DOMAINS, MODULES, EXAM_META } from "@/content/curriculum";
import { DOMAIN1_LESSONS } from "@/content/lessons/domain1";
import { DOMAIN2_LESSONS } from "@/content/lessons/domain2";
import { DOMAIN3_LESSONS } from "@/content/lessons/domain3";
import { QUESTIONS } from "@/content/questions";
import { LABS } from "@/content/labs";
import { MOCK_EXAMS } from "@/content/exams";
import { LAB_CODING_SETS } from "@/content/questions/lab-coding";
import type { Domain, Module, Lesson, Question, Lab, MockExam } from "./types";

export const LESSONS: Lesson[] = [
  ...DOMAIN1_LESSONS,
  ...DOMAIN2_LESSONS,
  ...DOMAIN3_LESSONS,
];

export { DOMAINS, MODULES, EXAM_META, QUESTIONS, LABS, MOCK_EXAMS, LAB_CODING_SETS };

const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
const lessonBySlug = new Map(LESSONS.map((l) => [l.slug, l]));
const moduleById = new Map(MODULES.map((m) => [m.id, m]));
const domainById = new Map(DOMAINS.map((d) => [d.id, d]));
const questionById = new Map(QUESTIONS.map((q) => [q.id, q]));
const labById = new Map(LABS.map((l) => [l.id, l]));
const examById = new Map(MOCK_EXAMS.map((e) => [e.id, e]));

export function getLesson(id: string): Lesson | undefined {
  return lessonById.get(id);
}
export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessonBySlug.get(slug);
}
export function getModule(id: string): Module | undefined {
  return moduleById.get(id);
}
export function getDomain(id: string): Domain | undefined {
  return domainById.get(id);
}
export function getQuestion(id: string): Question | undefined {
  return questionById.get(id);
}
export function getQuestions(ids: string[]): Question[] {
  return ids.map((id) => questionById.get(id)).filter((q): q is Question => !!q);
}
export function getLab(id: string): Lab | undefined {
  return labById.get(id);
}
export function getExam(id: string): MockExam | undefined {
  return examById.get(id);
}

export function modulesForDomain(domainId: string): Module[] {
  return MODULES.filter((m) => m.domainId === domainId).sort((a, b) => a.order - b.order);
}
export function lessonsForModule(moduleId: string): Lesson[] {
  return LESSONS.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
}
export function lessonsForDomain(domainId: string): Lesson[] {
  return LESSONS.filter((l) => l.domainId === domainId);
}
export function questionsForModule(moduleId: string): Question[] {
  return QUESTIONS.filter((q) => q.moduleId === moduleId);
}
export function questionsForDomain(domainId: string): Question[] {
  return QUESTIONS.filter((q) => q.domainId === domainId);
}
export function questionsForLabCodingSet(id: string): Question[] {
  const set = LAB_CODING_SETS.find((s) => s.id === id);
  return set ? getQuestions(set.questionIds) : [];
}

/** Ordered flat list of all lessons across the curriculum (for prev/next). */
export const LESSON_SEQUENCE: Lesson[] = DOMAINS.flatMap((d) =>
  modulesForDomain(d.id).flatMap((m) => lessonsForModule(m.id)),
);

export function adjacentLessons(id: string): { prev?: Lesson; next?: Lesson } {
  const idx = LESSON_SEQUENCE.findIndex((l) => l.id === id);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? LESSON_SEQUENCE[idx - 1] : undefined,
    next: idx < LESSON_SEQUENCE.length - 1 ? LESSON_SEQUENCE[idx + 1] : undefined,
  };
}

export const TOTAL_LESSONS = LESSONS.length;
export const TOTAL_LABS = LABS.length;
export const TOTAL_QUESTIONS = QUESTIONS.length;
