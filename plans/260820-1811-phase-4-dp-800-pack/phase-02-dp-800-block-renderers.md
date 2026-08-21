---
phase: 2
title: "DP-800 block renderers"
status: completed
priority: P1
effort: 1d
dependencies: [1]
---

# Phase 2: DP-800 block renderers

## Overview

Register the seven DP-800 extension block kinds in
`src/content/dp-800/renderers.tsx` (the seam created in phase 1) and give them
real markup: `objectives`, `keyTerms`, `sourced`, `figure`, `sideBySide`,
`mistakes`, `examTips`. Add the `mermaid ^11.16.0` dependency and a lazy
`src/ui/Mermaid.tsx` (async chunk, neutral theme, strict security, `<pre>`
fallback — mirror of donor `learn-dp-800/src/components/Mermaid.tsx`). DRY: the
`sideBySide` kind renders a full hub `Comparison` payload through the same body
the Compare page uses, so extract the comparison body (table + sample tabs +
migration grid) from `src/ui/Compare.tsx` into an exported component both
consume. Everything is unit-tested against inline fixtures — no pack content
exists yet (that is phase 3), and the suite stays green because registering
kinds nobody emits changes nothing for installed packs.

## Requirements

### Functional

- Registered kinds and payload shapes (ids verified non-core, i.e. not in
  `CORE_BLOCK_KINDS` at `src/sdk/validate.ts:88`; payloads pass the open
  extension union at `validate.ts:116-125`):

| kind | Payload | Renders |
| --- | --- | --- |
| `objectives` | `{kind:'objectives', items: string[]}` | "Learning objectives" section: check-styled list (donor `LessonViewer.tsx:120-131`) |
| `keyTerms` | `{kind:'keyTerms', terms: {term, definition}[]}` | "Key terminology" definition list (donor `LessonViewer.tsx:140-154`) |
| `sourced` | `{kind:'sourced', source:'official'\|'explanation'\|'recommendation'\|'examTip', heading?: string, body: string}` | source-badged prose card; `heading` when present; body via shared `Markdown` |
| `figure` | `{kind:'figure', caption: string, mermaid?: string}` | "Visual explanation" section: lazy Mermaid diagram + caption |
| `sideBySide` | `{kind:'sideBySide', comparison: Comparison}` | the exported comparison body — N-column table + sample tabs + migration cards |
| `mistakes` | `{kind:'mistakes', items: {mistake, fix}[]}` | "Common mistakes" mistake→fix pairs (donor `LessonViewer.tsx:251+`) |
| `examTips` | `{kind:'examTips', tips: string[]}` | "Exam tips" callout list (donor `LessonViewer.tsx:284+`) |

- Section titles these renderers draw themselves mirror the donor labels exactly
  ("Learning objectives", "Key terminology", "Visual explanation", "Common
  mistakes", "Exam tips") — the extractor relies on them (locked decision 2).
- `src/ui/Mermaid.tsx`: `useEffect` dynamic `import('mermaid')`,
  `mermaid.initialize({startOnLoad:false, theme:'neutral', securityLevel:'strict'})`,
  `mermaid.render(id, chart)` → `dangerouslySetInnerHTML`; on ANY failure
  (import or render) fall back to `<pre>` of the chart source. Fixed neutral
  theme — no light/dark switching (donor behavior). **Render ids must be unique
  per invocation** (module counter or `useId`, mirroring donor
  `Mermaid.tsx:19-21`): mermaid v11 keys DOM nodes by that id, the hub mounts
  under `<StrictMode>` (`src/main.tsx:15-19`) which double-invokes effects in
  dev, and a static id collides on the second render — the throw would be
  silently absorbed by the fallback, degrading every figure to `<pre>`.
  Trust boundary (recorded in the module docstring): `securityLevel:'strict'`
  is the sanitizer — escaped labels, click callbacks disabled; the hub has no
  CSP, so chart strings are trusted exactly as far as content authoring is
  PR-gated (roadmap §2).
- Registration guard: `registerBlockKind` overwrites silently
  (`src/sdk/registry/blocks.tsx:36-43`), so the renderers module asserts each
  kind id is NOT already registered before registering — a second registration
  of the same id anywhere in the graph throws at import time instead of
  clobbering (cheap one-line guard per kind or a loop over the kind list).
- `src/ui/Compare.tsx`: extract the comparison body (table `:53-78`, sample
  tabs `:80-86`/`SampleTabs :117-167`, migration grid `:88`/`:169-192`) into an
  exported component (e.g. `ComparisonBody({comparison})`); the `Compare` page
  renders it unchanged. The `sideBySide` renderer reuses it — no second
  implementation of the matrix/samples/migration markup.
- Styles: add the new block classes to `src/styles/views.css` following the
  existing `blk-*` conventions; respect the 4 themes via existing tokens (no
  hard-coded colors).
- Extension payload TypeScript types live in the renderers module (or a sibling
  types file under `src/content/dp-800/`) — NOT in `src/sdk/types.ts` (extension
  payloads stay outside the core schema by design).

### Non-functional

- `mermaid` must not appear in the initial bundle: only the dynamic import
  inside the figure path references it.
- No core-kind renderer changes; gh packs' markup identical (their lesson
  blocks use core kinds only).
