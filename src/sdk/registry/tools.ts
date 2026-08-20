import type { ToolId } from '../types';

/**
 * Tool metadata registry — the real authority `Subject.enabledModes` validates
 * against. Phase 1 registers metadata only; components attach in Phase 2 by
 * extending `ToolMeta`, without schema or content changes.
 */

/** SubjectContent collections a tool can be backed by (null = user-data only). */
export type ContentKind = 'lessons' | 'labs' | 'questions' | 'exams' | 'comparisons';

export interface ToolMeta {
  id: ToolId;
  label: string;
  description: string;
  /** The content collection this mode needs to be anything more than an empty
   *  state; null for tools that ride on user data alone. */
  requiresContentKind: ContentKind | null;
}

export const TOOL_REGISTRY: Record<ToolId, ToolMeta> = {
  learn: {
    id: 'learn',
    label: 'Learn',
    description: 'Structured lessons with knowledge checks.',
    requiresContentKind: 'lessons',
  },
  labs: {
    id: 'labs',
    label: 'Labs',
    description: 'Hands-on guided exercises.',
    requiresContentKind: 'labs',
  },
  practice: {
    id: 'practice',
    label: 'Practice',
    description: 'Question bank practice with spaced repetition.',
    requiresContentKind: 'questions',
  },
  exams: {
    id: 'exams',
    label: 'Exams',
    description: 'Mock exams on the certification scale.',
    requiresContentKind: 'exams',
  },
  compare: {
    id: 'compare',
    label: 'Compare',
    description: 'Side-by-side reference comparisons.',
    requiresContentKind: 'comparisons',
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    description: 'Personal notes tied to lessons.',
    requiresContentKind: null,
  },
  revision: {
    id: 'revision',
    label: 'Revision',
    description: 'Spaced-repetition review of missed questions.',
    requiresContentKind: null,
  },
};

export const TOOL_LIST: ToolMeta[] = Object.values(TOOL_REGISTRY);

/** Tool id -> the collection it needs content in; used by pack validation. */
export const CONTENT_BACKED_TOOLS: Partial<Record<ToolId, ContentKind>> = Object.fromEntries(
  TOOL_LIST.filter((t) => t.requiresContentKind !== null).map((t) => [t.id, t.requiresContentKind]),
) as Partial<Record<ToolId, ContentKind>>;
