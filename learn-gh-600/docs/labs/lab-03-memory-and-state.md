# Lab 3: Domain 3 - Manage memory, state, and execution

## Objective

Practice choosing memory strategies, persisting task state, resuming interrupted agent work, detecting drift, and sharing state across tools.

## Scenario

You will run a multi-PR migration: rename the `name` query field to `recipient` while preserving backward compatibility long enough for clients to migrate. The work spans multiple sessions, so chat history is not enough.

## Domain objectives

- Choose short-term, long-term, and external memory.
- Scope memory to task-relevant information.
- Define expiration, pruning, and reset rules.
- Capture progress and decisions as durable artifacts.
- Resume work without repeating steps or diverging from prior decisions.
- Prevent conflicting or stale context across tools.

## GitHub product path

- GitHub Issue with a task list.
- `AGENTS.md` for repo-wide agent conventions.
- `.github/copilot-instructions.md` for Copilot-specific behavior.
- Pull request bodies and comments for plan/state.
- A decision log committed to the repository.

## Alternative tools

- Cursor rules in `.cursor/rules/*.mdc`.
- Claude Code `CLAUDE.md`.
- LangGraph checkpointers.
- mem0 or Letta for external long-term memory.
- Jira/Linear issues as durable state when GitHub Issues is not the source of truth.

## Steps

### 1. Create the migration issue

Use this issue body:

```text
Goal: migrate /greet?name= to /greet?recipient=

Task list:
- [ ] Add support for recipient query parameter.
- [ ] Keep name as deprecated fallback.
- [ ] Add tests for recipient, name fallback, and default greeting.
- [ ] Update README examples.
- [ ] Add a deprecation note in the PR.
- [ ] Remove fallback in a future issue after clients migrate.

Decision rules:
- Do not break existing /greet?name= callers in this lab.
- Any change to response JSON must be approved by a maintainer.
```

### 2. Add shared memory files

Copy:

- [`scaffold/AGENTS.md`](scaffold/AGENTS.md)
- [`scaffold/.github/copilot-instructions.md`](scaffold/.github/copilot-instructions.md)
- [`scaffold/memory/decisions.md`](scaffold/memory/decisions.md)

These files make state visible to GitHub Copilot, Cursor, Claude Code, and any other repo-aware agent.

### 3. Classify memory

| Memory type | What to store | Expiration |
| --- | --- | --- |
| Short-term | Current PR plan and active test output | Reset when PR closes |
| Long-term | Coding conventions and deployment constraints | Update through normal PR review |
| External durable | Issue checklist and decision log | Keep until migration completes |

### 4. Resume after interruption

Stop the agent after it completes the first task. Start a new chat or new agent run and provide only:

```text
Resume issue #ISSUE_NUMBER. Read the issue checklist and memory/decisions.md before acting.
```

Expected result: the agent starts with the next unchecked item instead of repeating completed work.

### 5. Detect drift

Compare the current PR plan against the issue goals:

- If the agent tries to remove `name` fallback too early, flag context drift.
- If the agent changes response JSON without approval, flag policy drift.
- If the agent starts editing CI or deployment files, flag scope drift.

Record the drift finding in the PR and ask the agent to correct the plan before editing code.

### 6. Prune stale memory

After the migration is complete:

- Close the tracking issue.
- Add the final decision to `memory/decisions.md`.
- Remove temporary PR comments from active context.
- Keep durable decisions that explain shipped behavior.

## Validation checklist

- [ ] The issue checklist tracks progress.
- [ ] `AGENTS.md` and Copilot instructions contain current project constraints.
- [ ] `memory/decisions.md` records at least one decision.
- [ ] A resumed run starts from the next unfinished task.
- [ ] Drift is identified and corrected before code changes continue.

## Self-check

Review `docs/practice-example-1.md` questions 15-20.
