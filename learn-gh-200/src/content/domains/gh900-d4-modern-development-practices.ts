import type { Domain } from '../types';

/**
 * GH-900 domain 4 — Apply modern development practices (10–15%).
 *
 * The "why is GitHub more than hosting" domain: Actions as the automation
 * layer, Copilot across plans and agent surfaces, Codespaces and dev
 * containers for instant environments, and github.dev for light edits.
 */
export const domain: Domain = {
  id: 'gh900-d4',
  cert: 'gh900',
  number: 4,
  title: 'Apply modern development practices',
  weightMin: 10,
  weightMax: 15,
  summary:
    'GitHub Actions purpose and capabilities, Copilot plans and agents, Codespaces and dev containers, and the github.dev editor.',
  subSkills: [
    {
      id: 'd4-actions-purpose',
      title: 'GitHub Actions purpose and capabilities',
      docIds: ['gh-docs-actions'],
    },
    {
      id: 'd4-copilot',
      title: 'Copilot: plans, agents, Agent Mode',
      docIds: ['copilot-get-started', 'copilot-plans', 'copilot-cloud-agent'],
    },
    {
      id: 'd4-codespaces-devcontainers',
      title: 'Codespaces and dev containers',
      docIds: ['what-are-codespaces', 'dev-containers'],
    },
    {
      id: 'd4-githubdev',
      title: 'The github.dev editor',
      docIds: ['githubdev-editor'],
    },
  ],
  lesson: {
    id: 'lesson-gh900-d4',
    domainId: 'gh900-d4',
    title: 'Modern development practices',
    minutes: 11,
    blocks: [
      { kind: 'h3', text: 'Actions: your repository doing work for you' },
      {
        kind: 'p',
        text: '[GitHub Actions](gh-docs-actions) is the automation layer of GitHub: when something happens — a push, a pull request, a schedule, a new release — a **workflow** runs your steps on GitHub-hosted machines. CI tests, builds, deployments, and chores like issue triage all become files in `.github/workflows/`. GH-900 wants the shape, not the YAML: event → workflow → jobs → steps. (The deep dive is GH-200 — this whole site is our running example.)',
      },
      { kind: 'h3', text: 'Copilot — and which Copilot you have' },
      {
        kind: 'p',
        text: 'GitHub Copilot is the AI pair programmer across the editor, the web, and the command line. What it can do depends on the plan: **Individual**, **Business**, and **Enterprise** differ in access, policy control, and which features ship — [Copilot plans](copilot-plans) has the current matrix, and organizations manage availability through policy. Expect a question mapping features to tiers (for example: organization-wide policy controls belong to Business and above).',
      },
      {
        kind: 'list',
        items: [
          'Inline completions and chat in the editor — every plan.',
          '**Agent Mode** in the IDE — Copilot plans multi-file work, runs terminal commands, and iterates; see [the Agent Mode module](copilot-agent-mode).',
          'The **cloud agent** — assign it an issue and it works on a branch in its own workspace, then opens a pull request; [about the cloud agent](copilot-cloud-agent).',
          'Multi-model choice — different plans expose different model menus.',
        ],
      },
      {
        kind: 'tip',
        text: 'Keep the two agent surfaces apart: Agent Mode lives in your IDE and acts on your local checkout; the cloud agent lives on GitHub and opens a PR you review like any other contributor’s.',
      },
      { kind: 'h3', text: 'Codespaces: the environment is code' },
      {
        kind: 'p',
        text: 'A **codespace** is a full dev environment — editor, terminal, tools — running in the cloud, opened from any repository in seconds. What makes it reproducible is the **dev container**: a `.devcontainer/devcontainer.json` (plus Dockerfile or image reference) that pins the tools, extensions, and settings. Commit the [dev container](dev-containers) and "works on my machine" stops being a sentence anyone says. [What are Codespaces](what-are-codespaces) is the orientation page; your personal billing and timeout settings live in your account.',
      },
      { kind: 'h3', text: 'github.dev: the light-edit middle ground' },
      {
        kind: 'p',
        text: 'Press `.` (period) on any repository or file on GitHub — or swap `github.com` for `github.dev` — and the repo opens in a browser-based VS Code, fully connected to your GitHub identity. It is for quick edits and PRs from a browser, no environment attached; want to run the code and that is the codespace’s job. [The github.dev editor](githubdev-editor) covers exactly this distinction, and so does the exam.',
      },
      {
        kind: 'table',
        headers: ['Surface', 'Runs where', 'Reach for it when'],
        rows: [
          ['github.dev', 'In the browser', 'Quick edits and PRs without installing anything'],
          ['Codespace', 'Cloud container', 'You need to build, run, and debug the project'],
          ['Dev container', 'Definition file', 'You want the environment versioned with the repo'],
          ['Copilot cloud agent', 'GitHub-hosted workspace', 'You want to delegate a well-scoped issue to Copilot'],
        ],
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'Actions = event-driven workflows stored in `.github/workflows/`.',
          'Copilot tiers gate features and policy: Individual, Business, Enterprise.',
          'Agent Mode = IDE, your checkout; cloud agent = GitHub workspace, opens a PR.',
          'Codespaces run cloud environments defined by dev containers.',
          'github.dev (`.` on a repo) is editing, not executing.',
        ],
      },
    ],
  },
};
