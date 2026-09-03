/**
 * Shared id rule for the polyglot (Languages) migration — the single source
 * of truth for both the pack extractor (`scripts/polyglot-extract-lib.ts`)
 * and the progress-migration engine (`migrate-polyglot-progress.ts`).
 *
 * Verified donor facts this rule encodes: every id in `learn-polyglot/data/`
 * is globally unique across all files and already kebab-clean, so migration
 * is prefix-only. There is deliberately no normalization and no collision
 * suffixing — the extractor's `assertKebabCleanIds` fails the build if a
 * future donor id would ever need one, rather than silently rewriting it.
 */
export const POLYGLOT_ID_PREFIX = 'plg-';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The migrated pack/storage id for a donor id (`plg-` + verbatim donor id). */
export function polyglotId(donorId: string): string {
  return POLYGLOT_ID_PREFIX + donorId;
}

/**
 * Guard for the prefix-only rule: every donor id must already be kebab-clean
 * so `polyglotId` stays bijective without rewrites. Throws naming the first
 * offenders — callers fail the extraction instead of mangling ids.
 */
export function assertKebabCleanIds(donorIds: string[], source: string): void {
  const bad = donorIds.filter((id) => !KEBAB.test(id));
  if (bad.length > 0) {
    throw new Error(
      `${source}: donor ids not kebab-clean — prefix-only migration requires verbatim ids: ${bad
        .slice(0, 5)
        .join(', ')}${bad.length > 5 ? ` (+${bad.length - 5} more)` : ''}`,
    );
  }
}

/** Fail loudly on duplicate migrated ids (pack ids must stay unique). */
export function assertUniqueIds(ids: string[], source: string): void {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) {
    throw new Error(`${source}: duplicate migrated ids: ${[...dupes].slice(0, 5).join(', ')}`);
  }
}