- Renderer functions stay presentational; no data fetching, no store access.

## Architecture

```
src/content/dp-800/renderers.tsx   (registration — side-effect, both entries import it)
  ├─ objectives / keyTerms / sourced / mistakes / examTips → local markup + ui primitives
  ├─ figure → src/ui/Mermaid.tsx ── dynamic import('mermaid')  [async chunk]
  └─ sideBySide → ComparisonBody (exported from src/ui/Compare.tsx)
                    └─ also used by the Compare page itself (one implementation)

fixtures: inline in src/content/dp-800/renderers.test.tsx (jsdom + RTL)
```

## Related Code Files

### Create

- `src/ui/Mermaid.tsx` — lazy mermaid renderer with `<pre>` fallback
- `src/content/dp-800/renderers.test.tsx` — per-kind fixture tests

### Modify

- `src/content/dp-800/renderers.tsx` — register the 7 kinds + payload types
- `src/ui/Compare.tsx` — export `ComparisonBody`; page consumes it (no visual change)
- `src/styles/views.css` — block classes for the new kinds
- `package.json` + lockfile — add `mermaid: ^11.16.0`
- `src/ui/Compare.test.tsx` — pin that the page still renders (extraction refactor guard)

### Delete

- (none)

## Implementation Steps

1. `npm install mermaid@^11.16.0`; create `src/ui/Mermaid.tsx`; unit tests:
   success path with the real library is NOT required in jsdom — test (a) the
   fallback `<pre>` when the dynamic import rejects (mock the module to throw),
   (b) that a successful mocked render injects the SVG via
   `dangerouslySetInnerHTML`, (c) initialize called with the pinned options,
   (d) two renders of the same chart pass DISTINCT ids to `mermaid.render`
   (the StrictMode double-invoke invariant).
2. Extract `ComparisonBody` from `Compare.tsx`; keep `Compare` behavior
   byte-identical; extend `Compare.test.tsx` if needed to cover samples tabs +
   migration cards through the page (they were covered by scout reading — make
   them pinned now since two consumers depend on the body).
3. Implement the 7 registrations in `renderers.tsx` with payload types; add the
   `views.css` classes.
4. `renderers.test.tsx`: one fixture per kind incl. a `sourced` per each of the
   4 `source` values, `figure` with + without `mermaid`, `sideBySide` carrying
   samples + a full 6-field migration, `mistakes` multi-item, unknown-field
   tolerance (extension payloads are open). Render through `renderBlock` (the
   registry dispatch), not direct component calls — that is the real path.
5. Gates: `npm test`, `npm run content:check` (still 3 packs, kinds unused —
   must stay green), `npm run lint`, `npm run build` (mermaid NOT in entry chunk).

## Success Criteria

- [x] All 7 kinds render via `renderBlock` in jsdom with correct section titles
      and content (fixture-tested, incl. all 4 `sourced` variants)
- [x] `sideBySide` renders table + sample tabs + migration cards through the
      same `ComparisonBody` the Compare page uses (single implementation)
- [x] Mermaid fallback `<pre>` proven on failure; initialize options pinned;
      per-render ids proven distinct; build output shows mermaid only in an
      async chunk
- [x] `Compare` page tests unchanged-green after the extraction refactor
- [x] `npm test` / `npm run content:check` / `npm run lint` / `npm run build` green

## Risk Assessment

| Risk | Break signal | Pre-decided response |
| --- | --- | --- |
| A kind id accidentally collides with a core kind (Zod rejects it at pack load in phase 3) | phase 3 `content:check` "core kinds use their typed shape" | Rename the extension kind in renderers + extractor together — the 7 ids are pinned in locked decision 2; collision would mean a decision revisit, not a silent rename |
| Mermaid renders differently in the hub than the donor (theme/security options drift) | visual diff in phase 6 walkthrough | Options are pinned verbatim (decision 5); any diff → compare against donor `Mermaid.tsx:17-44` first |
| `ComparisonBody` extraction changes Compare page markup/CSS | `Compare.test.tsx` red or visual diff | The extraction must be move-only; if a class needs to move with it, move the CSS selector too — do not duplicate styles |
| jsdom chokes on something inside mermaid even when mocked | renderer test flake | Mock at the `import('mermaid')` boundary (vi.mock), never load the real library in jsdom; real rendering is a phase 6 manual item |
| Adding mermaid breaks the lockfile/build on the repo's Node version | install/build failure | Pin `^11.16.0` (donor-proven version, `learn-dp-800/package.json:19`); if install fails, stop and replan — do not downgrade silently |
