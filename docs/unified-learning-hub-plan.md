# Captain Corgi Learning Hub — Unified Platform Plan

Merge `learn-dp-800`, `learn-gh-200`, and `learn-gh-600` into **one Vite + React 19 SPA**
where every subject is a **content pack** on a shared shell, and expansion happens by
adding data — never by forking the app.

---

## 1. Contract

- **Outcome:** a single branded hub hosting DP-800, GH-200, GH-900, and GH-600 through one
  shared shell (navigation, progress, practice, exams, notes, themes), extensible to new
  subjects, content types, and learning tools via plug-in registries.
- **Constraints:** reuse existing typed content; client-only `localStorage` persistence
  behind a swappable adapter; keep the Captain Corgi brand; remain static-hostable
  (GitHub Pages) with an optional Docker/AWS deploy path.
- **Non-goals (now):** backend/auth/cloud sync, rewriting lesson prose, changing exam
  scoring math, mobile-native apps.
- **Acceptance:** all four subjects render through the same shell; adding a subject needs
  zero core-code edits; platform-wide content-integrity tests pass; Auto / Light / Dark /
  Night themes + a11y apply globally.

## 2. Decisions (locked)

| Decision | Choice |
| --- | --- |
| Shell stack | **Vite + React 19 + TypeScript** (base: `learn-gh-200`) |
| Schema source | **`learn-dp-800/src/lib/types.ts`** (richest), generalized |
| Structure | **Single unified app**, subjects as content packs |
| Content storage | **Versioned data files** (`.mdx` prose + `.json` structured) under `content/`, loaded via Vite glob, validated with Zod. No database. |
| Authoring | Developers, via files + git PRs |
| User data | Zustand + storage adapter, **`localStorage` now** (adapter kept ready for optional Supabase sync later) |
| Deploy | Static export → GitHub Pages (primary); Docker image → AWS (optional) |

## 3. Current-state inventory

| App | Subject(s) | Stack | Content shape | Merge role |
| --- | --- | --- | --- | --- |
| `learn-dp-800` | DP-800 | Next.js 15, Tailwind v4, Zustand | Rich typed model (`lib/types.ts`), fixed 18-section lessons, DB-engine compare, Docker labs | Donates the **schema**; migrate Next → Vite |
| `learn-gh-200` | GH-900, GH-200 | Vite + React 19 | Flexible `LessonBlock` union, question union, seeded exams | Donates the **shell + engines**; smallest-delta first pack |
| `learn-gh-600` | Go/Docker/AWS cert | Static HTML | Prose HTML: exams, practice, study plan, labs | Ported to typed pack (largest authoring effort) |

Both typed apps already model the same concepts (Subject → Domain → Module/SubSkill →
Lesson/Lab/Question/Exam/Compare + progress, SRS, notes, streaks, 3 themes). The unified
shell adds Auto (follow `prefers-color-scheme`) on top of Light / Dark / Night. The
divergence is stack + content shape only.

## 4. Target repository structure

```
src/
  main.tsx
  shell/            # generic app frame — knows nothing about any subject
    AppShell.tsx  HubHome.tsx  SubjectWorkspace.tsx  router.ts  theme.ts
  sdk/              # Content SDK: the contract every pack satisfies
    types.ts        # unified schema (from dp-800 types.ts, generalized)
    registry/
      blocks.tsx    # lesson block-type registry (renderer per kind)
      questions.tsx # question-type registry (render + grade per kind)
      tools.ts      # learning-tool/mode registry (opt-in tabs)
    validate.ts     # content-integrity checks (platform contracts)
  engines/          # written once, reused by every subject
    store.ts progress.ts srs.ts scoring.ts streak.ts search.ts revision.ts
  ui/               # shared views
    LessonViewer.tsx QuizRunner.tsx ExamEngine.tsx LabViewer.tsx
    Compare.tsx Markdown.tsx Notes.tsx Bookmarks.tsx
  content/          # the packs — pure data
    registry.ts     # lists installed subjects
    dp-800/  gh-200/  gh-900/  gh-600/
  styles/tokens.css # verbatim copy of captain-corgi-hub-design/colors_and_type.css
public/
  brand/            # mascots + star + wordmark (copied from the design skill)
    captain-corgi-hub-avatar.png   # Hub crew — default for hub chrome
    captain-corgi-avatar.png       # personal / creator voice
    icons/star.svg  icons/logo-wordmark.svg
```

