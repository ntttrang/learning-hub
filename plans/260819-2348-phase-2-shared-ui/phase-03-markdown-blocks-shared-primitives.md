---
title: "Phase 3: Markdown, blocks, shared primitives"
status: done
---

# Phase 3: Markdown, blocks, shared primitives

## Overview

Build the prose layer every viewer sits on: the `Markdown` component
(react-markdown + GFM + code highlighting + docId link resolution), the
brand-styled upgrade of the core block renderers, and the small shared UI
primitives (Button, Pill, ProgressBar, Callout, DataTable, CodeBlock,
InlineText) ported from the donors.

## Requirements

- [x] `ui/Markdown.tsx` renders GFM markdown: headings, lists, bold/italic, inline code, fenced code with syntax highlighting, tables.
- [x] `[label](docId)` links resolve against the pack's `docs` registry into external links (`noopener noreferrer`); plain URLs pass through; unresolved docIds render as literal text.
- [x] `md` block renderer delegates to `Markdown`; bodies normalized for CRLF before paragraph handling.
- [x] Core block renderers styled: `heading` (anchor-friendly), `list` (items through `InlineText`), `code` (CodeBlock with language chip), `tip` (Callout), `table` (DataTable; ragged rows render defensively — no crash on short/long rows).
- [x] Primitives: `Button` (primary/secondary/ghost, icon slot), `Pill`, `ProgressBar` (accessible, `role="progressbar"`), `Callout`, `DataTable` (caption, semantic `<th scope>`), `CodeBlock` (label + hljs classes), `InlineText` (gh-200's `` `code` ``/`**bold**`/`[label](docId)` tokenizer, tests ported).
- [x] All styling token-based in `src/styles/views.css`; works in Auto/Light/Dark/Night; reduced-motion respected; hljs tokens mapped to brand vars (no imported hljs theme).
- [x] Graders and Zod schemas untouched; `content:check` stays green.

## Architecture

`Markdown` takes `{ children: string, docs?: DocRegistry }` — the docs
registry flows from the loaded `SubjectContent` via props/context, never a
module-level import (content stays behind the `ContentSource` seam). The
custom `a` component: href without a scheme matching a docs key → resolved
link; http(s) → external link; otherwise literal text. `CodeBlock` uses
`highlight.js` directly for standalone code (lab SQL, block `code`); md fenced
code goes through `rehype-highlight` inside `Markdown` — both emit the same
`.hljs-*` classes, so one token-mapped stylesheet covers both.

Block renderer upgrades happen **in place** in `sdk/registry/blocks.tsx`
(registry stays the dispatch point; renderers may import from `ui/` — the
dependency direction `sdk → ui` for presentation helpers is acceptable only
for these renderer files; engines never import `ui/`). Alternative rejected:
forking renderers in `ui/` would create two dispatch paths and break the
extension contract.

## Related Code Files

- Create: `src/ui/Markdown.tsx`, `src/ui/CodeBlock.tsx`, `src/ui/Button.tsx`,
  `src/ui/Pill.tsx`, `src/ui/ProgressBar.tsx`, `src/ui/Callout.tsx`,
  `src/ui/DataTable.tsx`, `src/ui/InlineText.tsx`, `src/styles/views.css`
  (+ per-file tests)
- Modify: `src/sdk/registry/blocks.tsx` (styled core renderers + CRLF
  normalization), `src/sdk/registry/blocks.test.tsx`, `src/main.tsx`
  (import `views.css`)
- Reference donors: `learn-dp-800/src/components/{Markdown,SqlBlock}.tsx`,
  `learn-gh-200/src/components/ui/*`, `learn-gh-200/src/utils/inline.ts`

## Implementation Steps

1. Port `InlineText` + its tests from gh-200 (`utils/inline.ts`), swapping the app-level docs lookup for an injected resolver.
2. Build `Markdown` with the Phase 1 spike result; wire the docId link component; test headings/lists/bold/code/table/docId-link/unresolved-docId.
3. Build `CodeBlock` (label chip, hljs highlight, `data-language`), `Button`, `Pill`, `ProgressBar`, `Callout`, `DataTable` (port gh-200's, token-ize colors).
4. Upgrade `blocks.tsx` core renderers: `md` → CRLF-normalize then `Markdown`; `code` → `CodeBlock`; `tip` → `Callout`; `table` → `DataTable`; `list`/`heading` styled. Update `blocks.test.tsx` assertions for the new structure.
5. Write `views.css`: prose scale, code blocks, tables, callouts, buttons, pills, progress, hljs token map — all through `tokens.css` vars; `@media (prefers-reduced-motion: reduce)` guard on transitions; import in `main.tsx`.
6. Cross-theme check: verify each new surface in Light/Dark/Night (Auto follows system) — at minimum via class/var audit in tests plus a dev-server eyeball pass.

## Todo

- [x] InlineText ported with tests
- [x] Markdown component + docId link resolution + tests
- [x] CodeBlock + primitives + tests
- [x] Block renderers upgraded in place; CRLF + ragged-table hardening; tests updated
- [x] views.css (tokens only) + hljs token map + main.tsx import
- [x] Four-theme audit of new surfaces (var audit: all vars resolve in tokens.css, no
  hex outside it, `--code-bg`/`--code-fg` theme-constant, reduced-motion via the
  global guard in app.css; the dev-server eyeball rides phase 5, where these
  surfaces first become reachable in-app through the lesson viewer)

## Close-out notes

- Review gate: code-reviewer returned no critical findings; the one High finding
  (docs-registry `url` values rendered as `href` without a scheme check — the raw
  markdown path already sanitized) was fixed by routing every link path through
  `isExternalUrl` (`src/ui/external-url.ts`); non-http registry urls now degrade
  to literal text. Low finding (duplicate React keys for repeated table headers)
  fixed with index-based keys. Zod-side url tightening is deferred with the schema
  freeze and belongs to the real-pack phase.
- Test gate: tester adversarial pass found zero product bugs; +30 branch tests
  (294 total). Known-unreachable defensive branch: CodeBlock's `hljs.highlight`
  try/catch (guarded by `hljs.getLanguage`).
- Tracking note: the build now emits a >500 kB chunk warning (react-markdown +
  rehype-highlight + highlight.js). Candidate for lazy-loading in phase 5/7 when
  real viewers land; not a defect.

## Success Criteria

- The fixture's `.mdx` lesson body renders real markdown (h2, bold, list) — not paragraph soup.
- Unknown docs link never renders a dead anchor; every rendered link is either resolved-doc or explicit external.
- `npm test && npm run lint && npm run build && npm run content:check` green; no grader/schema edits.

## Risk Assessment

**Risk:** `sdk/registry/blocks.tsx` importing from `ui/` creates a cycle if
`ui/` ever imports the registry. **Signal:** tsc/vitest cycle error. **Response:**
keep `ui/` primitives leaf-only (they import tokens/types, never registries);
`Markdown`'s docs resolver is injected, so the cycle cannot close through it.
**Risk:** hljs token coverage differs by language. **Signal:** unstyled keyword
classes for `sql` vs `yaml`. **Response:** style the small common set
(keyword/string/comment/number/title/attr) and let the rest inherit
`--code-fg` — deliberate, not exhaustive.
