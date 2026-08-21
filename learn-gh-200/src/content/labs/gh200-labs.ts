import type { Lab } from '../types';

/**
 * The six GH-200 labs. Labs 1–5 run in the learner's own repository and
 * account; lab 6 is the living lab — read-and-observe on this site's own
 * deploy pipeline. Step prose uses the inline constructs (`code`,
 * **bold**, and [docId links](workflow-syntax)) like every other content
 * surface.
 */
export const gh200Labs: Lab[] = [
  {
    id: 'gh200-lab-01',
    domainId: 'gh200-d1',
    title: 'Author a dispatch-driven matrix workflow',
    minutes: 30,
    summary:
      'Build one workflow with typed workflow_dispatch inputs, a node matrix, cache and artifact steps, and a dependent job — then run it from the Actions tab.',
    steps: [
      'Create a public repository `actions-lab` (or reuse one) and add `.github/workflows/build-matrix.yml` — keep the [workflow syntax](workflow-syntax) reference open while you type.',
      'Define the trigger: `on: workflow_dispatch` with a `choice` input `environment` (options `staging`/`production`, default `staging`) and a `boolean` input `dry-run` defaulting to `false`.',
      'Write job `build` on `ubuntu-latest` with a `matrix` over `node: [20, 22]`, using `actions/setup-node@v4` with `cache: npm` and `node-version: ${{ matrix.node }}`.',
      'Add steps that install, test, and upload the output with `actions/upload-artifact@v4` (set `retention-days: 7`).',
      'Add job `report` with `needs: build` that downloads the artifact with `actions/download-artifact@v4` and lists what arrived.',
      'Run the workflow from the **Actions** tab, choosing `production` and leaving `dry-run` off; watch the run page.',
      'Run it again and inspect the **Set up Node** step for the cache restore message — the second run should not re-download dependencies.',
    ],
    outcomes: [
      'One workflow file with dispatch inputs, matrix, cache, artifact upload, and a `needs`-dependent job.',
      'A run page showing two `build` jobs named by their matrix axis value.',
      'An artifact listed on the run with a 7-day retention note, and a cache hit on the second run.',
    ],
    checks: [
      'Open the run and confirm the `workflow_dispatch` inputs you chose are recorded on the run page.',
      'Confirm the job names read `build (20)` and `build (22)` — the matrix axes in parentheses.',
      'Download the artifact from the run page and confirm `report` logged its contents.',
    ],
  },
  {
    id: 'gh200-lab-02',
    domainId: 'gh200-d1',
    title: 'Pass data between jobs: outputs, env files, summary',
    minutes: 25,
    summary:
      'Move a value step-to-step with GITHUB_OUTPUT/GITHUB_ENV, promote it to a job output, consume it downstream, and render it in a job summary.',
    steps: [
      'In `actions-lab`, add `.github/workflows/data-flow.yml` triggered by `workflow_dispatch` — the mechanics come from [workflow commands](workflow-commands) and [environment files](use-variables).',
      'Job `setup` step: compute `version=$(git describe --tags 2>/dev/null || echo 0.0.0)` and write `echo "version=$version" >> "$GITHUB_OUTPUT"`; also write a `built_at` value to `$GITHUB_ENV`.',
      'Promote it: give `setup` an `outputs:` block mapping `version: ${{ steps.meta.outputs.version }}`.',
      'Job `consume` with `needs: setup`: echo both `needs.setup.outputs.version` and the `$built_at` environment variable, then append a Markdown line about them to `$GITHUB_STEP_SUMMARY`.',
      'Run the workflow and read the **Summary** tab of the run.',
      'Break it on purpose: change the downstream reference to `needs.setup.outputs.verson` (typo), rerun, and observe the silent empty string — then revert.',
    ],
    outcomes: [
      'The downstream job prints the version and timestamp produced upstream.',
      'The run page renders your Markdown from `$GITHUB_STEP_SUMMARY`.',
      'You have seen a mistyped output name resolve to empty rather than fail — a diagnosis you will recognize forever.',
    ],
    checks: [
      'Confirm the summary tab shows your Markdown exactly as appended.',
      'Confirm `consume` did **not** start until `setup` succeeded (the `needs` edge on the run graph).',
      'grep the `consume` log for the version string and confirm it matches what `setup` computed.',
    ],
  },
  {
    id: 'gh200-lab-03',
    domainId: 'gh200-d2',
    title: 'Break it, read it, rerun one job, download the evidence',
    minutes: 30,
    summary:
      'Fail a matrix job deliberately, diagnose it from annotations and logs, rerun only the failed combination, and pull logs via UI and API.',
    steps: [
      'Add `.github/workflows/break-matrix.yml`: `workflow_dispatch`, a `2×2` matrix (`os: [ubuntu-latest]`, `node: [20, 22]`) with `fail-fast: false`, and a step that exits 1 only when the node axis is 20 — pass the axis through `env:` and compare inside the shell rather than interpolating `${{ }}` into `run:`.',
      'Run it and let it go red; do not fix anything yet.',
      'Diagnose in exam order: read the **Annotations** panel, then the failed step’s log tail, then compare with the green sibling job — [troubleshooting workflows](troubleshoot-workflows) lists the classic signatures.',
      'From the run page, choose **Re-run failed jobs** and confirm only the `node=20` job reran while the green one was left alone.',
      'Download **all logs** as a zip from the run page’s gear menu; open it and find the per-job folders.',
      'Fetch the same evidence programmatically: `gh api repos/:owner/:repo/actions/runs/RUN_ID/logs > logs.zip` and list artifacts with the [Actions REST API](rest-actions).',
    ],
    outcomes: [
      'A red run you diagnosed from annotations and logs before touching the YAML.',
      'A rerun that repeated only the failed matrix combination.',
      'The run’s log zip on disk twice — once from the UI, once from `gh api`.',
    ],
    checks: [
      'Point at the annotation that names the failing job and the `exit code 1` line in its log.',
      'Confirm the rerun attempt appears on the same run record, not as a brand-new run.',
      'Confirm your artifact listing from the API matches what the run page shows.',
    ],
  },
  {
    id: 'gh200-lab-04',
    domainId: 'gh200-d3',
    title: 'Package a composite action and tag a release',
    minutes: 30,
    summary:
      'Write an action.yml for a composite action, consume it locally from a workflow, then tag and release it like a maintained action.',
    steps: [
      'In `actions-lab`, create `.github/actions/greet/action.yml` declaring `name`, `description`, an input `who` (required) and an output `message` — the shape is [metadata syntax](metadata-syntax).',
      'Give it `runs: using: composite` with one `shell: bash` step that echoes the greeting and writes `message=…` to `$GITHUB_OUTPUT`.',
      'Consume it locally: a `workflow_dispatch` workflow with `uses: ./.github/actions/greet`, `with: who: Actions`, and a follow-up step that echoes `steps.greet.outputs.message`.',
      'Run the workflow and confirm the greeting in the logs — the pattern from [creating a composite action](create-composite-action).',
      'Tag and release: create tag `v1` and a GitHub Release for it, the scheme [releasing and maintaining actions](release-actions) describes.',
      'Edit the action (change the greeting’s punctuation), tag `v1.1`, and move the `v1` tag to the same commit so `@v1` consumers get the fix.',
    ],
    outcomes: [
      'A composite action with valid metadata, inputs, and outputs, exercised by a real workflow.',
      'A release pipeline of tags `v1` and `v1.1` with `v1` pointing at the newest.',
    ],
    checks: [
      'Confirm the consuming workflow’s log contains the output value produced inside the action.',
      'Confirm both tags exist and `git rev-parse v1` equals `v1.1` after the move.',
      'Check the Releases page shows the release notes you wrote for `v1.1`.',
    ],
  },
  {
    id: 'gh200-lab-05',
    domainId: 'gh200-d4',
    title: 'Scope secrets to an environment and gate the deploy',
    minutes: 35,
    summary:
      'Create an environment with a scoped secret and an approval rule, run a least-privilege job against it, and see OIDC token minting in the logs.',
    steps: [
      'In repo **Settings → Environments**, create `staging` — the surface documented under [using environments](manage-environments).',
      'Add an environment secret `STAGING_TOKEN` with any dummy value; notice it sits beside (and shadows) repo-level names.',
      'On the environment, add a protection rule: **Required reviewers** with yourself selected.',
      'Add `.github/workflows/staging-deploy.yml`: a `workflow_dispatch` job with `environment: staging`, `permissions: { contents: read, id-token: write }`, one step echoing the secret, and one step running `echo "$ACTIONS_ID_TOKEN_REQUEST_URL"` so the OIDC endpoint is visible without any cloud account.',
      'Run it: the job pauses **Waiting for a reviewer** — approve your own run from the run page.',
      'Read the logs: the secret prints as `***` (masked), and the OIDC request URL shows the token-minting endpoint your cloud provider would talk to — the mechanism behind [OpenID Connect](openid-connect).',
      'Needs a free org — create one for the lab: in the org’s **Settings → Secrets and variables → Actions**, add an org-level secret, then confirm a repo workflow can read it (org scope is the shared fallback in the [secrets](use-secrets) model).',
    ],
    outcomes: [
      'A job that could not start until a human approved it.',
      'A secret visible only to jobs targeting that environment, masked in logs.',
      'Evidence that the runner can mint an OIDC token when `id-token: write` is granted.',
    ],
    checks: [
      'Confirm the run page recorded the approval wait before the job started.',
      'Confirm the workflow’s `permissions` block contains only `contents: read` and `id-token: write` — nothing writable beyond what the job uses.',
      'Rename the environment secret and rerun without updating the workflow; observe the empty-string symptom you met in lab 02.',
    ],
  },
  {
    id: 'gh200-lab-06',
    domainId: 'gh200-d5',
    title: 'Living lab: dissect this site’s deploy pipeline',
    minutes: 25,
    summary:
      'Read and observe — open the annotated workflow that ships this very site, map every block to a GH-200 sub-skill, and watch a real run of it.',
    steps: [
      'Open [`.github/workflows/deploy.yml`](repo-deploy-workflow) in this repository — the file you are studying deploys the page you are reading.',
      'Read the `on:` block: a push to `main` plus `workflow_dispatch`. Say which event starts a deploy when a phase PR merges, and what the manual trigger is for — domain 1’s trigger skills.',
      'Read `permissions:`: `contents: read` (clone), `pages: write` (publish), `id-token: write` (mint the OIDC token for Pages) — map each grant to the job that needs it, domain 5’s least-privilege lesson.',
      'Read `concurrency:` — group `pages` with `cancel-in-progress: false`: say why a deploy queues instead of cancelling mid-flight.',
      'Walk the `build` job steps: `checkout@v4`, `setup-node@v4` with `cache: npm`, `npm ci`, `npm test`, `npm run build`, `configure-pages@v5`, `upload-pages-artifact@v3` with `path: dist` — name the caching, gating, and artifact sub-skills each demonstrates.',
      'Walk the `deploy` job: `needs: build`, `environment: github-pages` with a `url` sourced from `steps.deployment.outputs.page_url` — the dependency and environment patterns from domains 1 and 5.',
      'Open this repository’s [Actions runs](repo-actions-runs), pick the newest deploy run, and correlate each logged step to the block you just read; find where a red test suite would have stopped the pipeline.',
      'Judge the pinning: actions are referenced by tag (`@v4`), not SHA. Decide what SHA-pinning would improve here, and what it would cost — domain 5’s supply-chain question.',
    ],
    outcomes: [
      'You can name every top-level key in `deploy.yml` and the job that consumes it.',
      'You have watched a real run of a pipeline that deployed real software.',
      'You can defend the file’s security choices (least-privilege grants, OIDC, concurrency) in exam language.',
    ],
    checks: [
      'For each of `permissions`, `concurrency`, `needs`, and `environment`, write one sentence naming the GH-200 sub-skill it exercises.',
      'In the live run, find the logged step that corresponds to `upload-pages-artifact` and the artifact it produced.',
      'Confirm the run history shows deploys queued (not cancelled) when two phases merged close together — the `concurrency` behavior you predicted.',
    ],
  },
];