## 5. Unified schema (key generalizations)

The DP-800 model is the base. Three changes make it subject-agnostic and extensible:

1. **Lessons become ordered blocks, not fixed named sections.**
   Replace DP-800's fixed `sections{ officialConcepts, sqlServerImplementation, ... }`
   with GH-200's approach: `Lesson.blocks: Block[]` where `Block` is a discriminated
   union resolved through the **block registry**. DP-800's specialized sections
   (`sideBySide`, `sqlServerImplementation`) become registered block kinds, so their
   richness is preserved without hard-coding them into the core viewer.

2. **Comparison is generic (N columns), not DB-only.**
   Merge `DbComparison` (4 fixed engines) and `CompareData` (2 columns) into one
   `Comparison { columns: string[]; rows: Record<columnId,string>[] }`. DP-800 supplies
   4 engine columns; GH-200 supplies “GitHub vs Jenkins/AWS”; future subjects supply
   their own.

3. **Question union unified + normalized kind names.**
   `single | multi | order | matching | fill | codeReading | bug`. Each kind registers a
   renderer + grader in the **question registry**; `scoring`/`srs` engines stay generic.

Plus a top-level **`Subject`** entity: `{ id, code, title, accent, disclaimers,
enabledModes[], domainIds[] }`. `accent` is a **brand token name** (`sky-cyan` |
`hub-green` | `corgi-orange` | `hub-coral` | `petal-pink` | `deep-teal` |
`captain-red`), not a free-form hex. Progress/SRS/notes keys are namespaced by
`subjectId`.

## 5b. Content storage & authoring (no database)

Content is **data, not code** — files carry no component logic, so adding a subject means
adding files, never editing UI. The **SDK is the boundary**: UI and engines only talk to a
`ContentSource` interface, so the file layout can later be swapped for Supabase/CMS with
zero UI changes.

```
content/
  registry.json            # installed subjects (or auto-discover via glob)
  <subject>/
    subject.json           # metadata: code, title, accent (brand token), enabledModes, domain list
    lessons/*.mdx          # prose in Markdown/MDX + frontmatter (id, title, minutes, domainId)
    questions/*.json       # structured question-union data
    labs/*.json  exams/*.json  compare/*.json
```

- **Format split:** prose-heavy lessons as `.mdx` (reviewable in PRs); structured content
  (questions, exams, labs, compare, metadata) as `.json`.
- **Loading:** `import.meta.glob('/content/**/*.{json,mdx}')` builds a `FileContentSource`
  — no backend, static-hostable.
- **Validation:** Zod schemas derived from the SDK types validate every file at load and in
  CI. This replaces compile-time type safety lost by moving content out of `.ts`, and is the
  mechanism behind the content-integrity contracts (§8).
- **User data stays `localStorage`** behind the storage adapter; the adapter interface leaves
  the door open to Supabase auth + cross-device sync later without touching engines.

## 6. Extension points (how it grows)

| Add a… | Mechanism | Core change? |
| --- | --- | --- |
| Subject | Drop a typed pack under `content/<id>/`, register in `content/registry.ts` | No |
| Content type | Add a `blocks`/`questions` registry entry (renderer + optional grader) | No |
| Learning tool | Add a `tools` registry entry (mode → tab), subject opts in | No |

## 7. Phased roadmap

### Phase 0 — Foundation shell
Scaffold the Vite app (reuse `learn-gh-200` as the starting skeleton). Copy brand
tokens from `.cursor/skills/captain-corgi-hub-design/colors_and_type.css` into
`src/styles/tokens.css` **verbatim** (keep semantic vars). Copy brand assets into
`public/brand/`: Hub-crew + personal mascot avatars, `icons/star.svg`, and
`icons/logo-wordmark.svg`. Build `AppShell` (rail + topbar + router) with **Lucide
icons** (1.75 px stroke, rounded caps — no emoji in chrome, no CSS-drawn star).
Ship the four-mode theme toggle (**Auto / Light / Dark / Night**): persist the
choice in `localStorage['cc-theme']`; omit `data-theme` for Auto so
`prefers-color-scheme` wins. Storage-adapter-backed Zustand store.
*Done when:* hub home + empty subject workspace route, mascot + wordmark render,
and Auto/Light/Dark/Night theming work.

