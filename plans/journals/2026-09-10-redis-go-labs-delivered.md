---
title: "Redis Go labs delivered: rc-dev-go domain + 8 go-redis v9 labs"
date: 2026-09-10
summary: "Plan 260908-2104 executed via cook: 8 lab-go-* labs + rc-dev-go domain in 11 per-write commits (538 insertions, zero deletions), compile-first + live-verified authoring, review PASS_WITH_MINORS with both defects fixed; all gates green, plan closed"
---

# Redis Go labs delivered: rc-dev-go domain + 8 go-redis v9 labs

## What happened
Cook executed plans/260908-2104-redis-go-labs/ on `feat/redis-pack`: `rc-dev-go`
domain (order 20, cert-less, no weight/tracks) + 8 labs — structures tour,
cache-aside with stampede control, distributed locks, rate limiting (fixed +
sliding), streams consumer groups, pub/sub, pipelining/transactions, keyspace
notifications — appended to `content/redis/labs.json` (now 17 labs), plus the
README packs-row clause. 11 per-write conventional commits, zero-deletion diffs
throughout; original 9 labs byte-identical.

Authoring loop that held up: delegated subagents, compile-first (assemble one
runnable main.go, `go build`+`go vet` against go-redis v9.22.0, then split into
step fences), most labs additionally live-run against the local server so every
`expectedOutput` is captured reality. Count/id assertions after every write;
full four-command gate at each phase end.

The output-corruption mode hit three lab subagents mid-generation (labs 6-8);
the chunked-parts-plus-assembler defense (part files + asserting assembler, Go
fences extracted mechanically from the compiled main.go) caught every instance —
none reached the repo. Memory updated accordingly.

Code review (PASS_WITH_MINORS): caught lab 8 missing its `enableEvents`
definition fence (dropped during fence-splitting; scratch program had it —
restored byte-exact, fence-assembly re-verified green) and lab 1 step-3
expectedOutput label (`no countdown:` → `name:`). Both fixed and committed.
Lows left as intentional: lab 2's staged defer (acknowledged in-lab), lab 3's
duplicated anchor line (prose-anchored).

Authoring also discovered three API facts now recorded in the researcher
report: blocked-empty XReadGroup answers `redis.Nil`; ReceiveMessage ctx
deadline surfaces as raw `i/o timeout`; Redis canonicalizes
`notify-keyspace-events` "Ex" → read-back "xE".

## Decision
- Per-write commits over phase commits (red-team finding 3) — made single-write
  rollback true; kept through delivery.
- Compile-first + live-run verification went beyond the plan's minimum and paid
  for itself repeatedly (two API facts, one design flaw in lab 4's rerun path).
- Plan closed as `completed`; the 0%-row suggestion routed as a handoff note in
  plan 260821-1457's plan.md per the pre-decided response.

## Next steps
- `feat/redis-pack` merge-hold is now liftable (phase 3 closed, all 8 labs in) —
  merge timing is the user's call; README sentence is shared surface with plan
  260903-1450 (whoever lands second re-verifies the packs sentence).
- Plan/report/journal files are untracked — commit at user's preference.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
