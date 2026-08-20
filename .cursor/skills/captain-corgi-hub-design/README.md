# Captain Corgi Hub — Design System

A warm, clay-textured visual identity for **Captain Corgi Hub**, a YouTube channel and creator-collective covering **software engineering, AI, and tech**. The mascot — a clay-sculpted corgi captain in a red cap with a yellow star — anchors everything: friendly, hand-crafted, knowledgeable, and just a little bit playful.

This design system lives at the intersection of *developer-tools serious* and *children's-stop-motion warm*. Think tech tutorials hosted by a tiny clay sea-captain who happens to know Kubernetes.

---

## Sources

| Source | URL |
| --- | --- |
| Creator GitHub | https://github.com/captain-corgi |
| Creator avatar (personal mascot) | https://avatars.githubusercontent.com/u/32241401?v=4 |
| Organization GitHub | https://github.com/captain-corgi-hub |
| Organization avatar (hub mascot) | https://avatars.githubusercontent.com/u/181454343?s=400&u=ece13348fdf8e25f7f1fe00cfc5708b549184eb7&v=4 |
| YouTube channel | (not yet provided — ask the user) |

**The mascot avatars are the source of truth for the entire visual identity.** Color tokens were sampled directly from them; the clay/plasticine surface treatment drives all material decisions.

---

## At a Glance

- **Mascots**: Captain Corgi (solo, cyan uniform) + the Hub crew (green uniform, coral backdrop).
- **Material language**: Soft clay, matte finishes, gentle highlights, finger-pressed contours. *Never glassy, never neon, never gradient-y in the "AI startup" sense.*
- **Color**: Warm and saturated — Corgi Orange, Captain's Red, Star Yellow against Deep Teal and Hub Coral.
- **Tone**: First-mate-to-crew. "We're going to figure this out together." Curious, generous, technically precise.
- **Typography**: Bricolage Grotesque (display, friendly + variable), Nunito (body, rounded), JetBrains Mono (code).

---

## Index — what's in this folder

```
README.md                  ← you are here
SKILL.md                   ← Claude Code / Agent Skills entry-point
colors_and_type.css        ← all CSS variables (color + type, base + semantic)
fonts/                     ← (Google Fonts loaded via CDN; see colors_and_type.css)
assets/                    ← logos, mascot avatars, icons
preview/                   ← small HTML cards that populate the Design System tab
ui_kits/
  channel/                 ← YouTube-channel-style UI (video cards, header, player chrome)
  hub/                     ← Hub site / project-collective UI (project cards, member grid, posts)
slides/                    ← Video-intro / title-card / code-walkthrough slide templates
```

---

## Content Fundamentals

### Voice — "Captain to crew"

The mascot is a captain; the audience is the crew. Copy speaks **with** the viewer, never down to them. The captain has clearly done this before, but is excited to do it again with you.

- **First-person plural by default.** "Let's wire up the API." "We'll start simple and build up."
- Second-person ("you") is fine for direct calls to action — "*you're going to want to commit before you run this*".
- Avoid "I" except in personal asides ("I got bitten by this one last week"). The captain leads the ship; the ship matters more than the captain.

### Tone

- **Warm, curious, slightly stop-motion.** Treat tech topics with the patience of someone explaining how a clock works to a kid — but never dumb things down.
- **Plain over jargon, but never afraid of jargon.** Say "race condition" if it's a race condition, then explain it.
- **Optimistic about complexity.** "This part looks gnarly, but it's actually three small ideas stacked."
- Never snarky about other tools/people. Captain Corgi is *generous*.

### Casing

- **Sentence case for titles, headings, and buttons.** "Getting started with vector databases", not "Getting Started With Vector Databases".
- **Acronyms keep their casing.** API, AI, LLM, REST.
- Code identifiers in `mono` — *always*. Even in body copy: "set the `OPENAI_API_KEY` env var".

### Punctuation

- Em-dashes (—) are fine and encouraged — they match the conversational rhythm.
- Oxford commas, yes.
- One exclamation mark per page, max. The mascot is excited; the copy doesn't need to be.

### Emoji & symbols