### Phase 1 — Content SDK + engines
Author `sdk/types.ts` (unified schema), the three registries, `validate.ts` (Zod schemas),
and the **`FileContentSource`** that loads `content/**/*.{json,mdx}` via Vite glob behind
the `ContentSource` interface. Port/merge engines from `dp-800/src/lib` (`progress, srs,
scoring, streak, revision, store`) and `gh-200/src/hooks|utils` (`useProgress, grade,
score, sample`), deduping to one implementation each. Bring their existing unit tests along.
*Done when:* engine + Zod-validation tests pass with a tiny fixture pack loaded from files.

### Phase 2 — Shared UI
Reconcile the viewers from both apps into `ui/`: `LessonViewer` (block-registry driven),
`QuizRunner`, `ExamEngine`, `LabViewer`, `Compare`, `Markdown`, `Notes`, `Bookmarks`.
*Done when:* the fixture pack renders end-to-end through every mode.

### Phase 3 — Pack #1: GH-200 + GH-900 (smallest delta)
Adapt existing `learn-gh-200` content to the unified schema (same stack, near-identical
model). Validates the shell against real content first.
*Done when:* both GitHub subjects fully usable in the hub; parity with the old app.

### Phase 4 — Pack #2: DP-800 (framework migration)
Transform DP-800 typed content into a pack; register DB-specific block + comparison
renderers; re-point Docker/lab assets; drop Next-only APIs (`next/image`, App Router).
*Done when:* DP-800 parity, incl. labs, compare matrix, 2 mock exams.

### Phase 5 — Pack #3: GH-600 (HTML → data)
Parse the static HTML (`gh600-*-exam*.html`, `gh600-study-plan*.html`, labs) into typed
lessons/questions/exams. Highest authoring effort; script-assisted extraction.
*Done when:* GH-600 exams + study plan + labs run through the shared engines.

### Phase 6 — Hub polish
Dashboard aggregation across subjects, cross-subject SRS review queue, global ⌘K search,
achievements/streaks, and an **add-subject scaffolder** (CLI or script) that stamps a new
pack from the schema.
*Done when:* the “Add a subject” flow produces a working empty pack.

### Phase 7 — CI/CD + deploy
Static export + GitHub Pages workflow (as DP-800 already does); run
build + lint + tests + **content-integrity validation** in CI. Optional: Dockerfile +
image publish to Docker Hub and deploy to AWS.
*Done when:* green CI publishes the unified site on push to `main`.

## 8. Platform content-integrity contracts (from existing tests, promoted)

- Every referenced lesson/question/lab/exam id resolves.
- Each question is answerable with its own key.
- Each subject exposes only modes it has content for.
- Progress/SRS keys are namespaced per subject (no cross-subject collisions).
- Themes + a11y (keyboard nav, visible focus, reduced-motion) apply globally.

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| DP-800 Next → Vite migration (routing, `next/image`, static export) | Migrate content as data first; port only components; it’s already client-persisted |
| Schema generalization loses DP-800’s DB richness | Preserve specialized bits as **registered block kinds**, not deletions |
| GH-600 HTML extraction fidelity | Script-assisted parse + manual review; keep originals until parity verified |
| Existing users’ localStorage keys | Namespace new keys by `subjectId`; add a one-time migration shim |
| Scope creep into backend/auth | Explicit non-goal; storage adapter leaves the door open |

## 10. Sequencing summary

`Phase 0 → 1 → 2` build the platform; `Phase 3 → 4 → 5` migrate content in ascending
difficulty; `Phase 6 → 7` polish and ship. Each phase is independently testable and
leaves the hub in a working state.
