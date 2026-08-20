/**
 * DP-800 pack renderer registration — a side-effect module.
 *
 * Contract: importing this module registers every DP-800 extension block kind
 * (objectives, keyTerms, sourced, figure, sideBySide, mistakes, examTips) and
 * the pack's comparison question body. The registrations live here beside
 * their renderers; until they arrive, importing this module is a no-op.
 *
 * Two graphs must import it for side effects: `src/App.tsx` (rendered by
 * main.tsx, so the dev app and every App-rendering test carry registration)
 * and `src/content/content-check.test.ts` (the coverage gate, whose module
 * graph excludes the app entry). A missing site silently strands the kinds
 * in that graph's registry.
 */

// Module marker only — the registrations above the fold arrive with the
// renderers; until then importing this module stays a side-effect no-op.
export {};
