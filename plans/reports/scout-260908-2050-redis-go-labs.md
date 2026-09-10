# Scout — Redis Go client labs (feeds plan 260908-2104-redis-go-labs)

Date: 2026-09-08 · Branch: `feat/redis-pack` · Scouted from working tree.

## Verdict

Pure content delivery. New domain + 8 labs in `content/redis/`. **No `src/` edits
required** — the schema and UI are data-driven and already accept a cert-less domain.

## Validated facts

### Pack gate
- `npm run content:check` → `vitest run src/content/content-check.test.ts` — loads
  every pack through files → glob → Zod → graph validation → registry coverage;
  one failing pack fails the build. Also green required: `npm test`, `npm run build`,
  `npm run lint` (oxlint).
- `src/content/content-check.test.ts:26` — `loadAllContent()` throws on any schema
  or contract issue.

### Lab schema — `src/sdk/validate.ts:168-189` (`LabSchema`, `.strict()` — no extra fields allowed)
- Required: `id`, `domainId`, `title` (min 1), `minutes` (positive number), `summary`
  (min 1), `steps` (array, min 1).
- `LabStepSchema` (:156-166, strict): `title?`, `instructions` (min 1), `starterSql?`,
  `hint?`, `solution?`, `expectedOutput?`, `validation?`.
- Optional: `outcomes[]`, `checks[]`, `difficulty` (`beginner|intermediate|advanced|challenge`),
  `scenario?`, `objective?`, `prerequisites[]`, `engines[]`, `schemaSql?`, `seedSql?`,
  `engineNotes?`, `solutionExplanation?`.
- `lessonId` optional (:172); `labs.json` is a bare JSON array (9 entries today).

### Domain schema — `src/sdk/validate.ts:64-74` (`DomainSchema`, `.strict()`)
- `{id, order (number), code?, title (min 1), weight?, summary?, tracks?}`.
- `weight` = `"35-40%"` string or `{min,max}` object; omit for a non-cert domain.
- `tracks` = string array (existing values: `"Developer"`, `"Software Operator"`, …);
  omitted/empty renders nothing — cert-less domain is safe.

### Ref checks — `src/sdk/validate.ts:419-424`
- `lab.domainId` must resolve to a `domains.json` entry; `lab.lessonId` (when set)
  must resolve to an existing lesson. No check requires a domain to own modules or
  lessons (fixture pack proves domains can be bare).

### Existing content
- `content/redis/domains.json` — 19 domains, `rc-dev-java` has `order: 8`, `code: "D8"`,
  `tracks: ["Developer"]`. Core domains 1-7, swops 9-11, cloud 12-19. New domain takes
  `order: 20` (append; UI sorts by `order`), `code: "D20"` optional.
- `content/redis/labs.json` — 9 labs; lab id convention `lab-<kebab-slug>`.
  Client-style reference lab: `lab-jedis-cache-aside` (steps carry fenced Go-relevant
  patterns: instructions with code fences, expectedOutput, hint, solution).
- `content/redis/subject.json` — `enabledModes` includes `labs`; certs are
  `["Developer (Java)", "Software Operator", "Cloud Operator"]`. Go labs are practice
  (no cert) — summaries must say so honestly.

### UI (read-only confirmation — no edits)
- `src/ui/SubjectOverview.tsx:83-85`, `LearnIndex.tsx:65`, `PracticeIndex.tsx:84-86`
  render `domain.tracks` only when non-empty. Labs view (`LabIndex.tsx`) groups by
  domain data.
  ERRATUM (red team 2026-09-08): FALSE as written — `src/ui/LabIndex.tsx:33-67`
  renders a flat `content.labs.map()` grid with no domain reference; labs appear
  in labs.json array order with lesson back-links only.
  No hardcoded `rc-*` ids anywhere in `src/` (grepped).

### File ownership / conflicts
- This plan owns: `content/redis/domains.json`, `content/redis/labs.json`, plus
  one README row amendment (root `README.md:42-46` describes installed packs).
- Off-limits: `src/ui/**` + `src/styles/**` (owned by pending plan
  `260821-1457-ui-redesign-brand-conformance`), `content/languages/**` +
  `scripts/polyglot-*` (owned by in-progress `260903-1450-polyglot-languages-subject`).
  `src/ui/SubjectOverview.tsx` had uncommitted changes at scouting time — the
  workstream has since committed them (`631dbd9` on `feat/redis-pack`). Either way:
  do not touch.

### Research input
- go-redis v9 API verification: researcher report (arriving) will be saved to
  `plans/reports/` — author labs against it; verify API names before writing Go code.

### House style for plan files
- Model: `plans/260903-1753-redis-subject/plan.md` + `phase-0*.md` — frontmatter
  (title/description/status/priority/effort/tags/blockedBy/blocks/created), Overview
  with brainstorm-report link, Goals table, Phases table, Cross-Plan Dependencies,
  Success Criteria checklist. Phase files follow the canonical ak-plan template.
