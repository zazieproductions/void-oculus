# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Canvas search** — debounced substring matching over rendered card text, with
  amber match rings, dimmed click-through non-matches, a live `hits/total`
  counter, `Enter` to frame the match set, and `Ctrl`/`Cmd`-`F` to focus the
  field. The search input previously rendered with no handler bound.
- **Marquee selection** — the selection rectangle now commits, selecting every
  card whose axis-aligned bounding box intersects it. Shift-marquee is additive;
  sub-threshold rectangles are treated as clicks.
- **Group drag** — the whole selection translates as a rigid body, with offsets
  captured once on `pointerdown`.
- **In-place editing** — double-click any of 14 text-bearing regions to edit it.
  The caret lands at the click point; blur or `Escape` commits.
- **Session persistence** — cards, positions, layers, edits, links and viewport
  are stored in `localStorage`, debounced and flushed on `beforeunload`, with
  `⟲ RESET` in the toolbar to discard and rebuild the seeded board.
- **Allowlist sanitiser** — all restored markup is parsed inside an inert
  `<template>` and filtered by a tag allowlist plus attribute deny rules before
  re-entering the DOM.
- **Seed-slot compression** — procedural irises persist as their generation
  parameters rather than their SVG, keeping a full 85-card snapshot near 100 KB.
  Lossless, because generation is deterministic.
- **Touch and pen support** — all interaction migrated to Pointer Events;
  two-finger pinch scales around the gesture midpoint and pans by its travel;
  trackpad pinch is handled as a ctrl-modified wheel with continuous scaling.
- **Reduced-motion support** — `prefers-reduced-motion` stops fiber drift, pupil
  pulse, iris breath, scan lines, sweeps, blinking and the particle field, and
  shortens the boot sequence. Pointer-driven gaze is damped rather than removed.
- **Automated smoke suite** — `tests/smoke.mjs`, 53 assertions in jsdom covering
  board construction, search, marquee, group drag, editing, sanitisation and the
  persistence round trip including corrupt-snapshot recovery.
- **CI verification workflow** — `ci/verify.yml` runs the suite, parses both
  inline script blocks, and fails the build if any external `<script src=…>` is
  added. Staged outside `.github/workflows/` because the authoring account lacks
  GitHub's `workflows` permission; activate with
  `git mv ci/verify.yml .github/workflows/verify.yml`.

### Changed
- Global keyboard shortcuts are suppressed inside text-entry contexts, so typing
  a space or deleting a character can no longer leak into canvas commands.
- `createCard()` now applies its `extraClass` argument, records the card type in
  state, and accepts restore options (`id`, `z`, `silent`).
- Connection ids come from a monotonic counter instead of `Date.now()`, which
  could collide for links created in the same millisecond.
- Deleting a card now updates the link counter in the status bar.
- The ocular engine exports `iris()` and `scanEyes()` alongside `addEyeCard()`;
  cross-engine state is consolidated in a documented `window.VO` namespace.
- Documentation corrected throughout: the particle field, connectors and minimap
  are hand-written, not D3-driven.

### Removed
- The unused D3.js v7.8.5 CDN script tag — the codebase contained no D3 call
  sites. The application now has zero runtime dependencies.
- Five `feGaussianBlur` filter definitions emitted on every connector render and
  referenced by nothing; bloom is drawn as a wide translucent underlay stroke.

### Fixed
- Duplicated cards containing an iris are now adopted by the gaze registry
  instead of inheriting a stale `data-reg` flag and never tracking.
- Pointer gestures have an explicit abandon path, so a second finger or a
  `pointercancel` can no longer leave a drag, pan or marquee half-applied.

---

## [1.0.0] — 2024-XX-XX

### Added
- **Infinite canvas** with pan and zoom (8000×6000px virtual space)
- **Card types**: Sticky notes, code blocks, definition cards, eye nodes
- **Visual linking system** with SVG bezier curves and glow effects
- **Ocular interface**: Animated iris renderer with gaze tracking
- **Particle field**: hand-written 2D ambient background animation
- **Macro iris**: Large decorative iris element visible when zoomed out
- **Minimap**: Spatial navigation aid
- **Context menus**: Right-click operations (duplicate, layer, connect, delete)
- **Boot animation**: Ocular startup sequence
- **Scan-line effects**: CRT-style visual overlay
- **Status bar**: Real-time position, zoom, and entity counts
- **Responsive toolbar**: Adapts to screen size
- **GitHub Actions workflow**: Automatic GitHub Pages deployment
- **Multi-card selection**: Shift-click for additive selection
- **Selection box**: Drag to select multiple cards
- **Pupil dilation**: Reactive to zoom level
- **Blink animation**: Periodic eye blinking with cascade wave effect
