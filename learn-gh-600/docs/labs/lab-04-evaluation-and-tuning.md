# Lab 4: Domain 4 - Perform evaluation, error analysis, and tuning

## Objective

Practice defining evaluation signals, analyzing agent failures, classifying root causes, and tuning instructions, memory, and tool access.

## Scenario

The release agent can open pull requests, but the team does not know whether it is reliable enough for production use. You will score repeated agent runs, identify failure causes, tune the configuration, and compare results.

## Domain objectives

- Specify expected outcomes and operational constraints.
- Identify qualitative and quantitative evaluation signals.
- Generate evaluation signals with automated scanning tools.
- Use logs, plans, traces, outputs, and workflow artifacts to identify failures.
- Classify root causes as reasoning errors, tool misuse, or context/environment issues.
- Revise instructions, memory, workflow constraints, and tool access.

## GitHub product path

- GitHub Actions for repeatable evaluation jobs.
- CodeQL, Dependabot, secret scanning, and code scanning.
- Actions artifacts for traces and reports.
- Pull request comments for scorecards.
- `gh agent-task` where available.

## Alternative tools

- promptfoo for prompt and agent task evals.
- DeepEval or OpenAI Evals for scoring.
- Braintrust for experiment tracking.
- Langfuse or Arize Phoenix for traces.
- Trivy and Grype for container scanning.

## Steps

### 1. Define success criteria

Copy [`scaffold/evals/criteria.md`](scaffold/evals/criteria.md). Keep the first eval simple:

| Signal | Target |
| --- | --- |
| CI pass rate | At least 80% on first attempt |
| Test coverage | At least 70% |
| Security scans | No critical findings |
| Tool violations | Zero destructive command attempts |
| Review quality | PR explains plan, tests, and risks |

### 2. Add automated scanners

Add or enable:

- `go test -cover ./...`
- `golangci-lint`
- CodeQL
- Dependabot
- Secret scanning and push protection
- Trivy container scan

These are not just quality gates; they are evaluation signals for agent output.

### 3. Add the eval workflow

Copy [`scaffold/.github/workflows/agent-evals.yml`](scaffold/.github/workflows/agent-evals.yml). It demonstrates:

- Running after pull request checks.
- Collecting test, lint, and scan results.
- Producing a markdown scorecard.
- Uploading an artifact for post-hoc review.

### 4. Run repeated tasks

Ask the agent to perform the same small change several times on isolated branches, for example:

```text
Add request logging middleware with tests. Keep behavior unchanged.
```

If `gh agent-task --bulk` is available, use it. Otherwise, start 5-10 separate agent runs manually and record the results in the eval report.

### 5. Classify failures

Use the three GH-600 buckets:

| Bucket | Example in this lab | Tuning action |
| --- | --- | --- |
| Reasoning | Agent changes response JSON even though behavior must remain unchanged | Clarify instructions and success criteria |
| Tool | Agent tries forbidden shell or cloud command | Narrow tool access and firewall rules |
| Context/environment | Agent assumes AWS variables exist in pull requests from forks | Document environment constraints and add guard checks |

### 6. Tune and rerun

Tune one lever at a time:

- Instructions: make success criteria more explicit.
- Memory: prune stale issue comments and decision notes.
- Tools: remove broad tools or add a safer read-only tool.
- Workflow: add preflight checks before deploy steps.

Rerun the same task set and compare pass rate, violations, and reviewer corrections.

## Validation checklist

- [ ] Evaluation criteria are written before the run.
- [ ] CI emits quantitative signals.
- [ ] PR review captures qualitative signals.
- [ ] Failures are classified as reasoning, tool, or context/environment.
- [ ] At least one tuning change improves or explains the next run.

## Self-check

Review `docs/practice-example-1.md` questions 21-27 and 47.
