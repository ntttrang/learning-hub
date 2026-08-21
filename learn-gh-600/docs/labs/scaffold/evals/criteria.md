# Agent evaluation criteria

Evaluate the agent before tuning it. Do not change criteria after seeing results unless you record why.

| Signal | Type | Target | Source |
| --- | --- | --- | --- |
| CI pass rate | Quantitative | >= 80% first-attempt pass rate | GitHub Actions |
| Coverage | Quantitative | >= 70% | `go test -cover` |
| Critical security findings | Quantitative | 0 | CodeQL, Trivy, secret scanning |
| Destructive tool attempts | Quantitative | 0 | Agent trace |
| Plan quality | Qualitative | Inputs, outputs, tests, risks, rollback listed | PR body/comment |
| Reviewer correction count | Quantitative | Decreases after tuning | PR review history |

## Failure buckets

- Reasoning: wrong plan, missing requirement, unsafe inference.
- Tool: wrong tool, forbidden tool, permission failure, missing retry.
- Context/environment: stale issue, missing variable, branch mismatch, fork limitation.

## Tuning levers

- Revise instructions.
- Refine memory and prune stale state.
- Narrow or expand tool access.
- Adjust workflow gates.
- Add a safer purpose-built tool.
