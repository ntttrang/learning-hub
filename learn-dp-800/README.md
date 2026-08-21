# DP-800 Study Hub — Captain Corgi

An interactive learning platform for **Microsoft DP-800: Developing AI-Enabled Database Solutions** (credential: *Microsoft Certified: SQL AI Developer Associate*).

It covers the full official curriculum, compares Microsoft SQL with **PostgreSQL, MySQL, and Oracle**, offers **hands-on Docker labs**, **quizzes with spaced repetition**, and a **mock-exam engine** with per-domain scoring and a personalized revision plan — all wrapped in the warm, clay-style **Captain Corgi Hub** brand.

> Independent study aid. Not affiliated with or endorsed by Microsoft. Always verify against the official [DP-800 skills-measured page](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-800). Content reflects the skills outline **as of March 12, 2026**.

---

## Features

- **Full curriculum** — 3 official domains, 11 modules, 43 lessons mapped to the skills outline.
- **18-section lesson viewer** — objectives, official concepts (with source-classification badges), diagrams, SQL Server implementation, cross-DB comparison, side-by-side code, real-world scenarios, common mistakes, performance/security, exam tips, knowledge check, summary, and cited references.
- **3 flagship lessons** written in full depth with deep cross-database comparisons: *JSON columns & functions* (D1), *Row-Level Security* (D2), *Vector search* (D3).
- **Cross-database comparison matrix** at `/compare` (SQL Server vs PostgreSQL vs MySQL vs Oracle) with migration notes.
- **Hands-on labs** — one multi-tier lab per domain (guided → fill-in → independent → migration challenge) with schema, seed data, hints, solutions, expected output, validation, and per-engine alternatives.
- **Docker Compose** for SQL Server 2025, PostgreSQL 17, MySQL 9, and Oracle Free 23ai with auto-seeded sample data.
- **Quiz engine** — immediate feedback, detailed explanations, lesson links, seven question types (single, multi, ordering, matching, code-reading, debugging, fill-in SQL), **exam-style lab coding drills** (scenario stems, A/B/C/D and select-two, mapped to the 11 official SQL developer labs), and **Leitner-style spaced repetition** that resurfaces missed questions.
- **Mock-exam engine** — timed/untimed, flag-for-review, question navigator, case studies, per-domain scoring, scaled score, and an auto-generated revision plan. Two full original exams (50-question + 30-question).
- **Progress dashboard** — overall/domain completion, streaks, badges, quiz accuracy, labs completed, weak-area focus, and "continue learning".
- **Personal tools** — notes, bookmarks, and ⌘K search across lessons and labs.
- **Theming** — Clay Cream light, warm dark, and amber "night" themes, with an auto (system) option. All progress persists to `localStorage`.

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (design tokens from the Captain Corgi brand)
- [Zustand](https://github.com/pmndrs/zustand) (state, persisted to `localStorage`; storage adapter kept swappable for future cloud accounts)
- `react-markdown` + `remark-gfm` + `rehype-highlight` for lesson content
- `highlight.js` for SQL code blocks, `mermaid` for diagrams, `lucide-react` for icons
- Vitest + Testing Library for tests

## Getting started

```bash
# install dependencies
npm install

# run the dev server
npm run dev
# open http://localhost:3000

# production build
npm run build
npm run start

# run tests
npm test
```

> The app is fully client-persisted; no backend or database is required to run the website itself. The database engines are only needed to *run the lab SQL scripts*.

## Deploy to GitHub Pages

The site is a fully static export (`output: "export"` → `./out`), so it can be hosted on GitHub Pages with zero server. A workflow at `.github/workflows/deploy.yml` builds and publishes on every push to `main`.

### Root user site (`<username>.github.io`)

1. Create a repo named **exactly** `<username>.github.io` (e.g. `ntttrang.github.io`).
2. Push this project's contents to it (the `package.json` must be at the repo root):
   ```bash
   git init -b main
   git remote add origin https://github.com/<username>/<username>.github.io.git
   git add .
   git commit -m "DP-800 Study Hub"
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
4. The `Deploy to GitHub Pages` workflow runs automatically; your site goes live at `https://<username>.github.io/`.

No base path is needed for a root user site (`BASE_PATH` stays empty).

### Project site (`<username>.github.io/<repo>`)

If instead you host under a project repo, the assets live under a sub-path, so set the base path:

- In `.github/workflows/deploy.yml`, change the build step's env to `BASE_PATH: "/<repo-name>"`.
- Push to that repo's `main` and enable **Pages → Source = GitHub Actions**.
- Site goes live at `https://<username>.github.io/<repo-name>/`.

### Build the static site locally

```bash
npm run build          # outputs ./out (root site)
BASE_PATH="/my-repo" npm run build   # outputs ./out for a project sub-path
npx serve out          # preview the exported site
```

> This repository currently lives in a subfolder of another git repo. To deploy, push the **contents of the `learn-dp-800` folder** to the target Pages repo so `package.json` and `.github/` sit at that repo's root.

## Local database setup (for labs)

Labs are copy-paste SQL scripts you run against real engines. Spin them all up with Docker:

```bash
cd docker
docker compose up -d
docker compose ps        # wait until healthy
```

| Engine | Host | User | Password | Database/Service |
| --- | --- | --- | --- | --- |
| SQL Server 2025 | `localhost,1433` | `sa` | `Dp800_Strong!Pass` | `dp800` |
| PostgreSQL 17 | `localhost:5432` | `dp800` | `dp800pass` | `dp800` |
| MySQL 9 | `localhost:3306` | `root` | `dp800pass` | `dp800` |
| Oracle Free 23ai | `localhost:1521` | `dp800` | `dp800pass` | `FREEPDB1` |

PostgreSQL, MySQL, and Oracle auto-seed on first start. For SQL Server, load the lab schema once the container is healthy:

```bash
docker exec -it dp800-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Dp800_Strong!Pass' -C -i /seed/01-init.sql
```

Tear everything down with `docker compose down` (add `-v` to also delete data volumes). There's an in-app walkthrough at **/setup**.

> **Notes:** SQL Server 2025 and Oracle images are large — the first pull can take several minutes. Review Oracle's license terms for the Free edition before use. AI features (`VECTOR`, `AI_GENERATE_EMBEDDINGS`, `CREATE EXTERNAL MODEL`, `sp_invoke_external_rest_endpoint`, DiskANN) require a configured external model endpoint and, for some, SQL Server 2025 preview flags.

## Project structure

```
docker/                     # docker-compose + per-engine seed scripts
src/
  app/                      # Next.js App Router pages
    page.tsx                # dashboard
    learn/                  # curriculum browser + [slug] lesson viewer
    labs/                   # lab list + [id] lab viewer
    practice/               # quiz hub + spaced repetition
    exam/                   # exam list, [id] runner, [id]/results
    compare/ notes/ bookmarks/ setup/
  components/               # AppShell, Sidebar, LessonViewer, QuizRunner,
                            # ExamEngine, LabViewer, Comparison, Markdown, ...
  content/                  # typed content
    curriculum.ts           # domains + modules
    lessons/                # domain1/2/3 lesson data
    questions/              # question banks per domain + exam1
    labs.ts  exams.ts
  lib/                      # types, store, scoring, srs, streak, revision,
                            # progress, content aggregation + lookups
```

## Content model & sourcing

Every lesson, question, lab, and exam is a **typed data object** (`src/lib/types.ts`) — reusable models for domains, modules, lessons, comparisons, labs, questions, mock exams, progress, and revision recommendations.

- Each content block is tagged as **official**, **explanation**, **recommendation**, or **exam tip** and visually distinguished in the UI, so you always know what's official Microsoft guidance versus added context.
- Every lesson cites official sources with access dates. Cross-database facts are sourced from each engine's own documentation (PostgreSQL, MySQL, Oracle).
- **All questions are original**, written from the skills outline — no exam dumps. Preview-status features (e.g., `VECTOR_SEARCH`, DiskANN, float16 vectors) are labeled as preview.

## Testing

```bash
npm test
```

Covers quiz/exam scoring, spaced-repetition scheduling, streaks, the progress store, and **content integrity** (every referenced question/lesson/lab id resolves, each question is answerable with its own key, one flagship + one lab per domain, etc.).

## Accessibility & UX

- Keyboard-accessible with visible focus rings (Star Yellow), ⌘/Ctrl+K search, and ARIA labels on interactive controls.
- Responsive from mobile (drawer nav) to desktop (persistent curriculum sidebar).
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.

## Disclaimer

This is an unofficial, independent study resource. Microsoft, SQL Server, Azure, and DP-800 are trademarks of Microsoft. PostgreSQL, MySQL, and Oracle are trademarks of their respective owners.
