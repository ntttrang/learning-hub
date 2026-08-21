# Phase 6 — End-to-end verification report

Date: 2026-08-21 · HEAD at verification: `18a79d7` (phase 5)

## Gates

| Gate | Result |
| --- | --- |
| `npm test` | 56 files, **542/542 passing** (includes the concurrent session's in-flight search files, all green) |
| `npm run content:check` | 1 file, **5/5 passing** — all five packs validate (fixture, gh-200, gh-900, gh-600, dp-800). The phase spec's "4 packs" line was stale: the gh-600 pack landed between phases and phases 3–5 already verified against 5. |
| `npm run lint` (oxlint `src scripts`) | clean, no findings |
| `npm run build` (vite → rolldown) | clean; only the pre-existing >500 kB chunk-size warning and the pre-existing gray-matter `eval` notice (both present before this plan) |
| `npm run content:extract-dp800 -- --dry-run` | echo matches the phase-3 emission exactly: root 6 · domains 3 · modules 11 · lessons 43 · questions 179 (41+40+23+15+60) · labs 3 · exams 2 · comparisons 4 · docker 8 files + 1 authored safety README · total files 228 |
| `npm run content:extract-dp800` (flagless re-run) | same counts; `git status` shows **zero** changes under `content/` or `public/` — emission is byte-identical |

## Build inspection — mermaid stays async

- The mermaid family emits as separate lazy chunks: `mermaid.core` (79.87 kB), `sequenceDiagram` (115.74 kB), `architectureDiagram` (148.48 kB), `blockDiagram`, `ganttDiagram`, `c4Diagram`, `quadrantDiagram`, `vennDiagram`, `xychartDiagram`, `swimlanes` (114.11 kB), plus layout deps `cytoscape.esm` (434.92 kB) and `cose-bilkent` (81.25 kB).
- Exactly **one** mermaid import site exists in source and it is dynamic: `src/ui/Mermaid.tsx:28` (`await import('mermaid')`). No static import or `require` anywhere in `src/`.
- Entry chunk `index-*.js` is 2,233.96 kB (gzip 613.17 kB) — it cannot contain mermaid (a static path would have inlined the family and no separate chunks would exist). The dp-800 delta to the entry is the renderer seam + engine labels only, as designed.
- Other large async chunks: `katex` 258.69 kB, `chunk-FOHPRMQF` 662.12 kB (lazy lesson/dp-800 renderer bundle).

## Hub home — dp-800 card

Verified from the pack (`content/dp-800/subject.json`) and the shell: title "Developing AI-Enabled Database Solutions", subtitle "SQL AI Developer · 3 domains", accent `sky-cyan`, 7 `enabledModes` (learn, labs, practice, exams, compare, notes, revision). `views.test.tsx` asserts the DP-800 heading on home, `Installed` ×5, rail+card links to `#/subject/dp-800`, the workspace rendering from the hash, and all seven content modes.

## Docs — README only (smallest owning surface)

`README.md` unified-platform section, two sentences amended and nothing else: DP-800 added to the "Installed packs" list, and the one-time-import sentence now also names the DP-800 donor app (lessons, labs, practice, exams, notes, bookmarks, review scheduling). No other docs touched — no user-visible workflow changed beyond what those two sentences describe.

## Donor integrity

- `git -C learn-dp-800 status`: no tracked modifications. Only the donor's own pre-existing untracked files (`.github/copilot-instructions.md`, `.vscode/`, `docs/`) — untouched by this plan.
- `diff -rq learn-dp-800/docker public/dp-800/docker`: all 8 verbatim files byte-identical; the authored safety `README.md` is the only deliberate extra on the hub side.

## Walkthrough checklist → automated coverage

No browser automation is available in this workspace, so every checklist item was verified against the test surface that drives the same code path (the phase 4–5 pattern). jsdom renders the real components through RTL; only aesthetic eyeballing is inherently human.

| Walkthrough item | Covering evidence |
| --- | --- |
| Learn: l0103 flagship renders all donor sections | `dp-800-modes.test.tsx:45` (every donor section through the extension renderers); block order pinned by `pack-parity.test.ts:387` |
| Learn: prev/next + mark complete | `LessonViewer.test.tsx:189` (prev/next along the sequence), `:166` (bookmark/completion persist through the store) |
| Labs: lab-rls rich surface, reveal toggles, engine notes | `dp-800-modes.test.tsx:197` (rich surface with working reveal toggles) |
| Practice: "Everything, shuffled" = 179 | `dp-800-modes.test.tsx:85` (full 179-question bank leads, every module scope resolves) |
| Practice: module card m01 lab-coding drill | `pack-parity.test.ts:303` (179 partition: 104 knowledge-check + 15 exam + 60 lab-coding) |
| Exams: mock-1 intro 70 min / passing 700 | `content/dp-800/exams.json` — `durationMinutes: 70`, `passingScore: 700`, Zod-validated; intro gate asserted in `dp-800-modes.test.tsx:173` ("Before you begin" → untimed start) |
| Exams: cs-1 case-study panel on the 5 `q-cs1-*` | `dp-800-modes.test.tsx:173` walks the fixed paper to position 46 and asserts the "Contoso Support semantic search" region |
| Exams: mock-2 = 30 ids / 45 min | `exams.json` — 30 fixed ids, `durationMinutes: 45`; donor order pinned by `pack-parity.test.ts:354` |
| Exams: results + per-domain review | `ExamReview.test.tsx` + `recordExam` per-domain ingest in `subject-store.test.ts` |
| Compare: 4-entry picker, full body | `dp-800-modes.test.tsx:112` (all four comparisons offered; one rendered in full) |
| Compare: column labels cannot drift | `pack-parity.test.ts:398` (every label equals `engineLabel(id)`) |
| Compare: sample tabs + keyboard | `Compare.test.tsx:41` (tablist keyDown on the sample tabs) |
| Compare: 6 migration cards | `dp-800-modes.test.tsx:140–150` (Migration guidance region with all six card labels) |
| Migration round-trip: seed → refresh → once → unchanged | `migrate-dp800-progress.test.ts` (persist→reload via two localStorage-backed stores + `vi.waitFor`; double-run guard; donor key byte-untouched; SRS store-only) |
| Themes: Auto/Light/Dark/Night | `ThemeToggle.test.tsx` (four modes render, active marking, document `data-theme` + persistence, auto shadowing) |
| Mermaid renders as diagram, `<pre>` only on failure | `Mermaid.test.tsx` verifies the wrapper contract against a **mocked** library boundary (`vi.mock('mermaid')` — jsdom cannot run the real library; the file header says so): `:29` renders the SVG the mock produced, `:39` pins the init options (no autostart, neutral theme, strict security), `:53` asserts the `<pre>` fallback only fires when the library throws. The real in-browser render is **not** machine-verified — see the residual human pass below. |
| a11y: keyboard nav + tablists | `views.test.tsx:164` (subject-mode tablist keyDown), `Compare.test.tsx:41` (sample tablist keyDown); role-based queries throughout enforce labeled regions |

Residual human pass (recommended, not blocking): the one item automation cannot cover — **the real mermaid figure rendering as a diagram (not a `<pre>` fallback) across Auto/Light/Dark/Night** in a browser; per the phase spec, a `<pre>` appearing anywhere in a healthy render is a bug. Plus visual eyeballing of the four themes' contrast and the hands-on keyboard feel. Everything else above is machine-verified.

## Parity deltas record (deliberate, user-approved)

1. **Lab-coding drill cards/sourceUrl not ported** (plan decision 9): the 60 lab-coding questions live in the practice bank; the donor's per-card presentation is not reproduced.
2. **No in-app `/setup` page** (decision 12): the lab prerequisites string was amended to point at `public/dp-800/docker/`, where the authored safety README guides setup; docker files are byte-identical copies.
3. **Donor compare→lesson "Full lesson" links not ported**: the hub Comparison schema has no lesson back-reference; the lessons→comparison direction survives via `sideBySide` blocks (deep-equal to `comparisons.json`, `pack-parity.test.ts:363`).
4. **Theme, achievements, and streak not migrated** (decision 13): the donor's per-app theme, 8 achievement defs, and streak have no per-subject hub home; the import summary states this in its info line.

## Outcome

Phase 6 acceptance criteria are met: every gate green, the extractor is byte-stable, the donor is untouched, mermaid remains async-only, the hub home shows the five-pack reality, and the README names DP-800 in its two owning sentences. No findings were routed back to owning phases — the walkthrough surfaced no product bugs.

Review (code-reviewer, 2026-08-21): DONE_WITH_CONCERNS → resolved. 17/18 spot-checked citations exact; the one finding (Medium) was this report overstating the mocked Mermaid test as a "real library run" — corrected above, and the real four-theme in-browser mermaid render is now the headline item of the residual human pass. No code changes warranted or made.
