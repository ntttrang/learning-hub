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

Each `learn-*` app is its own git repository with its own README; start there
for details on features, tests, and deploys.

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
Actions), GH-600 (Agentic AI Developer), and the `content/fixture/` pack that
exercises the whole schema (`npm test`, `npm run content:check`). On first
load the hub also imports, one time, any progress left in the same browser by
the retired standalone GH-200 app (lessons, labs, and exam history) and by the
GH-600 study companion (passed domains). See
[docs/unified-learning-hub-plan.md](docs/unified-learning-hub-plan.md) for the
full plan, schema, and target structure.

## License

[MIT](LICENSE)
