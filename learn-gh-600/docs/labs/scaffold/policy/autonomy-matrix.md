# Autonomy matrix

Use this table to decide which actions an agent may perform automatically and which require a human gate.

Rule: if any risk column routes upward, use the highest gate.

| Action | Operational risk | Security risk | Compliance risk | Gate | Evidence |
| --- | --- | --- | --- | --- | --- |
| Format docs | Low | Low | Low | Auto | PR diff |
| Add unit tests | Low | Low | Low | Auto | CI log |
| Edit Go handler | Medium | Low | Low | PR review | Tests and plan |
| Change Dockerfile | Medium | Medium | Low | CODEOWNER review | Image scan |
| Open release PR | Medium | Low | Low | Auto with trace | PR and artifact |
| Deploy staging | Medium | Medium | Low | 1 reviewer | Environment approval |
| Deploy production | High | Medium | Medium | 2 reviewers | Deployment log |
| Change IAM role | High | High | High | Security approval | Policy diff |
| Delete ECS cluster | High | High | Medium | Hard block | Blocked trace |
| Disable CI or scans | High | High | Medium | Hard block | Ruleset event |

## Required response when blocked

1. Stop the action.
2. Record the blocked command or tool call.
3. Explain which policy row blocked it.
4. Open or update an issue labeled `needs-human`.
