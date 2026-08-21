# Captain Corgi Learning Hub

Personal certification-prep workspace: one interactive study app per subject,
all wrapped in the Captain Corgi brand, with a plan to unify everything into a
single learning platform.

> Independent study aids. Not affiliated with or endorsed by Microsoft or GitHub.

## Layout

| Path | Subject | Stack | Run |
| --- | --- | --- | --- |
| _(repo root)_ | Unified hub — shell + Content SDK, engines, and the full study UI (learn, labs, practice, exams, compare, notes) over content packs | Vite + React 19 + TypeScript | `npm install && npm run dev` |
| [`learn-dp-800/`](learn-dp-800/) | Microsoft DP-800 — SQL AI Developer Associate | Next.js 15 + React 19 + Tailwind v4 | `npm install && npm run dev` |
| [`learn-gh-200/`](learn-gh-200/) | GH-200 — GitHub Actions | Vite + React 19 + TypeScript (Node 20+) | `npm install && npm run dev` |
| [`learn-gh-600/`](learn-gh-600/) | GH-600 — Agentic AI Developer study companion | Static HTML | `make run` → http://localhost:8080 |
| [`mockups/`](mockups/) | Design mockups for the unified hub | Static HTML | open in a browser |
| [`docs/`](docs/) | Plans and decisions | Markdown | — |
| [`plans/`](plans/) | Execution plans and reports | Markdown | — |

Each `learn-*` app is vendored directly in this repository (no submodules, no
external clones) with its own README; start there for details on features,
tests, and deploys.

## Unified platform

The four subjects are being merged into one Vite + React 19 SPA where every
subject becomes a content pack on a shared shell (progress, spaced repetition,
exams, notes, themes). The hub runs from the repo root (`npm run dev`) with
hash routes — `#/` for the home rail and `#/subject/:id/:mode[/:id]` per
workspace. The Content SDK (`src/sdk/` — unified schema, Zod validation,
content source over `content/<subject>/` packs) and the engines
(`src/engines/` — grading, exam scaling, sampling, SRS, streaks, per-subject
progress store) sit under the study UI (`src/ui/`), which renders every mode a
pack enables: lessons with knowledge checks and notes, labs, shuffled practice,
timed exams with reviews and per-domain breakdowns, comparisons, and a
notes/bookmarks tab. Progress, attempts, notes, and bookmarks persist locally
per subject. Installed packs: GH-900 (GitHub Foundations), GH-200 (GitHub
Actions), GH-600 (Agentic AI Developer), DP-800 (SQL AI Developer), and the
`content/fixture/` pack that exercises the whole schema (`npm test`, `npm run
content:check`). Adding a subject needs no core-code edits:
`npm run content:new -- --id <kebab-id> --code <CODE> --title <t> --accent
<token>` stamps a working starter pack (one welcome lesson and one practice
question, `learn` + `practice` modes) under `content/<id>/`; packs are
discovered by a Vite glob, so a running dev server must be restarted to see
the new subject. On first load the hub also imports, one time, any progress
left in the same browser by the retired standalone GH-200 app (lessons, labs,
and exam history), by the GH-600 study companion (passed domains), and by the
DP-800 donor app (lessons, labs, practice, exams, notes, bookmarks, and
review scheduling). See
[docs/unified-learning-hub-plan.md](docs/unified-learning-hub-plan.md) for the
full plan, schema, and target structure.

## CI & deploy

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull
request: `npm ci` → `npm run lint` → `npm test` → `npm run content:check` →
`npm run build` — the identical command set as the local gate. The extractor
scripts compile and the GH-600 parity suites test against the `learn-*` donor
sources, which live in this repository as vendored directories — the donors
are build inputs, not optional extras.

A push to `main` — and only that — additionally publishes the built `dist/`
to GitHub Pages once the gate is green. The site is live at
<https://ntttrang.github.io/learning-hub/>; pull requests run the full gate
but never deploy. The repository is public because GitHub Pages on a private
repository requires a paid plan.

Docker image publishing and an AWS deploy are a deferred follow-up (the
optional track of roadmap Phase 7), not part of this pipeline.

## License

[MIT](LICENSE)
