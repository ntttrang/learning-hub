# Lab 5: Domain 5 - Orchestrate multi-agent coordination

## Objective

Practice coordinating multiple agents, isolating parallel work, resolving conflicts, producing audit artifacts, recovering from failures, and managing agent lifecycle changes.

## Scenario

You will ship one feature with four agents:

- `test-writer`: adds tests.
- `doc-writer`: updates README and release notes.
- `security-reviewer`: checks risk and scans outputs.
- `release-coordinator`: merges the specialist outputs into one integration PR.

## Domain objectives

- Apply an orchestration pattern.
- Configure isolation for parallel execution.
- Detect overlapping changes and contradictory outputs.
- Produce logs and artifacts suitable for audit.
- Document decisions, handoffs, and outcomes.
- Detect failed, partial, or stalled executions.
- Add, update, replace, and retire agents without disrupting active work.

## GitHub product path

- Copilot custom agents.
- GitHub Actions matrix jobs.
- Isolated branches per agent.
- Artifacts for `plan.json`, `result.json`, and traces.
- Concurrency groups for safe coordination.
- Pull requests for integration review.

## Alternative tools

- CrewAI role-based crews.
- AutoGen group chats.
- LangGraph supervisor and worker graphs.
- Temporal or Inngest for durable orchestration.
- Human coordinator with separate Cursor or Claude Code sessions.

## Steps

### 1. Define the feature

Create an issue:

```text
Feature: Add request ID header

Requirements:
- Every response includes X-Request-ID.
- If client sends X-Request-ID, echo it.
- If not, generate one.
- Add tests.
- Update README.
- Confirm no secrets or unsafe headers are logged.
```

### 2. Copy custom agents

Copy:

- [`scaffold/.github/agents/test-writer.yml`](scaffold/.github/agents/test-writer.yml)
- [`scaffold/.github/agents/doc-writer.yml`](scaffold/.github/agents/doc-writer.yml)
- [`scaffold/.github/agents/security-reviewer.yml`](scaffold/.github/agents/security-reviewer.yml)
- [`scaffold/.github/agents/release-coordinator.yml`](scaffold/.github/agents/release-coordinator.yml)

Each specialist must write its own plan and result artifact.

### 3. Run isolated branches

Copy [`scaffold/.github/workflows/multi-agent.yml`](scaffold/.github/workflows/multi-agent.yml). The intended pattern is:

```text
agent/test-writer/<run-id>
agent/doc-writer/<run-id>
agent/security-reviewer/<run-id>
agent/release-coordinator/<run-id>
```

Each agent works in its own branch, which prevents accidental overwrites.

### 4. Aggregate results

The coordinator should:

- Read all specialist artifacts.
- Detect overlapping file edits.
- Create a single integration branch.
- Cherry-pick or manually apply non-conflicting work.
- Flag conflicts with labels such as `agent-conflict` and `needs-human`.

### 5. Produce post-hoc artifacts

For every agent, upload:

```json
{
  "agent": "test-writer",
  "event": "completed",
  "toolCallId": "run-id-or-step-id",
  "branch": "agent/test-writer/123",
  "summary": "Added request ID tests",
  "next": "Coordinator should merge tests with implementation"
}
```

The coordinator report should include:

- Selected agents.
- Started/completed/failed/deselected events.
- Branches created.
- Conflicts detected.
- Human decisions required.

### 6. Test failure and recovery

Force a failure by making `doc-writer` edit the same file as `test-writer`. Expected response:

- Conflict detection labels the run.
- Coordinator does not silently overwrite either result.
- A human-in-the-loop issue is opened.
- Failed branch remains auditable.

### 7. Practice lifecycle changes

Add a fourth `perf-tester` row to the matrix for future runs. Do not interrupt active runs. Retire `doc-writer` by removing it from future orchestration while keeping old artifacts and PR history.

## Validation checklist

- [ ] Each agent works in an isolated branch.
- [ ] Each agent emits plan and result artifacts.
- [ ] Coordinator creates a single integration PR.
- [ ] Overlapping changes are detected before merge.
- [ ] Failed or stalled execution triggers recovery.
- [ ] Retired agents remain auditable through old artifacts.

## Self-check

Review `docs/practice-example-1.md` questions 28-34 and 43.
