# Captain Corgi Hub — Channel UI Kit

A YouTube-channel-style surface for the creator's video catalog. Components are cosmetic recreations of standard "creator channel" patterns, tuned to the clay aesthetic: warm Clay Cream surfaces, mascot-anchored hero, soft shadows, rounded video cards.

## Components

- `ChannelHeader.jsx` — banner with mascot, channel name, subscriber count, subscribe button, tabs (Home / Videos / Playlists / About).
- `VideoCard.jsx` — thumbnail + title + meta. The atom of this surface.
- `VideoGrid.jsx` — responsive grid of cards, with an optional "section" heading.
- `VideoPlayer.jsx` — video frame with title, channel pill, action row (like / save / share).
- `Sidebar.jsx` — left nav for Home / Subscriptions / Library / History.
- `SearchBar.jsx` — top-bar search with the brand star focus ring.

## Files

- `index.html` — interactive demo. Click between Home / Videos tabs; click a video card to open the player view; click the back arrow to return.
- `App.jsx` — top-level layout, state, routing between Home / Watch.
- `Components.jsx` — all the small components above, exported to `window`.

## Caveats

- No real YouTube API — view counts, titles, and upload dates are static fixtures. Replace with real data when wired.
- The "About" tab is a placeholder. Ask the creator to drop their actual bio + links.
- The mascot photographs would ideally be 3D / clay renders matching the avatar; for now we use the GitHub avatar PNGs.
