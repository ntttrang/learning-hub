# Lab 6: Domain 6 - Implement guardrails and accountability

## Objective

Practice classifying autonomy levels, enforcing human-in-the-loop workflows, blocking policy violations, scoping permissions, and preserving accountability.

## Scenario

The release agent can build and deploy `corgi-greeter`. Now you will decide which actions can run automatically, which need approval, and which must be blocked.

## Domain objectives

- Classify actions by operational, security, and compliance risk.
- Assign autonomy levels that preserve speed and compliance.
- Identify actions that require human judgment.
- Block actions that violate policy.
- Enforce least-privilege execution context.
- Require authorization for irreversible or sensitive changes.
- Avoid approvals that do not materially reduce risk.

## GitHub product path

- Rulesets and protected branches.
- Environments and required reviewers.
- GitHub Apps or fine-grained tokens.
- GitHub OIDC for AWS.
- Secret scanning, push protection, and dependency review.
- Audit log and co-author attribution.

## Alternative tools

- OPA/Conftest for policy checks in CI.
- HashiCorp Sentinel for Terraform policy.
- AWS SCPs and IAM Conditions.
- Atlantis or Spacelift for infrastructure approvals.
- CloudTrail for cloud audit trails.

## Steps

### 1. Build the autonomy matrix

Copy [`scaffold/policy/autonomy-matrix.md`](scaffold/policy/autonomy-matrix.md). Use this rule: if operational, security, or compliance risk is high, the action routes to the highest required gate.

Example:

| Action | Operational | Security | Compliance | Gate |
| --- | --- | --- | --- | --- |
| Format markdown | Low | Low | Low | Auto |
| Open PR | Medium | Low | Low | Auto with trace |
| Deploy staging | Medium | Medium | Low | 1 reviewer |
| Deploy production | High | Medium | Medium | 2 reviewers |
| Delete ECS cluster | High | High | Medium | Hard block |

### 2. Configure GitHub environments

Set:

- `staging`: one required reviewer.
- `production`: two required reviewers, deployment branch limited to `main`.

The agent can prepare the deployment, but the environment gate controls execution.

### 3. Protect branches

Create a ruleset for `main`:

- No direct pushes.
- Require pull request.
- Require CODEOWNER review.
- Require CI.
- Require deployment approval before production release.

Create a ruleset for `agent/*`:

- Allow agent pushes.
- Require eventual PR into protected branch.
- Do not allow the agent to merge its own PR.

### 4. Enforce least privilege

Use a GitHub App or fine-grained token with only:

```text
contents:read
contents:write
pull_requests:write
issues:write
checks:read
```

Do not grant `actions:write` unless the lab specifically tests workflow changes under review.

AWS role should only allow:

- `ecs:RegisterTaskDefinition`
- `ecs:UpdateService`
- Read actions needed to check the cluster and service

Scope resources to one cluster and service.

### 5. Enable security guardrails

Enable:

- Secret scanning.
- Push protection.
- Dependency review.
- CodeQL.
- Dependabot alerts and updates.

Add a negative test by trying to commit a fake secret. The push should be blocked before it reaches the repository.

### 6. Verify accountability

Every agent action should be attributable:

- Commit author or co-author identifies the agent.
- Pull request links to the source issue.
- Actions logs identify the workflow run.
- Deployment events identify the environment approval.
- Sensitive incident notes go to a private security process, not public PR comments.

### 7. Run blocked-action tests

Ask the agent to:

```text
Push directly to main and deploy production without review.
```

Expected result:

- Branch rules block direct push.
- Environment gate blocks deployment.
- Agent records the failure and opens a `needs-human` issue.

## Validation checklist

- [ ] Autonomy matrix covers operational, security, and compliance risk.
- [ ] Production deploy requires explicit approval.
- [ ] Direct push to `main` is blocked.
- [ ] Agent permissions are least privilege.
- [ ] Destructive actions are hard-blocked.
- [ ] Audit trail links issue, PR, workflow, deployment, and actor.

## Self-check

Review `docs/practice-example-1.md` questions 35-42, 44-45, and 49-50.
