import type { Domain } from '../types';

/**
 * GH-200 domain 3 — Author and maintain actions (15–20%).
 *
 * Turning automation into a reusable unit: the three action types, the
 * action.yml contract, workflow commands from inside an action, and how a
 * finished action reaches its users — public repo, org, or Marketplace —
 * with a versioning strategy that survives immutable actions.
 */
export const domain: Domain = {
  id: 'gh200-d3',
  cert: 'gh200',
  number: 3,
  title: 'Author and maintain actions',
  weightMin: 15,
  weightMax: 20,
  summary:
    'Action types (JavaScript, Docker, composite), action.yml metadata, workflow commands inside actions, distribution models, and versioning strategies.',
  subSkills: [
    {
      id: 'd3-action-types',
      title: 'Action types: JavaScript, Docker, composite — and immutable actions',
      docIds: ['metadata-syntax'],
    },
    {
      id: 'd3-troubleshoot-actions',
      title: 'Create and troubleshoot custom actions',
      docIds: ['create-composite-action', 'troubleshoot-workflows'],
    },
    {
      id: 'd3-structure-metadata',
      title: 'Required files, directory structure, and metadata',
      docIds: ['metadata-syntax', 'create-composite-action'],
    },
    {
      id: 'd3-commands-in-actions',
      title: 'Implement workflow commands within actions',
      docIds: ['workflow-commands'],
    },
    {
      id: 'd3-distribution',
      title: 'Distribution: public, private, Marketplace',
      docIds: ['publish-actions', 'share-with-enterprise'],
    },
    {
      id: 'd3-versioning',
      title: 'Versioning and release strategies',
      docIds: ['release-actions'],
    },
  ],
  lesson: {
    id: 'lesson-gh200-d3',
    domainId: 'gh200-d3',
    title: 'Author and maintain actions',
    minutes: 16,
    blocks: [
      { kind: 'h3', text: 'Three kinds of action' },
      {
        kind: 'p',
        text: 'An action is a folder with an `action.yml` (or `action.yaml`) metadata file whose `runs` key picks the type. **Composite** actions bundle steps as YAML — no code, any OS, the default choice for wrapping two or three steps. **JavaScript** actions run `node` directly on the runner — fastest startup and cross-platform, but you ship and bundle compiled code. **Docker** actions run a container from a Dockerfile — total environment control, but hosted runners must build the image first (Linux jobs only) and startup is slowest. With **immutable actions** rolling out on hosted runners, published versions are frozen once released — which makes how you pin versions (domain 5) part of this domain’s story too.',
      },
      {
        kind: 'table',
        headers: ['Type', '`runs.using`', 'Best for', 'Watch out'],
        rows: [
          ['Composite', '`composite`', 'Wrapping reusable steps; zero code', 'Steps only — no custom runtime'],
          ['JavaScript', '`node20` / `node24`', 'Cross-platform logic, fast start', 'Must bundle `dist/`; must run code, not just YAML'],
          ['Docker', '`docker`', 'Locked-down toolchain inside a container', 'Hosted runners: Linux only; image build adds minutes'],
        ],
      },
      { kind: 'h3', text: 'action.yml: the contract' },
      {
        kind: 'p',
        text: 'The [metadata syntax](metadata-syntax) file is the action’s public API: `name` and `description` show in the UI, `inputs` declare parameters (each with `description`, `required`, `default`), `outputs` declares what the action produces, and `branding` colors the Marketplace listing. The directory needs the metadata file plus whatever the type requires — `Dockerfile`/entrypoint for Docker, bundled JS for JavaScript, nothing extra for composite. Consumers reference it as `owner/repo@ref` or `owner/repo/path@ref` when it lives in a subdirectory.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: '# action.yml — a composite action that says hello\nname: "Greeting"\ndescription: Prints a configurable greeting\ninputs:\n  who:\n    description: Who to greet\n    required: true\n  suffix:\n    description: Trailing punctuation\n    default: "!"\noutputs:\n  message:\n    description: The greeting that was printed\n    value: $\{{ steps.hello.outputs.message }}\nruns:\n  using: composite\n  steps:\n    - id: hello\n      shell: bash\n      run: |\n        msg="Hello $\{{ inputs.who }}$\{{ inputs.suffix }}"\n        echo "message=$msg" >> "$GITHUB_OUTPUT"\n        echo "$msg"',
      },
      { kind: 'h3', text: 'Use it, then share it' },
      {
        kind: 'p',
        text: 'Test locally-first: keep the action in `.github/actions/greeting/action.yml` inside a repo and call it with `uses: ./.github/actions/greeting` — same-repo relative paths need no release. When it is ready, [release it](release-actions): tag versions and move tags deliberately. The conventional scheme publishes `v1`, `v1.1`, and `v1.1.2`, where the major tag (`v1`) is **moved forward** to the latest minor release so consumers pinning `@v1` get fixes without churn. Creating the release also (optionally) bundles a Git tag, a SHA, and a `major version` branch.',
      },
      {
        kind: 'code',
        language: 'yaml',
        code: 'jobs:\n  demo:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - id: greet\n        uses: ./.github/actions/greeting   # local, unreleased\n        with:\n          who: Actions\n      - run: echo "got $\{{ steps.greet.outputs.message }}"',
      },
      {
        kind: 'tip',
        text: 'In JavaScript actions every input arrives as a **string** — use `core.getBooleanInput`/`core.getInput` conversions rather than truthiness checks. Composite action inputs, by contrast, are typed by their `type:` key.',
      },
      { kind: 'h3', text: 'Workflow commands from inside' },
      {
        kind: 'p',
        text: 'Actions talk back through [workflow commands](workflow-commands) — `echo` lines the runner interprets. `::debug`, `::group`/`::endgroup`, `::warning`, and `::error` annotate logs; writing `key=value` to `$GITHUB_OUTPUT` sets an output; appending Markdown to `$GITHUB_STEP_SUMMARY` lands on the run page. These work from every action type, including plain `run:` steps — that is the point: the protocol is the interface.',
      },
      {
        kind: 'code',
        language: 'bash',
        code: 'echo "::group::Lint results"\nnpm run lint\necho "::endgroup::"\necho "::error::Lint failed with 3 problems"\necho "lint-count=3" >> "$GITHUB_OUTPUT"',
      },
      { kind: 'h3', text: 'Distribution channels' },
      {
        kind: 'p',
        text: 'A repo-hosted action is usable by anyone who can read the repo — so a public repo is a public action, an internal repo serves only the org, and [sharing within an enterprise](share-with-enterprise) scales that with the enterprise `.github` repository. The [Marketplace](publish-actions) adds discovery: publish from a public repo, complete the listing, and GitHub marks whether the publisher is **verified** — the signal domain 5 tells consumers to check before `uses:`.',
      },
      {
        kind: 'table',
        headers: ['Channel', 'Visibility', 'Notes'],
        rows: [
          ['Public repository', 'Everyone', 'Free-for-all discovery; Marketplace optional'],
          ['Org / enterprise repo', 'Members only', 'Central versioning without publishing'],
          ['GitHub Marketplace', 'Everyone, listed', 'Verified-publisher badge; requires a public repo'],
        ],
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          '`runs.using` picks the type: `composite` (steps), `node20`/`node24` (JS), `docker` (container, Linux-only on hosted runners).',
          '`action.yml` declares inputs, outputs, branding; consumers reference `owner/repo@ref`, subdirectory included when needed.',
          'Test via `uses: ./path` in the same repo before any release.',
          'Release with major-tag mobility (`v1` points at the newest `v1.x`) so `@v1` consumers get fixes.',
          'Workflow commands are the action’s output interface — outputs, annotations, groups, and job summaries.',
          'Distribution: public repo, org/enterprise repo, or Marketplace listing with a verified-publisher signal.',
        ],
      },
    ],
  },
};
