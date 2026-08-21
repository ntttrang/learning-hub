import type { Domain } from '../types';

/**
 * GH-200 domain 2 — Consume and troubleshoot workflows (15–20%).
 *
 * The reader's domain: predicting behavior from a workflow file, diagnosing
 * a red run from its logs, getting logs and artifacts out through the UI and
 * the API, and choosing between starter workflows, reusable workflows, and
 * composite actions — plus the disable-versus-delete lifecycle call.
 */
export const domain: Domain = {
  id: 'gh200-d2',
  cert: 'gh200',
  number: 2,
  title: 'Consume and troubleshoot workflows',
  weightMin: 15,
  weightMax: 20,
  summary:
    'Reading workflows and their logs, diagnosing failures, expanding anchors and matrices, fetching logs/artifacts via UI and API, starter vs reusable vs composite, disable vs delete.',
  subSkills: [
    {
      id: 'd2-read-config',
      title: 'Identify triggers and effects from configuration and logs',
      docIds: ['workflow-events', 'view-run-history'],
    },
    {
      id: 'd2-diagnose-failures',
      title: 'Diagnose failed runs from logs and run history',
      docIds: ['troubleshoot-workflows', 'view-run-history'],
    },
    {
      id: 'd2-expand-config',
      title: 'Expand YAML anchors and matrix axes; rerun individual matrix jobs',
      docIds: ['workflow-syntax', 'view-run-history'],
    },
    {
      id: 'd2-logs-artifacts',
      title: 'Locate and download logs and artifacts (UI and API)',
      docIds: ['rest-actions', 'store-artifacts'],
    },
    {
      id: 'd2-templates',
      title: 'Starter workflows and organization workflow templates',
      docIds: ['workflow-templates', 'template-repositories'],
    },
    {
      id: 'd2-reusable-vs-composite',
      title: 'Starter vs reusable workflows vs composite actions',
      docIds: ['reuse-workflows', 'create-composite-action'],
    },
    {
      id: 'd2-disable-vs-delete',
      title: 'Disabling versus deleting a workflow',
      docIds: ['disable-workflows'],
    },
  ],
  lesson: {
    id: 'lesson-gh200-d2',
    domainId: 'gh200-d2',
    title: 'Consume and troubleshoot workflows',
    minutes: 18,
    blocks: [
      { kind: 'h3', text: 'Read the run page like a diagnostician' },
      {
        kind: 'p',
        text: 'Every [run history](view-run-history) entry answers the exam’s first questions before you open a single log: **what event** started it (with the branch, actor, and commit), **which workflows** it triggered, and **how long** each job took. The Annotations panel is GitHub’s parsed error list — failing steps, error messages, even the offending file and line — and it is the fastest triage surface on the page. Below it, expand any step to read its raw log; failed steps open expanded already.',
      },
      {
        kind: 'p',
        text: 'Half of this domain is prediction: given a config, say what will happen. The mappings the exam tests most:',
      },
      {
        kind: 'table',
        headers: ['Configuration', 'Effect you should predict'],
        rows: [
          ['`on: push: branches: [main]`', 'Runs only for commits landing on `main` — a PR updating a different branch does nothing'],
          ['`needs: build`', 'This job waits for `build`; if `build` fails, it is skipped (not failed)'],
          ['`if: failure()`', 'Runs only when an earlier dependency failed — the notify/cleanup pattern'],
          ['`concurrency: group`', 'Queues or cancels overlapping runs of the same group'],
          ['`matrix: include`', 'Adds combinations beyond the product of matrix keys'],
        ],
      },
      { kind: 'h3', text: 'Diagnose a red run' },
      {
        kind: 'p',
        text: 'Work from annotations to logs to run history. [Troubleshooting workflows](troubleshoot-workflows) names the recurring culprits: non-zero exit codes (the step log ends with `Process completed with exit code 1`), missing permissions (a 403 from the GitHub API), secrets that silently resolve to empty when the name is wrong (real values show as `***` in logs), and YAML that never parsed — those runs fail before any job starts. Compare a green run of the same workflow against the red one; the diff usually contains the answer.',
      },
      {
        kind: 'code',
        language: 'bash',
        code: '# tail of a failed step log — read it bottom-up\nnpm ERR! Test failed. See above for more details.\n##[error]Process completed with exit code 1.\n\n# a permissions failure instead looks like:\n# ##[error]Resource not accessible by integration  ← GITHUB_TOKEN scopes',
      },
      {
        kind: 'tip',
        text: 'Two debug levers the exam likes: re-run with **debug logging** enabled (repository secrets `ACTIONS_STEP_DEBUG` and `ACTIONS_RUNNER_DEBUG` set to `true`), and `Re-run jobs` from the run page — which preserves the same logs for comparison instead of starting a fresh run record.',
      },
      { kind: 'h3', text: 'Anchors and matrices under the microscope' },
      {
        kind: 'p',
        text: 'The Actions UI renders the **expanded** workflow: matrix jobs appear as `job (ubuntu-latest, 20)` — parenthesized axis values, in key order — so correlate a failed job to its combination by reading the parenthetical, then rerun **only that job** with "Re-run failed jobs". YAML anchors are the opposite: the run page shows the expanded result, and the anchor itself is invisible — to know what `*shared-env` contributed you must read the source file. That read-the-source habit is exactly what domain 2 tests.',
      },
      { kind: 'h3', text: 'Logs and artifacts out of the system' },
      {
        kind: 'p',
        text: 'In the UI: the run page’s gear menu downloads **all logs** as a zip, and the run’s Artifacts panel lists uploads with sizes and expiry dates. Programmatically, the [Actions REST API](rest-actions) exposes the same: list runs, fetch a run’s log archive, list and download [artifacts](store-artifacts) — the API path for automation that scrapes CI evidence, and the reason the exam pairs "UI" with "or via API" on these skills.',
      },
      {
        kind: 'code',
        language: 'bash',
        code: 'RUN=$(gh api repos/:owner/:repo/actions/runs --jq ".workflow_runs[0].id")\ngh api "repos/:owner/:repo/actions/runs/$RUN/logs" > run-logs.zip\ngh api repos/:owner/:repo/actions/artifacts --jq ".artifacts[].name"',
      },
      { kind: 'h3', text: 'Templates, reusable workflows, composite actions' },
      {
        kind: 'p',
        text: 'Three ways to consume someone else’s automation, and the exam wants the boundaries sharp. A **starter workflow** is scaffolding the Actions tab copies into your repo — from then on it is yours and evolves independently. A **reusable workflow** stays defined once (with `workflow_call`) and is invoked by callers, versioned centrally. A **composite action** packages steps as an action referenced with `uses:`. [Workflow templates](workflow-templates) also come from organizations: an org `.github` repository (a [template repository](template-repositories) with `.github/workflow-templates/`) publishes starter workflows to every repo in the org, including **non-public** ones — the exam’s example of sharing without the Marketplace.',
      },
      {
        kind: 'table',
        headers: ['Kind', 'Where it lives', 'Copy or reference'],
        rows: [
          ['Starter workflow', 'Copied into `.github/workflows/` of your repo', 'Copied — diverges immediately'],
          ['Reusable workflow', 'One definition, invoked via `workflow_call`', 'Referenced — callers pin `owner/repo/path@ref`'],
          ['Composite action', '`action.yml` with `runs.using: composite`', 'Referenced — a step-level `uses:`'],
        ],
      },
      { kind: 'h3', text: 'Disable versus delete' },
      {
        kind: 'p',
        text: '[Disabling a workflow](disable-workflows) — from the Actions tab or the REST API — stops it from running but keeps the file and its run history, and it can be re-enabled in one click. Deleting the workflow file stops future runs too, but that is a git change: history of past runs remains, and the workflow disappears from the Actions list for new events. The exam framing: **disable is reversible housekeeping; delete is removing the definition from the codebase** — and neither erases past run history.',
      },
      { kind: 'h3', text: 'Before you move on' },
      {
        kind: 'list',
        items: [
          'Triage order: annotations → failed step log → green-vs-red run diff.',
          '`exit code 1`, `Resource not accessible by integration`, and pre-job YAML errors are the classic log signatures.',
          'Matrix jobs show their axes in the job name; "Re-run failed jobs" targets one combination.',
          'Logs and artifacts download from the UI as zips, or via `actions/runs/{id}/logs` and `actions/artifacts` REST endpoints.',
          'Starter = copied scaffold; reusable = centrally versioned `workflow_call`; composite = steps-in-an-action; org templates (including private ones) ship from the org `.github` repo.',
          'Disable keeps history and reverses in a click; deleting the file removes the definition but not past runs.',
        ],
      },
    ],
  },
};
