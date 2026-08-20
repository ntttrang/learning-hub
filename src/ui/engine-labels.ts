/**
 * Pretty engine labels for the database packs. Plain data with zero imports —
 * the dp-800 extractor script imports this module too, so it must stay
 * outside the React graph.
 */
export const ENGINE_LABELS: Record<string, string> = {
  sqlserver: 'Microsoft SQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  oracle: 'Oracle Database',
};

/** The display label for an engine id; unknown ids fall back to the raw id. */
export function engineLabel(id: string): string {
  return ENGINE_LABELS[id] ?? id;
}