- **Not in UI chrome.** No emoji in buttons, nav, headings.
- **OK in social/community contexts** sparingly — a 🐕 in a tweet, a ⭐ in a tip card, an anchor ⚓ in a "let's set sail" intro. Curated, never sprinkled.
- Prefer the **yellow star** (a mascot motif) over a generic emoji star wherever a star is needed in UI.

### Examples

> ✅ "Today we're shipping a tiny RAG pipeline. We'll start with embeddings, then bolt on retrieval."
>
> ✅ "Heads up — `langchain` shifted its imports in v0.2. We'll use the new path."
>
> ❌ "🚀 Let's BUILD the FUTURE of AI! 🤖✨"
>
> ❌ "In this comprehensive tutorial, the reader will learn..."

---

## Visual Foundations

### Material — *the clay rule*

Everything on screen wants to look like it could have been pressed out of polymer clay. That means:

- **Matte surfaces.** No gloss, no specular highlights, no glass. Backgrounds are flat or very gently shaded.
- **Soft, generous corner radii** on everything — 12, 16, 20, 28 px. Sharp 90° corners only for code blocks and tables.
- **Subtle, warm shadows.** Slightly orange-tinted, never grey. Short distance, soft blur, low opacity. Shadows feel like a tabletop lamp, not a CSS reset.
- **No gradients in UI chrome.** The only acceptable "gradient" is the painterly bg behind the mascot in product hero shots.

### Color

Sampled from the two avatars. Full tokens in `colors_and_type.css`. Highlights:

- **Corgi Orange `#FC8903`** — the primary brand colour. The fur. Use sparingly and confidently — buttons, highlights, the cap rim.
- **Captain's Red `#E13429`** — the hat. Use for accents, badges, errors, the "subscribe" pulse.
- **Star Yellow `#FBC00A`** — the star. Use for highlights, tooltips, hover states, "new" pips.
- **Deep Teal `#3D768E`** — the personal-avatar background. Default page background option #1 (cooler).
- **Hub Coral `#DD5D5D`** — the org-avatar background. Default page background option #2 (warmer). Use for "Hub" / community surfaces specifically.
- **Hub Green `#3BB283`** — the org uniform. Use for success, "live" indicators, growth.
- **Sky Cyan `#51BBD7`** — the captain's uniform. Use for links, info, calm CTAs.
- **Petal Pink `#F2A8BC`** — soft clay pink. The feminine / younger-skewing accent — community surfaces, kids' content, "crewmate" pills. Pairs nicely with Star Yellow. (`#FBD9E2` = Petal Soft, the lightest tint, for backgrounds.)
- **Clay Cream `#F6F2EA`** — paper. Default light surface. Has a hint of yellow — *never* pure white.
- **Ink `#1F2A33`** — body text on light. A very dark navy, not black. Pairs with deep teal.

### Typography

- **Display — Bricolage Grotesque** (variable, weights 500–800). Friendly, slightly condensed, modern without being sterile. Used for h1/h2/h3 and big numbers.
- **Body — Nunito** (weights 400/600/700). Rounded terminals echo the clay aesthetic; great at small sizes.
- **Mono — JetBrains Mono** (weights 400/600). Programmer-favourite, ligatures on for `=>`, `!=` etc. Used for inline code, blocks, and any "terminal voice" UI.

A modular scale of 1.25 (major third) drives sizes — see `colors_and_type.css`.

### Backgrounds

