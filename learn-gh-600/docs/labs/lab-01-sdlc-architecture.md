# Lab 1: Domain 1 - Prepare agent architecture and SDLC processes

## Objective

Practice the GH-600 skills for integrating agents into the SDLC, separating planning from execution, and configuring observability and control for autonomous work.

## Scenario

You will onboard a coding agent to add `GET /healthz` to `corgi-greeter`. The agent may propose code, tests, and workflow updates, but it must first produce a structured plan and wait for approval.

## Domain objectives

- Identify steps for agents to perform.
- Define agent inputs, outputs, and success criteria.
- Configure planning to be distinct from execution.
- Validate agent plans before action.
- Produce inspectable artifacts inside normal development tooling.
- Configure human intervention without slowing low-risk delivery.

## GitHub product path

- GitHub Issues define the requested work.
- GitHub Copilot coding agent drafts the change.
- Pull Requests hold the plan, commits, CI logs, and review history.
- CODEOWNERS and rulesets enforce review.
- Labels provide a simple approval gate.

## Alternative tools

- Cursor Background Agent with `AGENTS.md`.
- Claude Code with `CLAUDE.md` and a `/plan` command.
- Devin or Aider with architect/edit separation.
- Linear or Jira for issue intake when GitHub Issues is not the source of truth.

## Steps

### 1. Open the task issue

Create an issue:

```text
Title: Add /healthz endpoint

Goal:
- Add GET /healthz.
- Return HTTP 200 and JSON {"status":"ok"}.
- Add tests.
- Do not change /greet behavior.

Success criteria:
- go test ./... passes.
- Endpoint works locally.
- PR contains an approved structured plan before code changes.
```

### 2. Add repository instructions

Copy [`scaffold/.github/copilot-instructions.md`](scaffold/.github/copilot-instructions.md) into the training repo. Confirm it says the agent must:

- Read the issue first.
- Produce a structured plan.
- Stop after planning until a human applies `plan-approved`.
- Keep changes limited to the issue scope.
- Explain test evidence in the PR.

### 3. Add ownership

Copy [`scaffold/CODEOWNERS`](scaffold/CODEOWNERS). Replace `@OWNER/platform-reviewers` with your team or account.

Suggested ownership:

```text
* @OWNER/platform-reviewers
.github/workflows/* @OWNER/platform-reviewers
Dockerfile @OWNER/platform-reviewers
```

### 4. Configure rulesets

Create a branch ruleset for `main`:

- Require pull request before merge.
- Require CODEOWNER review.
- Require status checks: `test`, `docker-build`.
- Block direct pushes.
- Require signed commits if your organization uses them.

Create a label gate in your process: only maintainers can add `plan-approved`. If your GitHub plan supports merge rules based on labels, require that label before merge. If not, require CODEOWNER review and make the label part of the review checklist.

### 5. Ask the agent to plan

Prompt the agent:

```text
Use issue #ISSUE_NUMBER. Produce only the structured plan first. Do not edit files until the PR has label plan-approved.
```

The plan should include:

- Inputs read.
- Files expected to change.
- Tests expected to add or update.
- Risks and rollback.
- Exact success criteria.

### 6. Approve and execute

Review the plan. If it matches the issue, add the `plan-approved` label or approve the PR comment. Then ask the agent to implement.

### 7. Inspect artifacts

Confirm the PR contains:

- The original plan.
- Commits linked to the agent actor.
- CI logs.
- Test output.
- Human approval history.

## Validation checklist

- [ ] The first agent artifact is a plan, not a code change.
- [ ] The plan lists inputs, outputs, success criteria, tests, and rollback.
- [ ] Code changes wait for a maintainer approval action.
- [ ] Branch rules prevent direct pushes to `main`.
- [ ] Review and CI artifacts are visible in the PR.

## Common anti-patterns to avoid

- Letting the agent plan and execute in one undifferentiated step.
- Giving broad write access before defining the task boundary.
- Relying on chat history instead of durable issue and PR artifacts.
- Requiring human approval for every low-risk action, which slows delivery without reducing real risk.

## Self-check

Review `docs/practice-example-1.md` questions 1-6.
