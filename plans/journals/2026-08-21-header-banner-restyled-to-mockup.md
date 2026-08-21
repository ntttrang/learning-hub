# Header banner restyled to the mockup design — 2026-08-21

## Context

User supplied a reference image and asked for the header banner to match.
The same design was already encoded in their uncommitted edit to
`mockups/learning-hub-mockup.html` (topbar section + theme toggle rewrite),
so the mockup diff was the accepted design source, not a fresh decision.

## Change

Topbar recomposed to the mockup: crumb and topbar profile chip removed
(profile stays in the rail foot), search field widened (max 540→720px,
sunken, r-md), streak converted from a text pill to a 38px icon button with
an accent flame and a danger count badge, theme switcher converted from a
collapse-on-hover segmented pill to four always-visible icon buttons
(monitor / sun / moon / cup; active fills accent and morphs round, auto's
OS-resolved mode gets an inset ring).

- `src/shell/AppShell.tsx` — drop crumb + profile chip; streak badge markup.
- `src/shell/ThemeToggle.tsx` — icon-only buttons (`ibtn`), `aria-label`
  keeps accessible names so existing tests hold; size 13→18.
- `src/styles/app.css` — shared `.ibtn` + `.cnt` (streak + theme quartet);
  remove crumb / streak-pill / profile-chip rules; media-query cleanup
  (kbd hides ≤900px, ibtn shrinks to 34px ≤560px).
- `src/styles/theme-toggle.css` — collapse/expand machinery deleted; group
  layout + svg stroke contract only.
- `src/shell/AppShell.test.tsx` — breadcrumb test removed with the feature.
- `src/App.test.tsx` — smoke assertion moved from `.crumb` to the rail
  "Hub home" link (regression caught by full-suite run).

## Verification

Focused shell tests 19/19; full suite 541/541; `tsc --noEmit`, `vite build`,
`oxlint` clean; no orphaned selector references
(`streak-days|streak-label|cc-theme-label|profile-chip|.crumb`).

## Notes

Badge uses `--danger`/`--danger-fg` per mockup's `--danger` with theme-correct
foreground. Buttons rely on the global `:focus-visible` ring in tokens.css.
