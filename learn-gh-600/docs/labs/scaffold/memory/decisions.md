# Agent decision log

Record durable decisions that future agent runs must honor. Do not use this file for temporary chat notes.

| Date | Issue/PR | Decision | Reason | Expires |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD | #1 | Keep `/greet?name=` as a fallback during migration | Avoid breaking existing clients | After migration cleanup issue closes |

## Rules

- Add one row per durable decision.
- Link the issue or PR that approved the decision.
- Set an expiration or review point when the decision is temporary.
- Remove stale decisions through a reviewed pull request.
