import type {
  CompareFile,
  FrameworkFile,
  LabFile,
  LangId,
  LearnFile,
  Manifest,
  PracticeFile,
  QuizFile,
} from './types';

/** Public base URL — '/' in dev, '/polyglot-hub/' on GitHub Pages. */
const BASE = import.meta.env.BASE_URL;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function loadManifest(): Promise<Manifest> {
  return fetchJson<Manifest>(`${BASE}data/manifest.json`);
}

export function loadLearn(lang: LangId): Promise<LearnFile> {
  return fetchJson<LearnFile>(`${BASE}data/${lang}/learn.json`);
}

export function loadLab(lang: LangId): Promise<LabFile> {
  return fetchJson<LabFile>(`${BASE}data/${lang}/lab.json`);
}

export function loadPractice(lang: LangId): Promise<PracticeFile> {
  return fetchJson<PracticeFile>(`${BASE}data/${lang}/practice.json`);
}

export function loadFramework(lang: LangId): Promise<FrameworkFile> {
  return fetchJson<FrameworkFile>(`${BASE}data/${lang}/framework.json`);
}

export function loadQuiz(lang: LangId): Promise<QuizFile> {
  return fetchJson<QuizFile>(`${BASE}data/${lang}/quiz.json`);
}

export function loadCompare(): Promise<CompareFile> {
  return fetchJson<CompareFile>(`${BASE}data/compare/topics.json`);
}
