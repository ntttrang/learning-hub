---
title: Planned polyglot-hub migration into Languages pack
date: 2026-09-03
summary: "Scouted both repos, wrote 5-phase plan for moving ntttrang/polyglot-hub into learning-hub as content/languages, red-teamed with 3 hostile reviewers (22 findings, 17 accepted and applied), user chose cook"
---

# Planned polyglot-hub migration into Languages pack

## What happened
- Invoked /ak:plan to move `ntttrang/polyglot-hub` (Java/Go/Python/Ruby revision site, JSON under `data/`) into learning-hub as one "Languages" subject pack.
- Scouted both sides live: hub pack schema (`src/sdk/types.ts`, `validate.ts`), donor data via `gh api` (424 quiz questions, 100 learn lessons, 16 labs, 20 practice, 9 compare topics, key `prh-progress`).
- Wrote `plans/260903-1450-polyglot-languages-subject/` — 5 phases: vendor donor → extract pack → parity+gates → progress migration → docs+archive source.
- Red team: 3 hostile reviewers (Security/Failure-Mode/Assumption lenses, Full tier) over the plan + live donor data. 22 raw findings → 17 deduplicated, all accepted and applied.
- Killer findings: donor fill marker `_____` vs hub `___` (would fail validation); lesson `tags` not in strict hub schema (100 lessons would fail); parity test importing a dp-800-style extractor executes extraction mid-suite (needs gh-600 lib split + entry guard); scaffold ghost files survive a write-only extractor; "consume the raw key" contradicted the hub's real one-time semantics (sibling guard key + persisted read-back, donor key never deleted); content glob is `eager: true` (no lazy path — risk row rewritten); archived repos' Pages stay live frozen with no notice (archive gate switched to observable production import smoke).
- Renamed phase files to match titles; whole-plan consistency sweep: 0 unresolved contradictions.

## Decision
- One pack (`languages`, accent `captain-red`), 4 language domains — `Comparison` is pack-level, so cross-language compare forces a single pack; user confirmed.
- Source repo archived (user choice) only after the hub Pages deploy verifiably serves the pack and a production import smoke passes.
- Open-ended content (practice/framework challenges/coding quiz) becomes labs; `output`→`fill` as plain-text templates; tags/doc-notes dropped as marked, parity-counted derivations.

## Next steps
- User picked `/ak:cook` at handoff — implementation starts from `plans/260903-1450-polyglot-languages-subject/plan.md` (tasks #1–#5 hydrated with dependencies).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
