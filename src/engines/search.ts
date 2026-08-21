/**
 * Hub-wide title search over installed content. Pure data in, ranked
 * entries out — the shell maps subjects/lessons/labs to `SearchEntry`s
 * (see `shell/search-entries.ts`) and this engine does the matching.
 */

export type SearchKind = 'subject' | 'lesson' | 'lab';

export interface SearchEntry {
  kind: SearchKind;
  title: string;
  /** Where the result lives: module/domain title, or the subject subtitle. */
  context?: string;
  /** Subject code shown as the result's badge, e.g. "DP-800". */
  subjectCode: string;
  /** Hash route that opens the result. */
  route: string;
}

/** Enough results to be useful in a dropdown, few enough to scan. */
const MAX_RESULTS = 12;

/** Kind tiebreak: a subject sorts before its lessons and labs. */
const KIND_RANK: Record<SearchKind, number> = { subject: 0, lesson: 1, lab: 2 };

/**
 * Score one entry for one query token. Every token must match somewhere
 * (title, context, or an exact subject code) or the entry is out. Better
 * matches score higher: exact code > title prefix > title substring >
 * context prefix > context substring.
 */
function tokenScore(entry: SearchEntry, token: string): number | null {
  const title = entry.title.toLowerCase();
  const context = (entry.context ?? '').toLowerCase();
  if (entry.subjectCode.toLowerCase() === token) return 100;
  if (title.startsWith(token)) return 60;
  if (title.includes(token)) return 40;
  if (context.startsWith(token)) return 20;
  if (context.includes(token)) return 10;
  return null;
}

/** Ranked search: query tokens AND-ed, results capped at `MAX_RESULTS`. */
export function searchEntries(entries: SearchEntry[], rawQuery: string): SearchEntry[] {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of entries) {
    let score = 0;
    let matched = true;
    for (const token of tokens) {
      const s = tokenScore(entry, token);
      if (s === null) {
        matched = false;
        break;
      }
      score += s;
    }
    if (matched) scored.push({ entry, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      KIND_RANK[a.entry.kind] - KIND_RANK[b.entry.kind] ||
      a.entry.title.localeCompare(b.entry.title),
  );

  return scored.slice(0, MAX_RESULTS).map((s) => s.entry);
}
