import { contentSource } from '../content/registry';
import { loadSubjectsTolerant } from '../sdk/content-source';
import { TOOL_REGISTRY } from '../sdk/registry/tools';
import type { AccentToken, Subject } from '../sdk/types';

/**
 * The subject list the shell renders: installed content packs merged over the
 * roadmap placeholders by id. Installed packs win and sort first; the
 * placeholders stay honest ("Pack not installed") until their pack lands.
 */

/** Locked brand accent token names — never free-form hex. */
export type SubjectAccent = AccentToken;

export interface SubjectPlaceholder {
  id: string;
  code: string;
  subtitle: string;
  description: string;
  accent: SubjectAccent;
  /** Learning modes this subject will expose once its pack is installed. */
  modes: string[];
}

/** One subject as home cards, the rail, and workspaces see it. */
export interface SubjectCard extends SubjectPlaceholder {
  /** True when an installed content pack backs this subject. */
  installed: boolean;
  /** Enabled tool ids from the pack — empty until the pack is installed. */
  enabledModes: string[];
}

/** Map an accent token name to its CSS variable reference. */
export function accentVar(accent: SubjectAccent): string {
  return `var(--${accent})`;
}

export const PLACEHOLDER_SUBJECTS: SubjectPlaceholder[] = [
  {
    id: 'dp-800',
    code: 'DP-800',
    subtitle: 'SQL AI Developer · 3 domains',
    description: 'Databases, T-SQL, vector search — with cross-engine compare & Docker labs.',
    accent: 'sky-cyan',
    modes: ['Learn', 'Labs', 'Practice', 'Exams', 'Compare'],
  },
  {
    id: 'gh-200',
    code: 'GH-200',
    subtitle: 'GitHub Actions · 4 domains',
    description: 'CI/CD workflows, runners, secrets, and pipeline automation with hands-on labs.',
    accent: 'hub-green',
    modes: ['Learn', 'Labs', 'Practice', 'Exams', 'Compare'],
  },
  {
    id: 'gh-900',
    code: 'GH-900',
    subtitle: 'GitHub Foundations · 4 domains',
    description: 'Git, repos, collaboration & GitHub fundamentals — the on-ramp certification.',
    accent: 'corgi-orange',
    modes: ['Learn', 'Practice', 'Exams'],
  },
  {
    id: 'gh-600',
    code: 'GH-600',
    subtitle: 'Go · Docker Hub · AWS · 8 labs',
    description: 'Legacy static exams & labs being migrated into the shared content model.',
    accent: 'hub-coral',
    modes: ['Study plan', 'Labs', 'Exams'],
  },
];

/** Shape an installed pack's metadata as a card. */
function subjectToCard(subject: Subject): SubjectCard {
  return {
    id: subject.id,
    code: subject.code,
    subtitle: subject.subtitle ?? subject.title,
    description: subject.description ?? '',
    accent: subject.accent,
    modes: subject.enabledModes.map((mode) => TOOL_REGISTRY[mode]?.label ?? mode),
    installed: true,
    enabledModes: subject.enabledModes,
  };
}

/**
 * Installed-pack cards, read once per session. Pack metadata is static for a
 * build, so a module-scope memo keeps home renders cheap. Packs load
 * individually through `loadSubjectsTolerant`: an invalid pack is logged and
 * skipped — its placeholder card (if any) stays up, and with no placeholder it
 * is simply absent — while healthy packs still list. Strict whole-repo loading
 * remains in `loadAllContent` for the `content:check` gate.
 */
let installedCardsMemo: SubjectCard[] | undefined;

function installedCards(): SubjectCard[] {
  if (!installedCardsMemo) {
    installedCardsMemo = loadSubjectsTolerant(
      contentSource.listSubjectIds(),
      (id) => contentSource.loadSubject(id).subject,
    ).map(subjectToCard);
  }
  return installedCardsMemo;
}

/** Installed packs over placeholders by id — installed first. */
export function listSubjectCards(): SubjectCard[] {
  const installed = installedCards();
  const installedIds = new Set(installed.map((card) => card.id));
  return [
    ...installed,
    ...PLACEHOLDER_SUBJECTS.filter((p) => !installedIds.has(p.id)).map((p) => ({
      ...p,
      installed: false,
      enabledModes: [],
    })),
  ];
}

/** Look up a subject card (installed or placeholder) by route id. */
export function findSubject(id: string): SubjectCard | undefined {
  return listSubjectCards().find((subject) => subject.id === id);
}
