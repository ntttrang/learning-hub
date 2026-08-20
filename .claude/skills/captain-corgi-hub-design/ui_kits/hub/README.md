# Captain Corgi Hub — Hub UI Kit

The community / organisation surface. Where the **Hub crew** mascot lives. This is the site at `captain-corgi-hub.dev` (placeholder) — the place that links videos to the open-source projects, blog posts, and contributors that orbit them.

Default surface is **Hub Coral** (`#DD5D5D`) in the hero, transitioning to **Clay Cream** below the fold. The aesthetic is community-warm: rounded, photographic, hand-crafted.

## Components

- `HubHero.jsx` — coral banner with the hub mascot, tagline, and primary CTAs.
- `ProjectCard.jsx` — open-source project card with stars, language pill, and "watch the video" deep-link.
- `BlogCard.jsx` — long-form post preview.
- `MemberGrid.jsx` — contributor mosaic.
- `HubNav.jsx` — top nav for Projects / Blog / Crew / Videos.

## Files

- `index.html` — landing-page demo. Scrollable.
- `Components.jsx` — the components above, exported to `window`.
- `App.jsx` — page composition.

## Caveats

- Project names + contributor handles are placeholders. Ask the captain for the real ones.
- We assume a future "hub site" — there isn't a live URL yet.
