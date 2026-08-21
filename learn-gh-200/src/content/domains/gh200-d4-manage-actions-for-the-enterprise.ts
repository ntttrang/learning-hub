import type { Domain } from '../types';

/**
 * GH-200 domain 4 — Manage GitHub Actions for the enterprise (20–25%).
 *
 * The administrator's domain: who may run what, on which runners, through
 * which networks — organization use policies, hosted versus self-hosted
 * runners, runner groups, IP allow lists, preinstalled software, and the
 * three-level secrets/variables model with its REST management surface.
 */
export const domain: Domain = {
  id: 'gh200-d4',
  cert: 'gh200',
  number: 4,
  title: 'Manage GitHub Actions for the enterprise',
  weightMin: 20,
  weightMax: 25,
  summary:
    'Org use policies and governance, GitHub-hosted vs self-hosted runners, runner groups, IP allow lists, preinstalled software, and secrets/variables scoping with REST management.',
  subSkills: [
    {
      id: 'd4-govern-components',
      title: 'Govern reusable components, templates, and their access',
      docIds: ['reuse-workflows', 'share-with-enterprise'],
    },
    {
      id: 'd4-org-policies',
      title: 'Configure organizational use policies (allow/deny lists, approvals)',
      docIds: ['org-actions-policy'],
    },
    {
      id: 'd4-runner-choice',
      title: 'GitHub-hosted vs self-hosted runners',
      docIds: ['github-hosted-runners', 'self-hosted-runners'],
    },
    {
      id: 'd4-networking',
      title: 'IP allow lists and networking settings',
      docIds: ['ip-allow-lists'],
    },
    {
      id: 'd4-runner-groups',
      title: 'Manage runner groups and troubleshoot runners',
      docIds: ['runner-groups', 'self-hosted-runners'],
    },
    {
      id: 'd4-preinstalled',
      title: 'Preinstalled software, toolcache, and runtime installs',
      docIds: ['github-hosted-runners', 'runner-images'],
    },
    {
      id: 'd4-secrets-variables',
      title: 'Scope and manage secrets and variables (org/repo/environment)',
      docIds: ['use-secrets', 'use-variables', 'rest-actions'],
    },
  ],
  lesson: {
    id: 'lesson-gh200-d4',
    domainId: 'gh200-d4',
    title: 'Manage GitHub Actions for the enterprise',
    minutes: 20,
    blocks: [
      { kind: 'h3', text: 'The enterprise picture' },
      {
        kind: 'p',
        text: 'Above the repository sit two layers of control. An **organization** owns policies (which actions are allowed), runners, and shared automation. An **enterprise** adds cross-org governance: IP allow lists, policy enforcement over every org, and shared workflow/action publishing through the enterprise `.github` repository — the pattern [share with your enterprise](share-with-enterprise) documents. Exam questions usually hand you a requirement ("compliance must approve every third-party action") and ask which layer answers it.',
      },
      { kind: 'h3', text: 'Hosted versus self-hosted runners' },
      {
        kind: 'p',
        text: '[GitHub-hosted runners](github-hosted-runners) are ephemeral VMs GitHub patches and throws away — zero maintenance, per-minute billing, and a fresh machine every job. [Self-hosted runners](self-hosted-runners) are machines you register: your network, your toolchain, your cost model, and your patching duty — and they persist between jobs unless you configure ephemeral mode. The security rule the exam tests: **never combine public repositories with self-hosted runners** — a fork PR can execute arbitrary code on your hardware.',
      },
      {
        kind: 'table',
        headers: ['Dimension', 'GitHub-hosted', 'Self-hosted'],
        rows: [
          ['Maintenance', 'None — images patched by GitHub', 'You patch the OS and runner'],
          ['Network position', 'Public egress from shared IP ranges', 'Inside your network; reaches private resources'],
          ['Isolation', 'Fresh VM per job', 'Persistent unless ephemeral mode'],
          ['Cost', 'Per-minute (free quota first)', 'Your hardware and operations'],
        ],
      },
      { kind: 'h3', text: 'Runner groups' },
      {
        kind: 'p',
        text: '[Runner groups](runner-groups) are the access boundary for self-hosted capacity: an org (or enterprise) groups runners and grants the group to selected repositories and teams — a payments-runner group visible only to the payments repos. Jobs target runners by label: `runs-on: [self-hosted, linux, x64]` matches any registered runner whose labels fit, and a group’s membership decides whether that match is allowed. Troubleshooting a stuck self-hosted job usually starts with labels and group access: "queued forever" means no eligible runner could pick the job up.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'jobs:\n  deploy:\n    runs-on: [self-hosted, linux, payments]   # label match within an allowed group\n    steps:\n      - run: ./deploy-internal.sh',
      },
      { kind: 'h3', text: 'Networking and IP allow lists' },
      {
        kind: 'p',
        text: 'When an organization or enterprise [restricts traffic with an IP allow list](ip-allow-lists), two flows must keep working: the runner phoning home to GitHub, and API calls from automation. Self-hosted runners need the runner machine’s own IP added to the allow list (or the runner sits inside the allowed network). GitHub-hosted runners arrive from large, changing IP ranges — you cannot pin them individually; the allow list settings provide the option to permit GitHub Actions traffic instead of enumerating those ranges.',
      },
      { kind: 'h3', text: 'What is already on the runner' },
      {
        kind: 'p',
        text: 'Hosted images ship with a large preinstalled stack — languages, clouds CLIs, browsers — versioned per image and listed in the [runner images](runner-images) repository’s readme; when an image deprecates an OS or tool version, workflows pinning the old label break, which is why matrix pins should be deliberate. Additional tooling installs at runtime with `setup-*` actions, package managers, or a container image; pre-cached tools live in the **toolcache** directory for fast `setup-*` hits.',
      },
      {
        kind: 'code',
        language: 'bash',
        code: 'ls /opt/hostedtoolcache   # the toolcache: pre-cached tool versions\n# setup-* actions prefer a toolcache hit over a download',
      },
      { kind: 'h3', text: 'Governance: what may run' },
      {
        kind: 'p',
        text: 'The [organization policy page](org-actions-policy) is the master switch: allow all actions, allow only local actions, or **allow a selected list** — by marketplace verification ("actions created by GitHub" or verified creators) and by explicitly named actions or organizations. Policies cascade: the enterprise can lock what orgs may permit, and the stricter setting wins where they overlap. Combine that with domain 1’s reuse machinery and you get the full governance story the exam describes: centrally [reusable workflows](reuse-workflows) published to selected repos, plus a policy wall around everything else.',
      },
      {
        kind: 'table',
        headers: ['Policy lever', 'Effect'],
        rows: [
          ['Allow all actions', 'Any `uses:` resolves; least admin control'],
          ['Allow local actions only', 'Only actions and workflows in the org'],
          ['Allow specified actions', 'Explicit allowlist + verification toggles'],
          ['Enterprise policy', 'Caps what each org beneath it may allow'],
        ],
      },
      { kind: 'h3', text: 'Secrets and variables at three levels' },
      {
        kind: 'p',
        text: '[Secrets](use-secrets) and [variables](use-variables) live at **organization**, **repository**, and **environment** scope. A job sees secrets by name; when the same name exists at several levels, the most specific one wins — an environment secret for a job that declares `environment:`, otherwise the repository’s, and org-level as the shared fallback. Environments are also the only level that can carry protection rules (domain 5). Everything is scriptable through the [Actions REST API](rest-actions): create and rotate org or repo secrets and variables without visiting the UI — the exam’s "programmatically manage" bullet.',
      },
      {
        kind: 'code',
        language: 'bash',
        code: '# manage secrets and variables without the UI\ngh secret set ORG_DEPLOY_KEY --org my-org --app actions\ngh secret set STAGING_TOKEN --env staging\ngh variable set BUILD_CHANNEL --body "nightly"\ngh api orgs/my-org/actions/secrets --jq ".secrets[].name"',
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'Org owns policies, runners, shared automation; enterprise adds IP allow lists and cross-org enforcement; stricter policy wins.',
          'Hosted = ephemeral, patched, billed; self-hosted = your network, persistent unless ephemeral; never self-hosted on public repos.',
          'Runner groups scope self-hosted access to selected repos/teams; labels route jobs; "queued forever" = no eligible runner.',
          'Allow lists must admit the runner’s traffic; hosted runners need the Actions-traffic option, not enumerated IPs.',
          'Preinstalled stack is listed in runner-images; extra tooling installs at runtime; toolcache speeds setup-* actions.',
          'Secrets/variables exist at org/repo/environment scope; the narrowest scope wins; REST manages them all.',
        ],
      },
    ],
  },
};
