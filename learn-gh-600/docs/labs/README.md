# GH-600 hands-on labs

This lab path turns the GH-600 Agentic AI Developer domains into a practical build. We will use one shared project, `corgi-greeter`, a tiny Go HTTP service that is built in GitHub Actions, published to Docker Hub, and deployed to AWS.

Use the GitHub product path first if you have access to GitHub Copilot coding agent and organization policies. Each lab also includes alternative tools so you can practice the same control pattern in Cursor, Claude Code, LangGraph, CrewAI, or other agent stacks.

## Prerequisites

- A GitHub account and a repository you can administer.
- GitHub Copilot access, ideally with coding agent and custom agent features enabled.
- Docker Hub account and token.
- AWS account with permission to create an OIDC role and deploy one ECS service.
- Local tools: `go`, `docker`, `gh`, and `aws`.
- Optional alternatives: Cursor, Claude Code, promptfoo, Langfuse, Open Policy Agent, CrewAI, AutoGen, or LangGraph.

## Lab sequence

| Lab | Domain | Weight | Outcome |
| --- | --- | --- | --- |
| [Lab 0](lab-00-bootstrap.md) | Bootstrap | Prereq | Create `corgi-greeter`, CI, Docker Hub publishing, and AWS deployment. |
| [Lab 1](lab-01-sdlc-architecture.md) | Prepare agent architecture and SDLC processes | 15-20% | Separate planning from execution and gate agent work with GitHub controls. |
| [Lab 2](lab-02-tools-and-mcp.md) | Implement tool use and environment interaction | 20-25% | Configure MCP servers, permissions, branch scope, retries, rollback, and escalation. |
| [Lab 3](lab-03-memory-and-state.md) | Manage memory, state, and execution | 10-15% | Persist task state across issues, repo instructions, and decision logs. |
| [Lab 4](lab-04-evaluation-and-tuning.md) | Perform evaluation, error analysis, and tuning | 15-20% | Score agent PRs with scans, traces, artifacts, and a tuning loop. |
| [Lab 5](lab-05-multi-agent.md) | Orchestrate multi-agent coordination | 15-20% | Run isolated specialist agents and merge their outputs safely. |
| [Lab 6](lab-06-guardrails.md) | Implement guardrails and accountability | 10-15% | Classify risk, enforce approvals, least privilege, and auditability. |
| [Lab 7](lab-07-capstone.md) | Capstone | All domains | Ship one full agentic change from issue to production deploy. |

## GitHub products and alternatives

| Domain | GitHub path | Alternative tools |
| --- | --- | --- |
| SDLC architecture | Copilot coding agent, Issues, Pull Requests, CODEOWNERS, Rulesets | Cursor Background Agent, Claude Code, Devin, Aider architect mode |
| Tool use and MCP | Copilot custom agents, GitHub MCP, MCP allow lists, agent firewall, fine-grained GitHub Apps | Cursor MCP, Claude Desktop MCP, Continue.dev, `mcp-proxy`, Open Policy Agent |
| Memory and state | Issues, task lists, `AGENTS.md`, `.github/copilot-instructions.md`, Discussions | Cursor rules, `CLAUDE.md`, mem0, LangGraph checkpointers, Letta |
| Evaluation and tuning | GitHub Actions, CodeQL, Dependabot, secret scanning, code scanning, Actions artifacts | promptfoo, DeepEval, OpenAI Evals, Braintrust, Langfuse, Arize Phoenix |
| Multi-agent coordination | Copilot custom agents, Actions matrix jobs, artifacts, concurrency, environments | CrewAI, AutoGen, LangGraph supervisors, Temporal, Inngest |
| Guardrails | Rulesets, environments, required reviewers, OIDC, GitHub Apps, audit log | OPA/Conftest, HashiCorp Sentinel, AWS SCPs, IAM Conditions, Atlantis |

## Repository layout

Copy files from [`scaffold/`](scaffold/) into a training repository when a lab asks for them. Keep this repo as the learning site; use the training repository for live GitHub Actions, Docker Hub, and AWS changes.

```text
docs/labs/
  README.md
  lab-00-bootstrap.md
  lab-01-sdlc-architecture.md
  lab-02-tools-and-mcp.md
  lab-03-memory-and-state.md
  lab-04-evaluation-and-tuning.md
  lab-05-multi-agent.md
  lab-06-guardrails.md
  lab-07-capstone.md
  scaffold/
```

## How to practice

1. Create a fresh GitHub repository named `corgi-greeter-lab`.
2. Start with [Lab 0](lab-00-bootstrap.md) and copy the scaffold into that repository.
3. Work through Labs 1-6 in order.
4. Finish with [Lab 7](lab-07-capstone.md), which combines every domain into one end-to-end change.

## Study-guide anchors

The labs map directly to the official GH-600 study guide objectives:

- Define agent steps, inputs, outputs, success criteria, plan validation, inspectable artifacts, and autonomy levels.
- Configure tools, MCP servers, repositories, branches, CI invocation, error handling, retries, rollback, escalation, and traceability.
- Choose memory strategies, persist state, resume work, and detect context drift.
- Define evaluation signals, classify failures as reasoning/tool/context, and tune instructions, memory, and tool access.
- Coordinate multiple agents with isolation, handoffs, artifacts, conflict handling, recovery, and lifecycle management.
- Apply least privilege, approvals, hard blocks, human-in-the-loop workflows, and accountability.
