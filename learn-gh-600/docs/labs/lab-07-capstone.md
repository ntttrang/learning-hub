# Lab 7: Capstone - End-to-end agentic delivery

## Objective

Combine every GH-600 domain into one production-style flow: issue intake, structured plan, tooled execution, durable memory, evaluation, multi-agent handoff, and guarded deployment.

## Scenario

Ship a new `GET /version` endpoint that returns the Git commit SHA and build time. The work must go through the same controls used by the earlier labs.

## Required artifacts

- GitHub Issue with task list and success criteria.
- Structured agent plan in the PR.
- Agent branch under `agent/*`.
- Durable memory update in `memory/decisions.md`.
- CI, scan, and eval artifacts.
- Multi-agent handoff report.
- Production deployment approval and log.
- Post-hoc report explaining what happened and what changed.

## Steps

### 1. Open the capstone issue

```text
Title: Add /version endpoint

Requirements:
- Return JSON with git_sha and build_time.
- Do not expose secrets or environment variables.
- Add tests.
- Update docs.
- Build and push a container image.
- Deploy through staging before production.
```

### 2. Plan before acting

Ask the release agent:

```text
Use issue #ISSUE_NUMBER. Produce a structured plan only. Wait for plan-approved before editing.
```

Approve only if the plan includes:

- Files to change.
- Tests.
- Tool list.
- Risk classification.
- Rollback.
- Evaluation signals.

### 3. Execute with scoped tools

The agent should use only approved GitHub, filesystem, and deployment-read tools. It should create an `agent/version/<run-id>` branch and a draft PR.

If a requested tool is missing, the agent must escalate instead of improvising with broader permissions.

### 4. Persist state

Update:

- Issue checklist.
- PR body.
- `memory/decisions.md`.
- Agent trace artifact.

Then simulate interruption. Start a fresh agent run and ask it to resume from the durable artifacts.

### 5. Evaluate the result

Run:

- Unit tests.
- Coverage gate.
- Lint.
- CodeQL.
- Secret scanning.
- Container scan.
- Eval scorecard from `agent-evals.yml`.

Classify any failure as:

- Reasoning.
- Tool.
- Context/environment.

Tune instructions, memory, or tool access, then rerun if needed.

### 6. Coordinate specialists

Run the multi-agent workflow:

- `test-writer` checks tests.
- `doc-writer` checks README/release notes.
- `security-reviewer` checks exposure risk.
- `release-coordinator` prepares the integration PR.

The coordinator must not merge conflicting outputs silently.

### 7. Deploy with guardrails

Deploy to `staging` after one reviewer approves. Deploy to `production` only after the required production reviewers approve the environment gate.

Expected production controls:

- No direct push to `main`.
- No self-approval by the agent.
- OIDC role scoped to one ECS service.
- Deployment event is auditable.

### 8. Write the post-hoc report

Add the report to the PR comment or Actions artifact, not to this study repo:

```text
Outcome:
Evidence:
Failures:
Root cause:
Tuning applied:
Guardrails triggered:
Follow-up:
```

## Validation checklist

- [ ] Issue, PR, CI, eval, and deployment artifacts are linked.
- [ ] Plan was approved before execution.
- [ ] Agent tools were scoped and traceable.
- [ ] Durable memory allowed a fresh run to resume.
- [ ] Multi-agent handoff produced artifacts.
- [ ] Production deployment required approval.
- [ ] Final report maps evidence to GH-600 domains.

## Completion criteria

You are ready to retake the mock exams when you can explain how this capstone demonstrates all six domains without looking at the lab notes.
