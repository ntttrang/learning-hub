---
name: captain-corgi-hub-design
description: Use this skill to generate well-branded interfaces and assets for Captain Corgi Hub, a YouTube channel + open-source community about software, AI, and tech. The brand is anchored by a clay-style corgi captain mascot — warm, hand-crafted, friendly. Use for production interfaces, slide decks, video title cards, thumbnails, blog posts, social cards, or throwaway prototypes.
user-invocable: true
---

# Captain Corgi Hub — Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts *or* production code, depending on the need.

## The shortest version of the brand

- **Mascot**: a clay corgi captain — red hat, yellow star, orange fur, cyan/teal uniform.
- **Voice**: captain-to-crew. First-person plural ("we'll figure it out"), sentence case, technically precise but generous.
- **Material**: matte clay everything — soft rounded corners, warm red-tinted shadows, no gradients in chrome.
- **Color**: Corgi Orange `#FC8903`, Captain's Red `#E13429`, Star Yellow `#FBC00A`, Sky Cyan `#51BBD7`, Hub Green `#3BB283`, Hub Coral `#DD5D5D`, Deep Teal `#3D768E`, Petal Pink `#F2A8BC`, Clay Cream `#F6F2EA`, Ink `#1F2A33`.
- **Type**: Bricolage Grotesque (display), Nunito (body), JetBrains Mono (code).
- **Tokens**: `colors_and_type.css` — drop it in and use the CSS vars.
- **Don't**: emoji-spam, neon gradients, glass morphism, generic stock photography, Inter / Roboto.

## File map

| File | What it is |
| --- | --- |
| `README.md` | Full brand book — voice, foundations, color, type, motion, iconography, components. **Start here.** |
| `colors_and_type.css` | All design tokens as CSS variables. Import into any HTML you make. |
| `assets/captain-corgi-avatar.png` | Personal mascot photo. |
| `assets/captain-corgi-hub-avatar.png` | Hub crew mascot photo. |
| `assets/icons/star.svg` | The brand star — clay-style, with shadow + highlights. |
| `assets/icons/logo-wordmark.svg` | Wordmark with star + "Captain Corgi / HUB". |
| `assets/icons/anchor.svg` | Secondary brand mark — clay anchor. |
| `preview/*.html` | Reference cards: color swatches, type specimens, components. |
| `ui_kits/channel/` | YouTube-channel UI (header, video grid, watch). React components. |
| `ui_kits/hub/` | Community/org site (hero, projects, blog, crew). React components. |
| `slides/` | 1280×720 slide templates: title, code, comparison, big-quote, end-card, lower-third. |

## How to use these for new work

- **For a slide deck**: start from `slides/TitleSlide.html` and adapt — already wired up with tokens, fonts, mascot. The `<deck-stage>` starter component is the right way to scale and navigate.
- **For a new web page**: copy `colors_and_type.css` into your project, set `<body class="cc-body">`, and use the semantic classes (`.h1`, `.lead`, `.code`) or compose your own with the CSS vars.
- **For a video thumbnail**: a 1280×720 frame, big Bricolage display number/title (≥ 64 px), Star Yellow accent pill, Deep Teal or Hub Coral background, the mascot bottom-left or top-right.
- **For social cards**: 1200×630 — same rules as slides but tighter.

## Mascot rules

- Always full-colour, never silhouetted, never tinted.
- Minimum 32 px square. Below that, use the star alone.
- Captain Corgi (cyan) = personal / creator voice. Hub crew (green/coral) = community / org / multi-author.
- Safe backgrounds: Clay Cream, Deep Teal, Hub Coral, Ink, Hub Green, Sky Cyan. Avoid pure white and Star Yellow (the cap disappears).

## When in doubt

- Use existing tokens. Don't invent new colors.
- Pick Lucide icons (1.75 px stroke, rounded caps) — they match the clay line weight.
- Soft, slightly-overshoot easing on entrances (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- Sentence case everywhere. One exclamation mark per page, max.
- If you can't find an asset, ask the captain rather than drawing a placeholder SVG yourself.
