# Lab 0: Bootstrap `corgi-greeter`

## Objective

Create the shared Go application used by all GH-600 labs. By the end, you will have a small HTTP service, Docker image publishing to Docker Hub, and an AWS deployment path through GitHub Actions.

## Scenario

`corgi-greeter` is intentionally small so the agentic workflow is the subject of the lab. The service exposes:

- `GET /greet?name=Captain` -> JSON greeting.
- `GET /healthz` -> added later by an agent in Lab 1.
- Container image -> pushed to Docker Hub.
- Deployment -> AWS ECS Fargate using GitHub OIDC.

## GitHub product path

- GitHub repository: system of record.
- GitHub Actions: CI, Docker build, deployment.
- GitHub environments: staging and production gates.
- GitHub OIDC: AWS role assumption without long-lived AWS keys.
- Docker Hub: image registry.
- AWS ECS Fargate: deployment target.

## Alternative tools

- CI: GitLab CI, CircleCI, Jenkins, Buildkite.
- Registry: GitHub Container Registry, Amazon ECR, Google Artifact Registry.
- Deployment: AWS EC2, App Runner, Fly.io, Render, Azure Container Apps.
- Local agent IDE: Cursor, Claude Code, Continue.dev.

## Steps

### 1. Create the training repository

Create a new GitHub repository named `corgi-greeter-lab`. Keep this study repo separate from the training repo because later labs will intentionally exercise permissions, branches, pull requests, and failed agent runs.

### 2. Copy the scaffold

Copy these files from [`scaffold/`](scaffold/) into the root of `corgi-greeter-lab`:

```text
main.go
go.mod
Dockerfile
Makefile
.github/workflows/ci.yml
```

Run locally:

```bash
go test ./...
go run .
curl "http://localhost:8080/greet?name=Captain"
docker build -t corgi-greeter:local .
```

### 3. Configure Docker Hub secrets

In the training repository, add:

| Secret | Purpose |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub user or organization. |
| `DOCKERHUB_TOKEN` | Docker Hub access token with push permission. |

The image name defaults to:

```text
docker.io/${DOCKERHUB_USERNAME}/corgi-greeter:${GITHUB_SHA}
```

### 4. Configure AWS OIDC

Create an IAM role trusted by GitHub OIDC. Scope it to the one repository and the `main` branch.

Trust policy shape:

```json
{
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
    },
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:OWNER/corgi-greeter-lab:ref:refs/heads/main"
    }
  }
}
```

Attach only the ECS permissions needed to register a task definition and update one service. Add repository variables:

| Variable | Example |
| --- | --- |
| `AWS_REGION` | `us-east-1` |
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-corgi-greeter-deploy` |
| `ECS_CLUSTER` | `corgi-greeter` |
| `ECS_SERVICE` | `corgi-greeter-web` |

### 5. Add environments

Create two GitHub environments:

- `staging`: one required reviewer.
- `production`: two required reviewers.

Lab 6 will tighten these gates. For now, you only need them to exist so the workflow can reference them.

### 6. Verify CI/CD

Push to `main` and confirm:

- `go test ./...` passes.
- Docker image builds and pushes.
- AWS credentials are assumed through OIDC.
- ECS service update is attempted or completed.

If AWS is not ready yet, keep the deploy job disabled with `if: false` until you finish the AWS setup, then re-enable it.

## Validation checklist

- [ ] `go test ./...` passes locally.
- [ ] `docker build -t corgi-greeter:local .` succeeds.
- [ ] GitHub Actions CI runs on push and pull request.
- [ ] Docker Hub contains a pushed image.
- [ ] AWS deployment uses OIDC, not stored AWS access keys.
- [ ] `staging` and `production` environments exist.

## Exam practice connection

This lab prepares the environment for every later domain. It also reinforces GH-600 expectations around standard SDLC tooling, GitHub as the control plane, inspectable artifacts, and least-privilege deployment credentials.

Use `docs/practice-example-1.md` after this lab to warm up with baseline questions before moving to Domain 1.
