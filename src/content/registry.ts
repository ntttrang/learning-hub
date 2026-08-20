/**
 * The app-facing content aggregator — the ONLY module the app imports to
 * reach content. Everything flows through the `ContentSource` seam so a
 * future Supabase/CMS source swaps in without touching UI or engines.
 */
import { assemblePaper } from '../engines/exam-paper';
import { createFileContentSource, createSubjectIndex } from '../sdk/content-source';
import type { ContentSource, SubjectIndex } from '../sdk/content-source';
import type { SubjectContent } from '../sdk/types';

// The app layer sits above SDK and engines, so it can hand the validator the
// real paper assembly — that is what makes cross-exam exclusion feasibility a
// load-time check instead of a sitting-time throw.
export const contentSource: ContentSource = createFileContentSource({ assemblePaper });

/** Every installed pack, loaded and fully validated (throws on any bad pack). */
export function loadAllContent(): SubjectContent[] {
  return contentSource.listSubjectIds().map((id) => contentSource.loadSubject(id));
}

/** Convenience: load one pack and its accessor index in one call. */
export function loadSubjectWithIndex(id: string): { content: SubjectContent; index: SubjectIndex } {
  const content = contentSource.loadSubject(id);
  return { content, index: createSubjectIndex(content) };
}

export type { ContentSource, SubjectIndex } from '../sdk/content-source';
export type { Subject, SubjectContent } from '../sdk/types';