- **Light surface** = Clay Cream. The default.
- **Dark surface** = Deep Teal (#3D768E) or near-black ink (#1F2A33). Both work; teal feels more "on-brand", ink feels more "developer terminal".
- **Hero / hub surface** = Hub Coral, used for community + "playlist" areas.
- No noise textures, no grids, no dot-patterns. Surfaces are flat. Visual interest comes from the mascot + photography + typography, not from the background.
- Optional: a **single, large, soft radial glow** behind a mascot is acceptable — same colour as the surface, ~30% lighter, ~80% width.

### Imagery & illustration

- The **mascot photographs / 3D renders** are the primary illustration system. Treat them like products — give them air, don't crop tight to the head.
- Secondary illustrations should be **claymation-adjacent**: matte, hand-crafted, slightly imperfect.
- Stock photography is **avoided** in marketing surfaces. If a screenshot is needed (UI demo, code editor), frame it in a soft-cornered card with a thin Clay Cream border.

### Animation

- **Soft, organic easing.** `cubic-bezier(0.34, 1.56, 0.64, 1)` for entrances (a tiny overshoot — like clay flexing). `cubic-bezier(0.22, 1, 0.36, 1)` for exits.
- **Durations: 180ms for hovers, 240ms for state changes, 380ms for entrances.** Nothing faster than 120ms (jarring); nothing slower than 600ms (lethargic).
- **Bounces are okay, in moderation.** A button can grow 4% on press-release. The captain's hat can wiggle on page load.
- No parallax. No spinning loaders if a clay-corgi-walking placeholder fits.

### Themes — Light, Dark, Deep Night

The system ships **three** themes. They share the same semantic variable names (`--bg`, `--fg`, `--accent`, etc.) so any component built against the tokens adapts automatically.

- **Light** *(default)* — Clay Cream paper + Ink text. Daylight, friendly, brand-forward. The avatars look most at home here.
- **Dark** — Warm-tinted near-black (`#161D24` — note the subtle teal cast, not slate). Cream text (`#ECE2D0`, never pure white). Brand accents stay vivid; shadows go pure black instead of red-tinted (red on dark muddies). Lifted danger red and cyan link for legibility.
- **Deep Night** — A *low-blue-light* amber-on-near-black mode for 2am reading. Background `#15100A` (deep warm brown-black), foreground `#C9A878` (warm amber). **All** cool accents are pulled warm: cyan → bronze, green → muted bronze, red → burnt sienna. Shadows nearly invisible. Inspired by f.lux / Kindle Paperwhite warm light. Use this when you're reading docs at midnight and want your eyes to survive.

**How to switch:**
- Set `data-theme="light"`, `data-theme="dark"`, or `data-theme="night"` on `<html>` to force a theme.
- **Auto mode** = omit the `data-theme` attribute entirely. The system honors `prefers-color-scheme` (Light by default, Dark if the OS asks) and live-updates when the OS flips.
- Persist user choice in `localStorage` under the key `cc-theme` (values: `light` / `dark` / `night`). **Auto** is represented by the *absence* of the key — clearing `cc-theme` is how you go back to "follow system".
- A drop-in toggle is shipped at `assets/theme-toggle.html` with four modes — **Auto / Light / Dark / Night**. Copy its `<style>`, markup, and `<script>` block into any page. In Auto, an inset accent ring on Light or Dark shows which one the OS is currently resolving to.
- The Channel and Hub UI kits already include the toggle in the bottom-right corner.

### Hover & press states

- **Hover (buttons/cards):** lift 2px with a slightly larger, slightly warmer shadow. *No* colour shift on primary buttons — the colour is already the brand.
- **Hover (links):** underline thickens from 1px to 2px; colour stays.
- **Press:** scale to 0.97, shadow collapses, 80ms. Springs back on release.
- **Focus ring:** Star Yellow, 3px, 4px offset, never inset.

### Borders, shadows, radii

- **Borders**: 1.5px (note: not 1px or 2px — 1.5px is the clay-line weight), colour `--border` which is a 6%-tinted version of the surface ink.
- **Outer shadows** — three steps:
  - `--shadow-1`: `0 1px 2px rgba(31,42,51,.06), 0 1px 1px rgba(31,42,51,.04)` (resting)
  - `--shadow-2`: `0 6px 14px rgba(225,52,41,.08), 0 2px 4px rgba(31,42,51,.06)` (raised — note warm red tint)
  - `--shadow-3`: `0 16px 32px rgba(225,52,41,.10), 0 4px 8px rgba(31,42,51,.08)` (floating)
- **Inner shadows**: only on inputs in focus state — a 1px inset of Star Yellow at 30% opacity. Otherwise avoided.
- **Radii**: `--r-sm 8px`, `--r-md 12px`, `--r-lg 20px`, `--r-xl 28px`, `--r-full 999px`. Buttons → lg. Cards → lg. Avatars/badges → full.

### Cards

A card is **Clay Cream surface + 1.5px border in `--border-soft` + `--r-lg` radius + `--shadow-1` resting / `--shadow-2` hover**. Padding `--space-5` (24px) on desktop, `--space-4` (16px) on mobile.

### Transparency & blur

- **Transparency is rare.** The clay aesthetic implies *physical* surfaces — they don't see through.
- **Acceptable**: a 12% black overlay on top of the mascot photo when text needs to sit over it; a 60% Clay Cream backdrop for a sticky nav.
- **Backdrop-filter blur**: only on sticky chrome (nav, tab bars). 12px blur, never more. Never on cards.

### Layout

- 12-column grid, 1280px max content width, 24px gutters on desktop.
- Generous vertical rhythm: 96px+ between major sections on marketing pages, 32px in app UI.
- **One hero element per screen.** The mascot, the title, or the video — not all three at once.

---

## Mascot Usage

- The mascot is **always full-colour, never silhouetted, never tinted**. If you need a mono mark, use the wordmark instead.
- Minimum size: 32px square (favicon territory). Below that, simplify to the **yellow star** alone.
- Captain Corgi (cyan uniform) = personal / creator-voice surfaces. Hub crew (green uniform, coral bg) = community / org / multi-author surfaces.
- Never put the mascot on a saturated background that clashes with the cap. Safe backgrounds: Clay Cream, Deep Teal, Hub Coral, Ink, Hub Green, Sky Cyan. *Not* Star Yellow (cap disappears) or pure white (loses warmth).

---

## Iconography

See `assets/icons/` and the ICONOGRAPHY section below for full details.

- **Primary set: Lucide Icons** (CDN). Stroke-based, 1.75px stroke, rounded line caps. Picked because the rounded caps echo the clay corners. Used everywhere in UI chrome.
- **Brand symbol: ⭐ the Yellow Star** — drawn as an SVG asset, used as the favicon-fallback, list-bullet, and "tip" callout marker.
- **Emoji**: prohibited in product UI. See Content Fundamentals.
- **PNG raster icons**: avoided. Everything is SVG.
- If a needed icon isn't in Lucide, we fall back to **Tabler Icons** (also stroke-based, compatible weights) before drawing one custom.

---

## Index of files (manifest)

| File | What it is |
| --- | --- |
| `README.md` | This document — start here. |
| `SKILL.md` | Skill front-matter for Claude Code / Agent Skills compatibility. |
| `colors_and_type.css` | All design tokens — colors, type, spacing, radii, shadows, semantic styles. |
| `assets/captain-corgi-avatar.png` | Personal mascot, sampled for primary colours. |
| `assets/captain-corgi-hub-avatar.png` | Hub mascot, sampled for secondary colours. |
| `assets/icons/star.svg` | The brand star. |
| `assets/icons/logo-wordmark.svg` | Text wordmark "Captain Corgi Hub". |
| `preview/*.html` | Small cards that render in the Design System tab. |
| `ui_kits/channel/` | YouTube-channel-style UI kit (video cards, channel header, player chrome). |
| `ui_kits/hub/` | Hub / community site UI kit (project cards, member grid, blog posts). |
| `slides/` | Title slide, code-walkthrough slide, comparison slide, end-card slide. |

---

## Caveats

- **Font files: using Google Fonts via CDN**, not local TTFs. If you ship to a context without internet, replace with self-hosted copies. The picks (Bricolage Grotesque, Nunito, JetBrains Mono) are *substitutes* chosen for clay-friendliness — happy to swap if the creator has preferred fonts.
- **No real product to copy yet** — UI kits are extrapolated from the mascot identity and typical YouTube-creator / dev-content surfaces. **Open question for the creator**: do you have an existing site, intro card, or video lower-third I should match instead?
- **Mascot images are GitHub avatars** (460 × 460 / 400 × 400). For production work you'll want higher-res 3D/clay renders. Ideally several poses (waving, pointing, surprised, thumbs-up) for richer expression.
- **All UI icons are inline Lucide-style SVG**, not the official package. If you want the real Lucide font/sprite, install it.
- **The clay anchor** is a hand-built SVG to match the star — flag for review if it doesn't feel right next to the mascot.
- **Other crew members** (`first-mate`, `code-cook`, etc.) in the Hub UI kit are placeholders — replace with real handles + 3D renders when the crew is named.
