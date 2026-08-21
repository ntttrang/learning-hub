import type { Domain } from '../types';

/**
 * GH-900 domain 1 — Understand Git and GitHub basics (25–30%).
 *
 * The heaviest domain on the exam: what version control is for, how Git and
 * GitHub divide the work, and the everyday vocabulary — repositories,
 * commits, branches, GitHub Flow — plus the surfaces learners meet first:
 * Markdown, Desktop, and Mobile.
 */
export const domain: Domain = {
  id: 'gh900-d1',
  cert: 'gh900',
  number: 1,
  title: 'Understand Git and GitHub basics',
  weightMin: 25,
  weightMax: 30,
  summary:
    'Version control purpose, Git versus GitHub, repositories and commits, GitHub Flow, Markdown, and the desktop and mobile clients.',
  subSkills: [
    {
      id: 'd1-version-control',
      title: 'Version control purpose and benefits',
      docIds: ['about-git'],
    },
    {
      id: 'd1-git-vs-github',
      title: 'Git and GitHub — what each one owns',
      docIds: ['about-git', 'hello-world'],
    },
    {
      id: 'd1-repos-commits-branches',
      title: 'Repositories, commits, and branches',
      docIds: ['hello-world', 'github-flow'],
    },
    {
      id: 'd1-account-types',
      title: 'Accounts, organizations, and enterprise options',
      docIds: ['types-of-github-accounts'],
    },
    {
      id: 'd1-github-flow',
      title: 'GitHub Flow',
      docIds: ['github-flow'],
    },
    {
      id: 'd1-markdown',
      title: 'Markdown in issues and pull requests',
      docIds: ['markdown-formatting'],
    },
    {
      id: 'd1-desktop-mobile',
      title: 'GitHub Desktop and GitHub Mobile',
      docIds: ['github-desktop', 'github-mobile'],
    },
  ],
  lesson: {
    id: 'lesson-gh900-d1',
    domainId: 'gh900-d1',
    title: 'Git and GitHub basics',
    minutes: 12,
    blocks: [
      { kind: 'h3', text: 'Why we keep history at all' },
      {
        kind: 'p',
        text: 'Every project without version control eventually meets the same wall: `final.ppt`, `final-v2.ppt`, `final-REALLY-final.ppt`. Version control replaces that guessing game with recorded history — every change, who made it, when, and why. [About Git](about-git) frames the benefits the way the exam wants them: revert to any previous state, compare versions, and blend many people’s work without overwriting each other. Git is **distributed** — every collaborator holds the full history locally, so you can commit on a plane and sync when you land.',
      },
      { kind: 'h3', text: 'Git versus GitHub — a division of labor' },
      {
        kind: 'p',
        text: 'Git runs on your machine and does the local work: staging changes, committing them, moving between branches. GitHub is the **hosting and collaboration layer** built around Git — pull requests, issues, review, Actions, and permissions all live on GitHub, not in Git itself. A classic exam move is to hand you a feature and ask where it lives: `git commit` is Git; a pull request is GitHub.',
      },
      {
        kind: 'table',
        headers: ['Concept', 'Where it lives', 'What it is'],
        rows: [
          ['Repository', 'Both', 'A project folder with tracked history — on GitHub it also gets issues, insights, and settings'],
          ['Commit', 'Git', 'A saved snapshot of the staged files, with a message explaining why'],
          ['Branch', 'Git', 'A movable label on a line of commits — how work happens in parallel'],
          ['Pull request', 'GitHub', 'A proposal to merge one branch into another, with review and discussion'],
        ],
      },
      {
        kind: 'p',
        text: 'One more layer of "where does it live": your **personal account** is your identity and owns your contributions; an **organization** is a shared owner for people and repositories with teams and roles; an **enterprise** adds centralized billing, policy, and security across organizations. [Types of GitHub accounts](types-of-github-accounts) shows up on the exam almost verbatim.',
      },
      { kind: 'h3', text: 'The daily loop, and GitHub Flow around it' },
      {
        kind: 'p',
        text: 'A **repository** holds the project and its history. Work flows through commits onto branches: the default branch (conventionally `main`) is the source of truth, and short-lived branches carry each change. The [Hello World](hello-world) guide walks the whole loop in the browser — worth doing once so the vocabulary sticks:',
      },
      {
        kind: 'code',
        language: 'bash',
        code: 'git switch -c feature/intro         # new branch for the change\ngit add README.md                   # stage the file\ngit commit -m "Explain the project" # snapshot with a message\ngit push -u origin feature/intro    # publish the branch to GitHub',
      },
      {
        kind: 'p',
        text: 'Around that loop sits [GitHub flow](github-flow) — deliberately lightweight: one always-deployable default branch plus topic branches. Most "what order do we do things" questions resolve to it:',
      },
      {
        kind: 'list',
        items: [
          'Create a branch for your change — branches are free, so one branch per idea.',
          'Commit early and often; each commit is a save point with a message.',
          'Open a pull request early — start the conversation before the code is perfect.',
          'Review together, then merge into the default branch.',
          'Delete the merged branch — the history keeps it safe.',
        ],
      },
      { kind: 'h3', text: 'Everyday surfaces: Markdown, Desktop, Mobile' },
      {
        kind: 'p',
        text: 'Issues, pull requests, discussions, and files like `README.md` all speak [Markdown](markdown-formatting): `# headings`, `**bold**`, `- lists`, `` `inline code` ``, and `[links](url)`. When you are not in a browser, [GitHub Desktop](github-desktop) gives you visual Git — branches, diffs, pull requests — and [GitHub Mobile](github-mobile) puts review and triage in your pocket, though neither is where you write serious code.',
      },
      {
        kind: 'tip',
        text: 'Task lists (`- [ ]`) inside an issue body update its progress bar — a favorite exam detail because it is specific and visual.',
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'Git = local version control; GitHub = hosting and collaboration on top of it.',
          'A commit is a snapshot with a message; a branch is a line of work; a pull request is a GitHub conversation about merging.',
          'GitHub Flow: branch, commit, pull request, review, merge, delete.',
          'Personal accounts for identity, organizations for shared ownership, enterprises for centralized management.',
          'Markdown everywhere: issues, PRs, and `README.md`.',
        ],
      },
    ],
  },
};
