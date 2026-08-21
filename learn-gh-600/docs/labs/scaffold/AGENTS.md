# Agent guide for `corgi-greeter`

This repository is a GH-600 training project. Agents should optimize for traceable, reviewable SDLC work rather than speed alone.

## Scope

- Application code is a small Go HTTP service.
- CI/CD uses GitHub Actions.
- Images publish to Docker Hub.
- Deployment targets AWS ECS Fargate through GitHub OIDC.

## Workflow

1. Start from a GitHub Issue.
2. Produce a structured plan.
3. Wait for plan approval.
4. Work in `agent/*` branches.
5. Open a pull request.
6. Attach test, scan, and trace evidence.
7. Escalate if a policy blocks progress.

## Do not

- Push directly to `main`.
- Store credentials in files, prompts, or logs.
- Delete cloud resources.
- Broaden permissions without human approval.
- Ignore stale issue state or previous decisions.

## Shared memory

Use `memory/decisions.md` for durable decisions. Use issue checklists for task progress. Treat old chat history as non-authoritative unless it is reflected in an issue, PR, or committed file.
