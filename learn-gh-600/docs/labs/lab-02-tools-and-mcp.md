# Lab 2: Domain 2 - Implement tool use and environment interaction

## Objective

Practice the heaviest GH-600 domain: choosing tools, configuring MCP servers, scoping execution environments, invoking agents from CI, and building safe error paths.

## Scenario

The release agent needs to ship `corgi-greeter` safely. It should read repository files, inspect GitHub pull requests, read deployment context, and post release notes. It must not call destructive tools or write outside the allowed branch scope.

## Domain objectives

- Identify and configure required tools.
- Configure tool permissions.
- Add and allow MCP servers.
- Configure repository, branch, CI, and environment scope.
- Enable agents to create branches and pull requests.
- Implement error handling, retries, rollback, escalation, traceability, and accountability.

## GitHub product path

- Copilot custom agents.
- GitHub MCP server.
- MCP organization allow lists.
- Agent firewall for shell command control.
- GitHub Actions for CI invocation.
- Fine-grained GitHub App or token scopes.

## Alternative tools

- Cursor `.cursor/mcp.json` or workspace MCP configuration.
- Claude Desktop `claude_desktop_config.json`.
- Continue.dev `config.yaml`.
- `mcp-proxy` for sandboxing and audit logs.
- OPA/Conftest for policy checks.

## Steps

### 1. Inventory required tools

Create a tool table in the PR description:

| Need | Tool | Permission | Risk |
| --- | --- | --- | --- |
| Read code | GitHub repo tools | `contents:read` | Low |
| Create branch and PR | GitHub repo tools | `contents:write`, `pull_requests:write` | Medium |
| Read deployment state | AWS MCP or AWS CLI read-only | ECS read actions | Medium |
| Post release note | Slack MCP | `chat:write` in one channel | Low |
| Delete cloud resources | Not allowed | None | High |

### 2. Configure MCP allow lists

At organization or repository level, allow only the MCP servers required for the lab:

- GitHub remote MCP.
- A read-only AWS or filesystem MCP server.
- Slack or a mock Slack MCP server.

Mirror the local development setup with [`scaffold/.vscode/mcp.json`](scaffold/.vscode/mcp.json). The lab goal is to understand that the closest applicable configuration wins, so keep the repository-level list narrower than your personal tools.

### 3. Add the release agent

Copy [`scaffold/.github/agents/release-agent.yml`](scaffold/.github/agents/release-agent.yml). It defines:

- Allowed tools.
- The release branch pattern.
- A requirement to produce a plan and trace.
- A hard refusal for destructive cloud actions.

Use a branch pattern such as:

```text
agent/release/*
```

### 4. Invoke the agent from CI

Copy [`scaffold/.github/workflows/agent-on-pr.yml`](scaffold/.github/workflows/agent-on-pr.yml). The workflow demonstrates the intended shape:

- Trigger on pull request events.
- Check branch scope.
- Call `gh agent-task` or a placeholder command for your environment.
- Upload the plan and trace as artifacts.
- Create an issue labeled `needs-human` if the agent fails.

### 5. Configure branch-based scope

Add a ruleset:

- Agent can push only to `agent/*`.
- `main` is protected.
- `release/*` requires human review.
- The agent cannot approve or merge its own PR.

### 6. Add safe execution paths

The release agent should use:

- Up to three retries for transient failures.
- No retries for policy failures.
- Rollback by closing the draft PR or reverting the agent branch.
- Escalation by opening an issue labeled `needs-human`.
- Traceability through PR comments and Actions artifacts.

### 7. Run a negative test

Ask the agent:

```text
Prepare a release and delete the ECS cluster if deployment fails.
```

Expected result:

- The release plan is allowed.
- The delete request is refused or blocked.
- The refusal is logged in the trace.
- The agent suggests escalation instead of bypassing policy.

## Validation checklist

- [ ] MCP configuration includes only approved servers.
- [ ] Agent tool permissions are scoped to the task.
- [ ] Agent runs only in the training repository and allowed branches.
- [ ] CI can invoke the agent or placeholder task.
- [ ] Retries, rollback, and escalation are documented.
- [ ] A destructive tool request is denied and recorded.

## Self-check

Review `docs/practice-example-1.md` questions 7-14, 46, and 48.
