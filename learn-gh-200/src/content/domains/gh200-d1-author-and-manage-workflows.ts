import type { Domain } from '../types';

/**
 * GH-200 domain 1 — Author and manage workflows (20–25%).
 *
 * The heart of the exam: everything a workflow file can express. The lesson
 * walks the file top to bottom — triggers, inputs, jobs and their
 * dependencies, matrix expansion, service containers, contexts and
 * expressions — then how data moves between jobs and out to the run summary.
 */
export const domain: Domain = {
  id: 'gh200-d1',
  cert: 'gh200',
  number: 1,
  title: 'Author and manage workflows',
  weightMin: 20,
  weightMax: 25,
  summary:
    'Workflow triggers and inputs, jobs/steps/dependencies, matrix strategy, service containers, contexts and expressions, caching/artifacts, and job summaries.',
  subSkills: [
    {
      id: 'd1-triggers',
      title: 'Configure scheduled, manual, webhook, and repository event triggers',
      docIds: ['workflow-events', 'workflow-syntax'],
    },
    {
      id: 'd1-dispatch-call-inputs',
      title: 'workflow_dispatch inputs and workflow_call inputs/secrets mapping',
      docIds: ['workflow-syntax', 'reuse-workflows'],
    },
    {
      id: 'd1-jobs-steps',
      title: 'Jobs, steps, conditionals, and job dependencies',
      docIds: ['workflow-syntax'],
    },
    {
      id: 'd1-commands-env',
      title: 'Workflow commands and environment variables',
      docIds: ['workflow-commands', 'use-variables'],
    },
    {
      id: 'd1-service-containers',
      title: 'Service containers: ports, health checks, container options',
      docIds: ['service-containers'],
    },
    {
      id: 'd1-matrix',
      title: 'Matrix strategy: include, exclude, fail-fast, max-parallel',
      docIds: ['workflow-syntax'],
    },
    {
      id: 'd1-yaml-anchors',
      title: 'YAML anchors and aliases for reuse within one file',
      docIds: ['reuse-config'],
    },
    {
      id: 'd1-contexts-expressions',
      title: 'Predefined contexts and ${{ }} expressions',
      docIds: ['contexts', 'expressions'],
    },
    {
      id: 'd1-authoring-tooling',
      title: 'Author with editor tooling and schema validation',
      docIds: ['gh-docs-actions'],
    },
    {
      id: 'd1-cache-artifacts-retention',
      title: 'Caching, artifacts, and retention via REST',
      docIds: ['dependency-caching', 'store-artifacts', 'rest-actions'],
    },
    {
      id: 'd1-passing-data',
      title: 'Pass data: job outputs, environment files, artifacts',
      docIds: ['workflow-commands', 'store-artifacts'],
    },
    {
      id: 'd1-summaries-badges',
      title: 'Job summaries and workflow status badges',
      docIds: ['workflow-commands', 'status-badges'],
    },
  ],
  lesson: {
    id: 'lesson-gh200-d1',
    domainId: 'gh200-d1',
    title: 'Author and manage workflows',
    minutes: 22,
    blocks: [
      { kind: 'h3', text: 'Anatomy: event → workflow → jobs → steps' },
      {
        kind: 'p',
        text: 'A workflow is a YAML file in `.github/workflows/`. Its [syntax](workflow-syntax) is a strict hierarchy: an **event** starts the workflow (`on:`), the workflow contains **jobs**, each job runs on a fresh **runner** and contains **steps**, and each step is either a shell script (`run:`) or a prebuilt unit (`uses:`). Authoring is easier with the GitHub Actions VS Code extension, which validates against the same schema GitHub uses at parse time — invalid keys fail before any job starts.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'name: CI\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci && npm test',
      },
      { kind: 'h3', text: 'Triggers: when a workflow runs' },
      {
        kind: 'p',
        text: 'The [events reference](workflow-events) splits into families: **repository events** (`push`, `pull_request`), **manual** (`workflow_dispatch`), **scheduled** (`schedule` with a cron expression), and **webhooks** — nearly every GitHub activity event can trigger a run. Filters narrow the blast radius: `branches`, `paths`, and `tags` keep noisy events from burning minutes. Exam facts about `schedule`: cron runs in **UTC**, the smallest interval is **5 minutes**, scheduled workflows run only from the **default branch**, and GitHub disables them after **60 days** of repository inactivity.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'on:\n  schedule:\n    - cron: "17 3 * * 1"        # 03:17 UTC every Monday\n  workflow_dispatch:          # manual "Run workflow" button\n    inputs:\n      environment:\n        description: Where to deploy\n        type: choice\n        options: [staging, production]\n        required: true\n        default: staging\n      dry-run:\n        type: boolean\n        default: false',
      },
      { kind: 'h3', text: 'Inputs and secrets across workflows' },
      {
        kind: 'p',
        text: '`workflow_dispatch` inputs carry types (`string`, `boolean`, `choice`, `environment`), `required`, and `default` — and a boolean input arrives in expressions as a real boolean. To share a whole workflow instead of copying it, give it a `workflow_call` trigger: inputs are typed (`string`, `boolean`, `number`), and **secrets are never inherited implicitly** — the caller maps them one by one, or with `secrets: inherit` to pass everything. That explicit mapping is a favorite exam distinction, and [reusing workflows](reuse-workflows) is the reference.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: '# .github/workflows/deploy-template.yml (the reusable one)\non:\n  workflow_call:\n    inputs:\n      target:\n        type: string\n        required: true\n    secrets:\n      deploy-token:\n        required: true\njobs:\n  ship:\n    steps:\n      - run: ./deploy.sh "${{ inputs.target }}"\n        env:\n          TOKEN: ${{ secrets.deploy-token }}\n\n# .github/workflows/release.yml (the caller)\njobs:\n  call-deploy:\n    uses: org/repo/.github/workflows/deploy-template.yml@v2\n    with:\n      target: production\n    secrets:\n      deploy-token: ${{ secrets.ORG_DEPLOY_TOKEN }}',
      },
      { kind: 'h3', text: 'Jobs, steps, dependencies — and matrix expansion' },
      {
        kind: 'p',
        text: 'Jobs run in **parallel by default**; `needs:` builds the dependency graph and gates later jobs on earlier success. Conditionals via `if:` see status-check functions — `success()` (the default), `failure()` (cleanup or notify jobs), and `always()` (teardown that must run either way; quote it, or the YAML parser reads `always:` as typed boolean advice). When jobs repeat configuration, YAML **anchors** (`&name`) and **aliases** (`*name`) deduplicate within one file — [the documented patterns](reuse-config) anchor an `env` block or a whole job mapping. The exam outline also names YAML merge keys (`<<:`) as vocabulary; GitHub documents anchors and aliases for workflows, so read the current docs before relying on `<<` in a real file.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'jobs:\n  build:\n    env: &shared-env        # anchor the mapping\n      NODE_ENV: production\n    runs-on: ubuntu-latest\n    steps:\n      - run: ./build.sh\n  test:\n    needs: build\n    env: *shared-env         # alias: same mapping, expanded\n    runs-on: ubuntu-latest\n    steps:\n      - run: ./test.sh\n  notify-on-failure:\n    needs: [build, test]\n    if: ${{ failure() }}\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "pipeline failed"\n\n# the same trick anchors a whole job:\n#   lint: *base-job   (alias copies the entire job mapping)',
      },
      {
        kind: 'p',
        text: '`strategy.matrix` generates one job per combination of its keys — the product of `os` × `node-version`, narrowed by `exclude` and widened by `include`. `fail-fast` (default `true`) cancels siblings when one combination fails; `max-parallel` throttles how many run at once — both levers for cost and flake control. Keep the matrix tight: every extra combination is billed minutes, and runner images deprecate (`ubuntu-20.04` retired; `windows-latest` migrates across Windows Server builds), so pin versions you actually test.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'jobs:\n  test:\n    strategy:\n      fail-fast: false\n      max-parallel: 2\n      matrix:\n        os: [ubuntu-latest, windows-latest]\n        node: [20, 22]\n        exclude:\n          - os: windows-latest\n            node: 20\n        include:\n          - os: macos-latest\n            node: 22\n    runs-on: ${{ matrix.os }}\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: ${{ matrix.node }}',
      },
      { kind: 'h3', text: 'Service containers' },
      {
        kind: 'p',
        text: 'A job that needs a database or queue gets one from the [`services:`](service-containers) map: GitHub pulls the image, starts it alongside the job, and the steps reach it on `localhost`. Map ports explicitly, and set container `options` with a health check so tests never race a still-booting service. Service containers run on the runner network — for jobs inside a container, use the service label, not localhost.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'jobs:\n  integration:\n    runs-on: ubuntu-latest\n    services:\n      postgres:\n        image: postgres:16\n        env:\n          POSTGRES_PASSWORD: postgres\n        ports:\n          - 5432:5432\n        options: >-\n          --health-cmd "pg_isready -U postgres"\n          --health-interval 5s\n          --health-retries 10\n    steps:\n      - run: pg_isready -h localhost -p 5432',
      },
      { kind: 'h3', text: 'Contexts, expressions, and data flow' },
      {
        kind: 'p',
        text: 'Expressions — `${{ }}` — evaluate against [contexts](contexts): `github` (event and repo metadata), `env`, `vars`, `secrets`, `inputs`, `matrix`, `needs` (upstream job outputs), `steps` (step outputs), and `runner`. Some evaluate at parse time (workflow-level constructs), most at runtime — the distinction the exam probes with "when is this expression evaluated?" Because `${{ }}` expansion happens **before** the shell runs, never interpolate untrusted text (a PR title) into `run:` — domain 5 covers why. To move data: **job outputs** hand values to `needs` consumers; the environment files (`GITHUB_ENV`, `GITHUB_OUTPUT`) pass values between **steps**; `GITHUB_STEP_SUMMARY` collects Markdown onto the run page; artifacts carry files between jobs. Caching (`cache: npm` or `actions/cache`) is keyed restore for dependencies, while [artifacts](store-artifacts) are run outputs, and both follow retention windows you can [manage via REST](rest-actions).',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'jobs:\n  build:\n    outputs:\n      version: ${{ steps.meta.outputs.version }}   # job output, for needs:\n    steps:\n      - id: meta\n        run: |\n          echo "version=$(git describe --tags)" >> "$GITHUB_OUTPUT"   # step output\n          echo "built_at=$(date -u +%FT%TZ)" >> "$GITHUB_ENV"           # env for later steps\n  report:\n    needs: build\n    steps:\n      - run: |\n          echo "Shipped version ${{ needs.build.outputs.version }}" >> "$GITHUB_STEP_SUMMARY"',
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          '`on:` picks the event; filters (`branches`, `paths`, `tags`) narrow it. Scheduled runs are UTC, default-branch-only, 5-minute floor.',
          '`workflow_dispatch` inputs are typed with defaults; `workflow_call` inputs and secrets are mapped explicitly by the caller.',
          '`needs:` orders jobs; `if: failure()` / `always()` escape the happy path; anchors and aliases (`&` / `*`) deduplicate YAML within one file.',
          'Matrix = product of keys, trimmed by `exclude`, widened by `include`; `fail-fast` and `max-parallel` tune it.',
          'Data moves three ways: env files between steps, job outputs between jobs, artifacts for files; `GITHUB_STEP_SUMMARY` renders Markdown on the run page.',
          '`GITHUB_OUTPUT` writes **step** outputs (`steps.<id>.outputs`); a job’s `outputs:` block promotes them to `needs.<job>.outputs` — a favorite exam distinction.',
          'A [status badge](status-badges) embeds the workflow’s pass/fail in any README, keyed on the workflow filename plus branch.',
        ],
      },
    ],
  },
};
