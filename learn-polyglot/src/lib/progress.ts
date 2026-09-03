import type { LangId } from './types';

const KEY = 'prh-progress';

export interface ProgressState {
  lessons: Record<string, boolean>;
  labs: Record<string, boolean>;
  practice: Record<string, boolean>;
  framework: Record<string, boolean>;
  quiz: Record<string, { correct: boolean; answeredAt: string }>;
  lastLang?: LangId;
}

function empty(): ProgressState {
  return { lessons: {}, labs: {}, practice: {}, framework: {}, quiz: {} };
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as ProgressState) };
  } catch {
    return empty();
  }
}

function save(state: ProgressState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function markLesson(id: string, done = true): ProgressState {
  const state = loadProgress();
  state.lessons[id] = done;
  save(state);
  return state;
}

export function markLab(id: string, done = true): ProgressState {
  const state = loadProgress();
  state.labs[id] = done;
  save(state);
  return state;
}

export function markPractice(id: string, done = true): ProgressState {
  const state = loadProgress();
  state.practice[id] = done;
  save(state);
  return state;
}

export function markFramework(id: string, done = true): ProgressState {
  const state = loadProgress();
  state.framework[id] = done;
  save(state);
  return state;
}

export function markQuiz(
  id: string,
  correct: boolean,
): ProgressState {
  const state = loadProgress();
  state.quiz[id] = { correct, answeredAt: new Date().toISOString() };
  save(state);
  return state;
}

export function setLastLang(lang: LangId): ProgressState {
  const state = loadProgress();
  state.lastLang = lang;
  save(state);
  return state;
}

export function quizScore(ids: string[]): { answered: number; correct: number } {
  const state = loadProgress();
  let answered = 0;
  let correct = 0;
  for (const id of ids) {
    const entry = state.quiz[id];
    if (!entry) continue;
    answered += 1;
    if (entry.correct) correct += 1;
  }
  return { answered, correct };
}
