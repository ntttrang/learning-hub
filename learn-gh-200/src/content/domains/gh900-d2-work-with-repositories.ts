import type { Domain } from '../types';

/**
 * GH-900 domain 2 — Work with GitHub repositories (10–15%).
 *
 * The anatomy of a healthy repository: structure, the community key files,
 * templates and branches, how files get in, and the insight surfaces GitHub
 * paints on top of the data.
 */
export const domain: Domain = {
  id: 'gh900-d2',
  cert: 'gh900',
  number: 2,
  title: 'Work with GitHub repositories',
  weightMin: 10,
  weightMax: 15,
  summary:
    'Repository structure and key files, templates and branches, managing files, insights and metrics, and maintenance best practices.',
  subSkills: [
    {
      id: 'd2-repo-structure-key-files',
      title: 'Repository structure and key files',
      docIds: ['about-readmes', 'licensing-a-repository', 'contributing-guidelines'],
    },
    {
      id: 'd2-templates-and-branches',
      title: 'Templates and branches',
      docIds: ['creating-a-repository', 'template-repositories'],
    },
    {
      id: 'd2-managing-files',
      title: 'Adding and managing files',
      docIds: ['creating-a-repository', 'gh-docs-repositories'],
    },
    {
      id: 'd2-insights-metrics',
      title: 'Insights, stars, and dependency data',
      docIds: ['about-repository-graphs'],
    },
    {
      id: 'd2-maintenance',
      title: 'Maintenance best practices',
      docIds: ['community-health-files', 'add-security-policy'],
    },
  ],
  lesson: {
    id: 'lesson-gh900-d2',
    domainId: 'gh900-d2',
    title: 'Working with repositories',
    minutes: 11,
    blocks: [
      { kind: 'h3', text: 'The key files a healthy repo carries' },
      {
        kind: 'p',
        text: 'Beyond the code itself, a handful of well-known files tell people — and GitHub — how to work with a repository. GitHub renders all of them automatically, and several change how the site behaves:',
      },
      {
        kind: 'table',
        headers: ['File', 'What it does'],
        rows: [
          ['`README.md`', 'The front page — what the project is, how to start; [about READMEs](about-readmes)'],
          ['`LICENSE`', 'The legal terms for reuse; without it, "all rights reserved" is the default; see [licensing a repository](licensing-a-repository)'],
          ['`CONTRIBUTING.md`', 'How to propose changes — setup, style, PR expectations; [setting guidelines](contributing-guidelines)'],
          ['`CODEOWNERS`', 'Routes review: files or paths map to the people auto-requested; [about code owners](about-code-owners)'],
          ['`SECURITY.md`', 'How to report a vulnerability responsibly; [add a security policy](add-security-policy)'],
        ],
      },
      {
        kind: 'tip',
        text: 'A `README.md` at every directory level renders when you browse that directory — a nested README can document a subproject without touching the root one.',
      },
      { kind: 'h3', text: 'Creating repositories — and creating them from templates' },
      {
        kind: 'p',
        text: '[Creating a repository](creating-a-repository) takes seconds: name, visibility, and optional starter bits (README, `.gitignore`, license). Mark any well-shaped repo as a **template repository** and new repos can be generated from it — structure, key files, and all — instead of copied piecemeal. On the branch side, the default branch (`main` by convention) anchors the repo; repositories can also be created empty and seeded later, and you can rename the default branch without breaking pull requests.',
      },
      { kind: 'h3', text: 'Getting files in' },
      {
        kind: 'list',
        items: [
          'In the browser: create or edit a file and commit straight to a branch — GitHub proposes a branch for you when editing `main` directly.',
          'From your machine: clone, edit, commit, push.',
          'Via drag-and-drop upload in the file view — folders included.',
          'By import: GitHub can import from another source-control host, history and all.',
        ],
      },
      {
        kind: 'p',
        text: 'Whatever the path, the result is the same: a commit on a branch. The [repositories documentation](gh-docs-repositories) covers the settings surface — visibility, features, branch rules — that we will return to in domain 6.',
      },
      { kind: 'h3', text: 'Stars, insights, and the pulse of a repo' },
      {
        kind: 'p',
        text: 'A **star** is a bookmark plus applause — it signals interest, nothing more. The **Insights** tab is where GitHub turns repo activity into pictures: [repository graphs](about-repository-graphs) cover commits, contributors, traffic, and more. Know which chart answers which question — the pulse/views charts show activity, the dependency graph and dependents show how code connects.',
      },
      {
        kind: 'p',
        text: 'Feature previews live under personal or org settings and switch on new GitHub capabilities early; metrics dashboards (org-level) roll repository activity up for maintainers. The exam expects you to match the surface to the question: stars for interest, insights for activity, metrics dashboards for organization-wide trends.',
      },
      { kind: 'h3', text: 'Maintenance that scales' },
      {
        kind: 'list',
        items: [
          'Keep the key files current — a stale README misleads more than a missing one.',
          'Use [community health files](community-health-files) in a `.github` repository to default ISSUE templates, PR templates, and CONTRIBUTING for every repo you own.',
          'Adopt a `SECURITY.md` early — [reporting paths](add-security-policy) belong in every serious project.',
          'Prune branches and rely on tags/releases for anything people should pin to.',
        ],
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'README, LICENSE, CONTRIBUTING, CODEOWNERS, SECURITY.md — know the job each does.',
          'Template repositories stamp out well-shaped new repos.',
          'Files land as commits on branches, however they arrive.',
          'Stars = interest; Insights = a repo’s activity in graphs; metrics dashboards = org-wide trends.',
          'A `.github` repo holds default community health files for all your repositories.',
        ],
      },
    ],
  },
};
