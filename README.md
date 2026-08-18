# VOID//OCULUS

**A spatial thinking surface that looks back at you.**

An infinite, pan-and-zoom knowledge canvas rendered entirely by the browser — no build step, no bundler, no server, and zero runtime dependencies. One HTML file, three coordinate spaces, and a procedural ocular engine that draws every eye on the board from a single deterministic function.

[![License: MIT](https://img.shields.io/badge/license-MIT-3a3a40)](./LICENSE.md)
[![Build: none](https://img.shields.io/badge/build-none%20required-00cc7a)](#quick-start)
[![Deploy: GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-7b4fff)](https://zazieproductions.github.io/void-oculus/)

<p align="center">
  <a href="https://zazieproductions.github.io/void-oculus/">
    <img src="void-oculus-preview.png" alt="VOID//OCULUS zoomed out: the full board sits inside a 4,900px-wide procedural iris, cards clustered into labelled zones with coloured connectors between them" width="100%">
  </a>
</p>

<p align="center"><a href="https://zazieproductions.github.io/void-oculus/"><strong>Open the live board →</strong></a></p>

---

## Table of contents

- [Overview](#overview)
- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Interaction model](#interaction-model)
- [Architecture](#architecture)
- [Session persistence](#session-persistence)
- [The ocular engine](#the-ocular-engine)
- [Frame budget and render scheduling](#frame-budget-and-render-scheduling)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Configuration](#configuration)
- [Usage examples](#usage-examples)
- [Design principles](#design-principles)
- [Engineering considerations](#engineering-considerations)
- [Testing and quality assurance](#testing-and-quality-assurance)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Current limitations](#current-limitations)
- [Roadmap (proposed)](#roadmap-proposed)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

VOID//OCULUS is a browser-native infinite canvas for spatial notes: sticky notes, code fragments, definitions, charts, waveforms, timelines and image panels, positioned freely in an 8000 × 6000 px world and wired together with glowing bezier connectors.

The distinguishing idea is in the second half of the name. The board is not decorated with eye imagery — it is *built* out of one function. `iris()` emits a complete SVG eye (sclera, veins, stroma fibers, crypts, limbal rings, pupil, specular highlights, almond lid aperture) from a seed and a palette name. Every eye in the product comes out of that one function: the 61 gaze-tracked eyes on the seeded board — 42 of them ambient watchers drifting in the void — the 380 px centerpiece known as THE WATCHER, the cursor, the boot splash, and the 4,900 px macro iris the entire board sits inside. Zoom out and the composition resolves into a single eye; the pupil dilates as you retreat, and the eyelids close in from the top and bottom of the viewport when you press too close to the glass or fall too far away.

The engineering thesis is that a coherent, atmospheric interface does not require a framework. The whole application is one 148 KB HTML file: 1,052 lines of CSS, 90 lines of markup, and 2,827 lines of JavaScript across two independent engines. It loads from `file://`, deploys as a static artifact, and has no package manifest, no lockfile, and no transitive dependency graph to audit. Sessions persist locally, and every persisted byte passes through an allowlist sanitiser before it re-enters the DOM.

**Intended for** people who think spatially — researchers, designers, producers and engineers building dense reference boards — and for developers who want a compact, readable reference implementation of an infinite canvas: transform math, hit routing, layered compositing, procedural SVG generation, and a soft real-time animation loop, all legible in a single file.

---

## What it does

### Canvas and navigation

- **Infinite pan/zoom** across an 8000 × 6000 px world, clamped to a scale range of `0.06`–`3.0` (a 50× dynamic range).
- **Cursor-anchored zoom**: the world point under the pointer stays under the pointer through a wheel gesture, computed by inverse-transforming before the scale change and re-solving pan afterwards.
- **Single composited transform**: one `translate() scale()` on the canvas root moves the entire scene, so pan and zoom cost the same whether the board holds 5 cards or 500.
- **Fovea map**: a 160 × 100 minimap rendering cards, connectors and the live viewport rectangle under an anisotropic 1:50 horizontal / 1:60 vertical projection, with click-to-recenter.
- **Telemetry bar**: world X/Y under the cursor, zoom percentage, card count, link count, registered eye count, and macro-iris dilation — all updated live.
- **Unified pointer input**: mouse, pen and touch share one code path. Two-finger pinch scales around the gesture midpoint and pans by its travel; trackpad pinch is handled as a ctrl-modified wheel with continuous scaling.

### Content

Fifteen `data-type` variants ship on the seeded board: `sticky`, `code`, `def`, `eye`, `img`, `section`, `chart`, `graph`, `progress`, `timeline`, `waveform`, `mindmap`, `marquee`, `tags`, `hexcolor`. Four are spawnable from the toolbar at runtime.

| Type | Toolbar | Composition |
|---|---|---|
| `sticky` | `+ NOTE` | Five-colour palette, uppercase label strip, monospace body |
| `code` | `{ CODE` | Window chrome with traffic-light dots, hand-tokenised syntax spans (`kw`, `fn`, `str`, `cm`, `num`, `var`) |
| `def` | `⌖ DEF` | Term, part-of-speech/domain line, definition body with inline accent spans |
| `eye` | `◉ EYE` | Procedural iris in a recessed well, caption and palette metadata |

### Linking

- Two-click link creation: arm the `LINK` tool (or use the card context menu), click source, click target.
- Connectors are cubic beziers with control points at 40 % and 60 % of the horizontal delta, giving a clean S-curve that reads well at any zoom.
- Each connector is composed of three primitives: a 4 px translucent underlay for bloom, a 1.2 px core stroke, and a rotation-solved arrowhead polygon at the target.
- Links track their endpoints during drags and are pruned automatically when either endpoint is deleted.

### The ocular layer

- **Gaze tracking** — every registered eye orients toward the cursor in world space, with globe and pupil translating at different magnitudes (`0.09r` and `0.055r`) to produce parallax within the eye itself.
- **Blink scheduling** — each eye holds its own next-blink timestamp on a randomised 2.6–13.6 s interval. Every 40 s a **cascade blink** propagates outward from the viewport centre at 0.28 ms per world pixel, so the whole board blinks as a wave.
- **Zoom-coupled dilation** — the macro iris pupil radius, halo, collar and opacity are all driven by a single normalised zoom coefficient, with a slow sinusoidal breath superimposed.
- **Depth cueing** — ambient background eyes are bucketed into `deep` / mid / `near` tiers with matched blur and opacity, producing atmospheric perspective without a z-buffer.

### Selection and editing

- **Marquee selection** — sweep a rectangle on empty canvas; every card whose bounding box intersects it is selected. Shift-marquee is additive; sub-threshold rectangles are treated as clicks.
- **Group drag** — the whole selection translates as a rigid body, captured once on pointerdown as fixed offsets from the grabbed card.
- **In-place editing** — double-click any text region to edit it. Editing is scoped to 14 text-bearing selectors, so window chrome, SVG and progress bars can never be destroyed by a stray keystroke. The caret lands where you clicked.
- **Search** — debounced substring matching over rendered text. Matches are ringed in amber, non-matches dimmed and made click-through, with a live `hits/total` counter. `Enter` frames the viewport on the match set; `Ctrl`/`Cmd`-`F` focuses the field.

### Session and motion

- **Persistence** — cards, positions, layers, edits, links and viewport are written to `localStorage`, debounced so a drag across the canvas costs one write rather than one per frame. Restored markup passes through an allowlist sanitiser; procedural irises are stored as their seeds rather than their SVG, keeping a full 85-card board near 100 KB. `⟲ RESET` discards the session and rebuilds the seeded board.
- **Reduced motion** — `prefers-reduced-motion` stops fiber drift, pupil pulse, iris breath, scan lines, sweeps, blinking and the particle field, and shortens the boot sequence. Pointer-driven gaze is damped to a third of its travel rather than removed.

---

## Quick start

The application has no install step and no dependencies to fetch.

```bash
git clone https://github.com/zazieproductions/void-oculus.git
cd void-oculus
open index.html            # macOS — or double-click the file on any platform
```

Opening the file directly from disk works. For behaviour identical to production — correct font loading, a real origin for the browser's security model, and clean DevTools network traces — serve it over HTTP:

```bash
python3 -m http.server 8000     # http://localhost:8000
npx serve .                     # http://localhost:3000
php -S localhost:8000           # any static server works
```

Requires a browser with ES2020 support, Pointer Events, CSS custom properties, `backdrop-filter` and SVG `clipPath`: Chrome/Edge 90+, Firefox 88+, Safari 14+. Internet Explorer is not supported.

To run the automated suite (the only dependency in the project, and it is test-only):

```bash
npm install --no-save jsdom@25
node tests/smoke.mjs
```

**Network requirements.** The application logic is fully self-contained. One `@import` pulls three families from Google Fonts (JetBrains Mono, Space Grotesk, Orbitron); offline, the browser falls back to generic monospace and the layout survives with degraded typography. See [Offline and air-gapped deployment](#offline-and-air-gapped-deployment) to vendor them.

---

## Interaction model

### Pointer

| Action | Input |
|---|---|
| Select card | Click (SELECT tool) |
| Add to selection | Shift-click |
| Marquee select | Drag on empty canvas (SELECT tool); hold Shift to add to the selection |
| Move card, or the whole selection | Drag (SELECT tool) |
| Edit text | Double-click a text region |
| Pan | Drag on empty canvas (PAN tool), middle-mouse drag, or one-finger drag on touch |
| Zoom | Wheel, trackpad pinch, or two-finger pinch — all anchored at the cursor or gesture midpoint |
| Create link | LINK tool → click source → click target |
| Card actions | Right-click a card |
| Recenter | Click anywhere in the fovea map |

### Keyboard

| Key | Behaviour |
|---|---|
| `Space` (hold) | Temporarily switch to PAN; releasing restores SELECT |
| `Escape` | Cancel an in-flight link, clear the selection and the search query, return to SELECT |
| `Delete` / `Backspace` | Delete the current selection |
| `Ctrl`/`Cmd` + `F` | Focus canvas search (the browser's page search cannot see cards outside the viewport) |
| `Enter` (in search) | Frame the viewport on the match set |
| `Escape` (in editor) | Commit the edit and exit |

Every global shortcut is suppressed while focus is in an `input`, `textarea` or `contenteditable` region, so typing a space or deleting a character can never leak into a canvas command.

### Toolbar

`SELECT` · `PAN` · `LINK` — mode switches, mutually exclusive, reflected in the active button state and the canvas cursor.
`+ NOTE` · `{ CODE` · `⌖ DEF` · `◉ EYE` — spawn a card into the visible region with jittered placement so repeated clicks fan out instead of stacking.
`⊡ FIT` · `✕ DESELECT` · `⟲ RESET` — restore the default framing; clear the selection; discard the saved session and rebuild the seeded board.

### Context menu

Bring to Front (`z-index: 500`) · Send to Back (`z-index: 5`) · Duplicate (deep clone offset by 30 px, layer preserved) · Connect (arms linking with this card as source) · Delete (removes the card and every connector touching it).

---

## Architecture

### Compositing model

Six layers, deliberately ordered so that the expensive ones never invalidate the cheap ones.

| z-index | Layer | Element | Technique |
|---|---|---|---|
| 0 | Ambient field | `#particles-bg` | Fixed 2D canvas, 120 wrapping particles with proximity webbing |
| 0 (in-world) | Macro iris | `.macro-iris` | 4,900 px SVG, `mix-blend-mode: screen`, 14 s breath animation |
| 1 | Ambient eyes | `.bg-eye` × 42 | Procedural SVG, three blur/opacity depth tiers |
| 1 (connectors 2, cards 10+) | World | `#canvas` + `#connector-svg` | Absolutely positioned cards over an 8000 × 6000 connector SVG; both children of the single transformed root |
| 1000+ | Chrome | toolbar, search, zoom, status, minimap, context menu, notifications | Fixed position, outside the transform |
| 1200–3000 | Ocular overlay | gaze cursor, eyelid shades, vignette, scan line, boot splash | Fixed, `pointer-events: none`, `mix-blend-mode: screen` |

The world layer is transformed as a unit. Chrome and overlays are siblings of the transformed subtree, never inside it — which is why UI stays crisp and correctly sized at 6 % zoom and at 300 %.

### Coordinate spaces

Three spaces, with one conversion pair used consistently across every handler:

| Space | Origin | Used by |
|---|---|---|
| Viewport | Top-left of the window | Raw pointer events, chrome placement, context menu |
| World | Top-left of `#canvas` | Card geometry, connector paths, gaze vectors, minimap projection |
| Minimap | Top-left of the fovea map | World scaled by `160/8000` × `100/6000` (deliberately anisotropic) |

```js
// Viewport → world
const wx = (e.clientX - rect.left - state.x) / state.scale;
const wy = (e.clientY - rect.top  - state.y) / state.scale;

// World → viewport
const sx = wx * state.scale + state.x + rect.left;
const sy = wy * state.scale + state.y + rect.top;
```

Cursor-anchored zoom falls directly out of this pair — solve the world point under the pointer, apply the scale change, then re-solve pan so that point maps back to the same viewport pixel:

```js
function zoom(factor, cx, cy) {
  const rect = wrapper.getBoundingClientRect();
  const px = cx ?? rect.width / 2, py = cy ?? rect.height / 2;
  const wx = (px - state.x) / state.scale;      // invariant point, world space
  const wy = (py - state.y) / state.scale;
  state.scale = Math.min(Math.max(state.scale * factor, 0.06), 3);
  state.x = px - wx * state.scale;               // re-anchor
  state.y = py - wy * state.scale;
  applyTransform();
}
```

### State

A single mutable record. There is no store, no reducer, and no observer graph — the trade is deliberate and documented in [Design principles](#design-principles).

```js
let state = {
  x: -600, y: -300, scale: 0.72,   // viewport transform
  tool: 'select',                   // 'select' | 'pan' | 'connect'
  isDragging: false, isPanning: false,
  dragCard: null, dragOffset: { x: 0, y: 0 },
  selectedCards: new Set(),         // card ids
  contextCard: null,
  connecting: { active: false, from: null },
  connections: [],                  // { id, from, to, color }
  cards: [],                        // { id, x, y, w, h }
  nextId: 0,
  mouseX: 0, mouseY: 0,             // world space, not viewport
  selectionStart: null,
};
```

Two rules keep this honest:

1. **The DOM owns presentation; `state` owns identity and geometry.** Card content lives in the element; position lives in both and is written through a single drag handler.
2. **Ids are stable and monotonic.** `card-N` from a counter, never reused within a session — so connectors store plain ids and resolve them lazily at render time.

### Connector rendering

`renderConnectors()` rebuilds the connector SVG in one pass. Each link resolves live endpoint centres from the DOM (so a card that reflows keeps its links attached), then emits three primitives:

```js
const dx = to.x - from.x;
const d  = `M ${from.x} ${from.y}
            C ${from.x + dx * 0.4} ${from.y},
              ${from.x + dx * 0.6} ${to.y},
              ${to.x} ${to.y}`;
// 1. 4px underlay @ 0.15 opacity  — bloom
// 2. 1.2px core   @ 0.60 opacity  — the line
// 3. arrowhead polygon, angle solved from the second control point
```

Because the SVG lives inside the transformed root, strokes scale with the world and the geometry never needs recomputing on pan or zoom — only on the events that actually move an endpoint.

### Pointer input

All interaction runs on Pointer Events, so mouse, pen and touch share one code path rather than three. Handlers stay at the document and wrapper level — three of them plus one per card — so the listener count stays flat as the board grows, and cards call `stopPropagation` on `pointerdown` to make card and canvas interaction mutually exclusive by construction rather than by hit-test guards scattered through both paths.

A capture-phase listener on `document` maintains the live pointer registry. Capture phase matters: cards call `stopPropagation` on `pointerdown`, so a bubbling listener would miss a second finger that lands on a card and silently break pinch.

```
pointerdown (capture) → register pointer; second pointer arms pinch
pointerdown  card     → connect / select / begin group drag   (stopPropagation)
pointerdown  canvas   → pan (PAN tool, middle button, or touch) or begin marquee
pointermove           → pinch takes precedence, else pan / drag / size marquee
pointerup             → commit drag or marquee, release transient state
pointercancel         → abandon the gesture without committing anything
```

Arming pinch calls `cancelTransientInteractions()`, which abandons any in-flight drag, pan or marquee. A second finger can therefore never leave a single-pointer interaction half-applied — the same routine handles `pointercancel`, because both mean "this gesture is no longer ours".

Pinch scales around the midpoint of the two pointers and pans by that midpoint's travel, so the board tracks the fingers rather than the screen centre.

### Code map

| Region | Lines | Responsibility |
|---|---|---|
| Design tokens + component CSS | 7–1058 | 27 custom properties, all card typologies, 13 keyframe animations, responsive and reduced-motion blocks |
| Markup | 1060–1149 | Chrome, overlays, canvas root — 90 lines total |
| Canvas engine | 1149–3054 | Transform, state, cards, connectors, pointer input, search, minimap, particles, persistence, seeded board |
| Ocular engine | 3055–3977 | Seeded PRNG, `iris()`, gaze registry, blink scheduler, macro iris, iris rehydration, ocular zones |

The two engines are separate `<script>` blocks with an explicit contract. The ocular engine is an IIFE that reads `state`, calls `createCard`/`showNotif`, and exports exactly three symbols back: `addEyeCard` (toolbar), `iris` (iris rehydration after a session restore) and `scanEyes` (adopting new subtrees into the gaze registry). Everything else in it is private. Their shared mutable surface is one documented object, `window.VO`, carrying five fields — `restored`, `pendingEyes`, `reducedMotion`, `storage` and `booting`.

---

## Session persistence

The board survives a reload. The design constraint is that persistence must not compromise the two properties the rest of the system depends on: no dependencies, and no path by which stored data can execute.

### Snapshot shape

```js
{
  v: 1,                                   // schema version; a mismatch discards the snapshot
  savedAt: 1755500000000,
  transform: { x, y, scale },
  nextId: 86,
  cards: [{ id, type, x, y, z, cls, eye, html }],
  connections: [{ id, from, to, color }],
}
```

Writes are debounced (600 ms for mutations, 1,500 ms for viewport changes) and flushed on `beforeunload`. Dragging a card across the canvas therefore costs one serialisation, not one per frame.

### Seed-slot compression

Procedural irises are the overwhelming bulk of the board's markup. Rather than persist that SVG, any card carrying `data-eye-opts` has its iris replaced by a slot marker at save time and regenerated from its seed on restore:

```js
// save:    <svg class="eye-svg">…4,000 chars of stroma…</svg>  →  <span data-eye-slot></span>
// restore: slot.replaceWith(iris(JSON.parse(card.dataset.eyeOpts)))
```

This is lossless precisely because generation is deterministic — the regenerated markup is byte-identical to what was on screen. A full 85-card board serialises to roughly 100 KB instead of several hundred.

### Sanitisation

Restored markup is untrusted by policy, even though it was written by this application: storage is user-writable, and a snapshot can be edited, synced or transplanted between browsers.

Parsing happens inside an inert `<template>`, so nothing executes, fetches or renders during inspection. The policy is a **tag allowlist** — every element outside the set is dropped whole — plus a **deny policy on attribute classes that can execute or fetch**:

| Rule | Rationale |
|---|---|
| Tag not in allowlist → remove element | Excludes `script`, `iframe`, `object`, `embed`, `link`, `form` and everything else with side effects |
| `on*` attributes | Inline event handlers |
| `src`, `srcdoc`, `formaction` | Network fetches and nested browsing contexts |
| `href` / `xlink:href` not starting with `#` | External and `javascript:` navigation |
| `style` containing `url(`, `expression(`, `javascript:` | CSS-borne fetches and legacy execution |
| `data-reg` | Stale gaze registration that would exclude the eye from tracking |

Presentational attributes and inline geometry survive untouched, which is what lets procedurally generated SVG round-trip. The suite asserts each rule directly, including that nothing executes during sanitisation itself.

### Failure behaviour

Restoration is all-or-nothing. Any structural problem — malformed JSON, unknown schema version, a throwing card — tears down whatever was partially built, drops the snapshot, and falls back to the deterministic seeded board. A corrupt session cannot leave the user staring at half a canvas. When `localStorage` is unavailable (Safari private mode, `file://` under some policies, zero quota), persistence disables itself, reports once, and the board stays fully usable.

---

## The ocular engine

### Deterministic generation

A seeded LCG-plus-avalanche PRNG backs every procedural element:

```js
function rng(seed) {
  let a = (seed * 1664525 + 1013904223) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

This is the single most consequential decision in the visual system. Because randomness is seeded rather than ambient, **every eye is reproducible**: `iris({ seed: 1313 })` renders byte-identical SVG on every load, in every browser, forever. Layouts do not shimmer between reloads, screenshots stay comparable, and visual regressions are attributable to code changes rather than to `Math.random()`. Seeds are used as stable identity — `4242` is the macro iris, `90210` seeds the ambient field, `1313` is THE WATCHER.

### One function, every eye

`iris(opt)` returns a complete SVG string. Anatomy is layered in physical order:

| Structure | Implementation |
|---|---|
| Aperture | Almond path from two cubic segments, reused as both `clipPath` and the visible lid outline |
| Sclera | Radial gradient into `--sclera`, clipped to the aperture |
| Veins | 4 quadratic strokes entering from alternating limbal edges |
| Stroma | `fibers` quadratic curves swept radially, each with seeded bend, width and opacity |
| Crypts | Rotated ellipses punched dark into the stroma — the detail that stops it reading as a gradient |
| Rings | Collarette, dark limbal ring, bright outer limbal ring, radii proportional to eye size |
| Pupil | Layered discs plus a rotated primary catchlight and an offset secondary |
| Lids | Two black rects parked off-canvas inside the clip, translated in for blinks |

Every dimension derives from `size`, so a 34 px cursor eye and a 380 px centerpiece are the same code path with no special cases. Opt-in behaviour flags — `drift`, `veins`, `sweep` — let the caller pay for animation only where it reads.

### Gaze registry and culling

`scanEyes(root)` walks for `svg.eye-svg:not([data-reg])`, marks each registered, and records a tracking entry. For card-borne eyes it walks the `offsetParent` chain **once** to cache the eye's centre offset within its card — so per-frame tracking is two float reads (`card.style.left/top`) plus an add, never a layout-forcing `getBoundingClientRect()`.

```js
const pull = Math.min(1, d / (e.r * 6));         // saturating response curve
e.globe.style.transform = `translate(${ux * e.r * 0.09 * pull}px, …)`;
e.pupil.style.transform = `translate(${ux * e.r * 0.055 * pull}px, …)`;
```

Two mechanisms keep 61 simultaneously animated eyes cheap:

- **Viewport culling** with a 400 px world-space margin, so off-screen eyes cost one comparison per frame.
- **Frame skipping** — gaze updates run every second frame (~30 Hz). The visual gap is closed by a 140 ms CSS transition on the transform, which hands interpolation to the compositor. Perceptually the motion is smoother than a 60 Hz JS update, at half the cost.

### Zoom-coupled ocular state

A single normalised coefficient drives the entire macro layer, so dilation, halo, collar and opacity can never disagree:

```js
const k = Math.min(1, Math.max(0, (1.30 - state.scale) / 1.20));  // 0 = close, 1 = far
macroPupil.r    = MR * (0.13 + k * 0.24) + Math.sin(t * 0.55) * 14;  // dilate + breathe
macroWrap.style.opacity = 0.06 + k * k * 0.90;                        // quadratic reveal
```

The eyelid shades are driven by the same scale value through two independent clamped ramps — `squint` above 1.5× and `recede` below 0.17× — summed into a single lid height in `vh`. The result is that the interface *reacts to attention*: lean in and it squints, pull back and the void opens its eye. `k` is also surfaced verbatim as the `DILATION` readout in the status bar, so the animation state is inspectable rather than mysterious.

---

## Frame budget and render scheduling

| Loop | Cadence | Work | Cost control |
|---|---|---|---|
| `animParticles` | 60 Hz RAF | 120 particles + proximity webbing | Fixed count; 7,140 pair tests/frame on a 2D canvas, no DOM |
| `gazeLoop` | 60 Hz RAF | Gaze on even frames, `ocularTick` every frame | Viewport culling + 2:1 frame skip; CSS transition covers the gap |
| Blink scheduler | 3.8 Hz `setInterval` | Timestamp comparison per eye | Class toggle only; the animation itself is CSS |
| Cascade blink | 0.025 Hz | Distance-ordered `setTimeout` fan-out | Runs once per 40 s |
| `renderConnectors` | Event-driven | Full SVG rebuild | Only on link add/delete, card delete, edit commit, and during drags |
| `updateMinimap` | On transform + 1 Hz | 160 × 100 canvas repaint | Trivially small raster; the interval catches async layout settling |
| `saveSession` | Debounced, 600/1500 ms | Snapshot + `JSON.stringify` | Coalesced to one write per quiet period; flushed on `beforeunload` |
| `applySearch` | Debounced, 120 ms | `textContent` scan per card | Class toggles only; no layout reads |

Steady-state cost with no interaction is two RAF loops and one 260 ms timer. Nothing polls the DOM, nothing observes mutations, and no work is scheduled for elements outside the viewport.

---

## Technology stack

| Component | Version | Role |
|---|---|---|
| HTML5 | — | Single-file delivery; 86 lines of semantic chrome |
| CSS3 custom properties | — | 27-token design system; every colour, font and surface is a variable |
| Vanilla JavaScript | ES2020 | Both engines. Optional chaining, nullish coalescing, `Set`, `Map`, template literals |
| Pointer Events | Level 2 | One input path for mouse, pen and touch, including pinch |
| Canvas 2D | — | Particle field and fovea map — raster where per-pixel cost matters |
| Inline SVG | — | Connectors and irises — vector where crispness at 50× zoom matters |
| Web Storage | — | Debounced session snapshots, sanitised on the way back in |
| Google Fonts | — | JetBrains Mono (UI/mono), Space Grotesk (body), Orbitron (display) |
| jsdom | 25 (test only) | Headless DOM for the smoke suite; installed on demand, never shipped |
| GitHub Actions | `checkout@v4`, `setup-node@v4`, `configure-pages@v5`, `upload-pages-artifact@v5`, `deploy-pages@v5` | Verification on every PR; static deployment on push to `main` |
| Dependabot | v2 | Weekly GitHub Actions update PRs |

**Runtime dependencies: zero.** `index.html` loads no external scripts — a CI job asserts this, failing the build if a `<script src=…>` ever appears. Connectors, particles, the minimap, the sanitiser and the entire ocular engine are hand-written. The only network requests the page makes are for the three webfonts, and the layout degrades gracefully without them.

The choice of raster versus vector is per-subsystem rather than doctrinal: the particle field and minimap are pure raster because they redraw wholesale and never need hit-testing or scaling fidelity; connectors and irises are SVG because they must stay sharp across a 50× zoom range and inherit CSS custom properties (`--sclera`, `--vein`) directly into generated markup.

---

## Repository structure

```
void-oculus/
├── index.html                  # The entire application — CSS, markup, and both engines
├── tests/
│   └── smoke.mjs               # jsdom smoke suite: 53 assertions, no browser required
├── README.md                   # This document
├── ARCHITECTURE.md             # Layer model, coordinate math, state transitions
├── API.md                      # Function-level reference for the global surface
├── CONFIGURATION.md            # Theming, tunable constants, embedding, offline setup
├── CONTRIBUTING.md             # Workflow, coding standards, review expectations
├── CODE_OF_CONDUCT.md          # Contributor Covenant
├── SECURITY.md                 # Vulnerability reporting and threat model
├── SUPPORT.md                  # Help routing and common questions
├── CHANGELOG.md                # Keep a Changelog format, SemVer
├── LICENSE.md                  # MIT
├── void-oculus-preview.png     # Zoomed-out board — the macro iris
├── void-oculus-detail.png      # Card-level detail at 65 % zoom
├── .gitignore                  # Build artifacts, editor state, future Node tooling
└── .github/
    ├── workflows/static.yml    # GitHub Pages deployment
    ├── workflows/verify.yml    # Smoke suite, inline-script parse check, dependency guard
    ├── dependabot.yml          # Weekly Actions updates
    ├── ISSUE_TEMPLATE/         # Structured bug report and feature request forms
    ├── PULL_REQUEST_TEMPLATE.md
    └── FUNDING.yml
```

Within `index.html`, the internal structure is enforced by banner comments and consistent section ordering — tokens, then components, then overlays in CSS; state, then transform, then cards, then connectors, then events, then seeded content in the canvas engine.

---

## Configuration

There are no environment variables. The application takes no runtime configuration, reads no config file, and requires no build-time substitution — a direct consequence of the static, dependency-free design. All customisation is done by editing declared constants at the top of their sections.

The one piece of runtime state that lives outside the file is the session snapshot under the `localStorage` key `void-oculus/session`. Clear it with `⟲ RESET`, or `localStorage.removeItem('void-oculus/session')`.

### Design tokens

The complete visual identity lives in one 25-token `:root` block (`index.html:11`). Overriding these is the supported way to reskin the product:

```css
:root {
  --bg: #0a0a0b;          --surface: #111113;    --border: #2a2a2e;
  --phosphor: #00ff9d;    --crimson: #cc2233;    --violet: #7b4fff;
  --amber: #ffaa00;       --cyan: #00ccff;
  --text-primary: #e8e8ec; --text-secondary: #888890; --text-dim: #555558;
  --mono: 'JetBrains Mono', monospace;
  --display: 'Orbitron', monospace;
  --body: 'Space Grotesk', sans-serif;
}
```

Each accent ships in three registers — base, `-bright`, `-faint` (a `22` alpha suffix) — used consistently for stroke, glow and fill respectively. A second block at `index.html:810` defines `--sclera` and `--vein`, which are consumed *inside* generated SVG, so eye tinting is themeable without touching JavaScript.

### Tunable constants

| Constant | Location | Default | Effect |
|---|---|---|---|
| `#canvas` width/height | CSS `index.html:65` | `8000 × 6000` | World extent; must match the `cw`/`ch` and minimap click constants |
| Zoom clamp | `zoom()` | `0.06 … 3` | Dynamic range; the lower bound sets how far out the macro iris resolves |
| Default framing | `resetView()` | `-600, -300 @ 0.72` | Where `FIT` and first paint land |
| Particle count | `initParticles()` | `120` | Ambient density; the dominant per-frame cost |
| Proximity threshold | `animParticles()` | `80 px` | Webbing distance between particles |
| `MX, MY, MR` | Ocular engine | `1560, 1480, 2450` | Macro iris centre and radius in world space |
| Ambient eye count | `buildBackgroundEyes()` | `42` | Watchers scattered through the void |
| Dilation curve | `ocularTick()` | `(1.30 - scale) / 1.20` | Maps zoom to dilation; widen the divisor for a slower response |
| Blink interval | Blink scheduler | `2600 + rand·11000 ms` | Per-eye cadence |
| Cascade period / speed | Cascade timer | `40 s`, `0.28 ms/px` | Board-wide blink wave |
| `STORAGE_KEY` | Persistence | `void-oculus/session` | Snapshot location |
| `SCHEMA_VERSION` | Persistence | `1` | Bump to invalidate old snapshots |
| Save debounce | `scheduleSave()` | `600 ms` / `1500 ms` | Quiet period for mutations / viewport changes |
| Search debounce | `searchInput` handler | `120 ms` | Pause before a filter pass runs |
| `EDITABLE_REGIONS` | Editing | 14 selectors | Which regions double-click can edit |
| `ALLOWED_TAGS` | Sanitiser | 56 tags | Elements permitted back into the DOM on restore |

`CONFIGURATION.md` covers theming recipes, embedding, and custom card types in depth.

---

## Usage examples

Every canvas-engine function is a global by design, which makes the browser console a first-class authoring surface. The following are real signatures from the shipped code.

### Build a board programmatically

```js
const spec = createCard('sticky', 400, 300, `
  <div class="sticky sticky-cyan">
    <div class="sticky-label">⚡ SPEC</div>
    Latency budget: 16.6ms/frame<br>
    Culling margin: 400px world-space
  </div>`);

const impl = createCard('code', 700, 300, `
  <div class="code-block" style="width:280px">
    <div class="code-header">
      <div class="code-dots"><div class="code-dot"></div><div class="code-dot"></div><div class="code-dot"></div></div>
      <div class="code-title">budget.js</div>
    </div>
    <div class="code-body">
      <span class="kw">const</span> <span class="var">FRAME</span> = <span class="num">16.6</span>;
    </div>
  </div>`);

addConnection(spec.id, impl.id, '#00ccff');
```

### Generate an eye

```js
// Reproducible: the same seed always yields identical geometry.
document.querySelector('#my-slot').innerHTML = iris({
  size: 220,
  pal: 'crimson',   // phosphor | crimson | violet | amber | cyan | bone
  seed: 1987,
  pupil: 0.26,      // pupil radius as a fraction of the iris
  fibers: 96,       // stroma density
  drift: true,      // 60s rotation of the fiber group
  veins: true,
});
```

### Search, filter and frame

```js
applySearch('saccade');   // → match count; rings hits, dims the rest
fitToMatches();           // frame the viewport on the match set
clearSearch();            // restore full visibility
```

### Session control

```js
saveSession();            // force an immediate write (normally debounced)
scheduleSave(0);          // …or flush on the next tick
localStorage.getItem('void-oculus/session');   // inspect the snapshot
resetBoard();             // discard the session and rebuild the seeded board

sanitizeHTML('<img src=x onerror=alert(1)><span style="color:red">ok</span>');
// → '<span style="color:red">ok</span>'
```

### Navigate and inspect

```js
resetView();                       // restore default framing
zoom(1.5, innerWidth/2, innerHeight/2);

state.cards.length;                // 85 on the seeded board
state.connections.length;          // 28
[...state.selectedCards];          // current selection, as ids
VO.restored;                       // true when this board came from storage

// Centre the viewport on a card
const c = getCardCenter('card-42');
state.x = -c.x * state.scale + innerWidth / 2;
state.y = -c.y * state.scale + innerHeight / 2;
applyTransform();
```

### Typical workflow

1. Open the board and press `FIT` to establish context, then wheel-zoom into a zone.
2. Spawn cards from the toolbar — they land in the visible region with jitter, not at a fixed origin.
3. Arrange by dragging; connectors follow their endpoints live.
4. Arm `LINK`, click source then target. The tool auto-returns to `SELECT` after a successful link, because linking is almost always followed by arranging.
5. Double-click any text to edit it in place; sweep a marquee to move a cluster as a group.
6. Right-click for layering, duplication and deletion.
7. Zoom out past ~24 % to watch the board resolve into the macro iris.
8. Close the tab. Reopen it — the board, its edits and your viewport come back.

---

## Design principles

**No build step is a feature, not a limitation.** The distribution artifact is the source. There is no compilation gap between what you read and what runs, no source map to load, no toolchain to keep alive. `index.html` will open in a browser in 2035 exactly as it does today.

**Dependencies are liabilities.** No library is called at runtime, which means no supply-chain surface, no version drift, and nothing to audit. The two capabilities a visualisation library would have supplied here — path generation and data-joined DOM updates — are a few dozen lines each, written directly and read in one sitting.

**Determinism over novelty.** Seeded generation everywhere. A procedural system that changes on every reload cannot be reviewed, screenshotted, or regression-tested; one that is seeded can.

**One function per visual concept.** Every eye in the product routes through `iris()`. Every world transform routes through `applyTransform()`. Every connector through `renderConnectors()`. When a rendering concept has exactly one implementation, a fix is a fix everywhere.

**Push animation to the compositor.** JavaScript decides *what* should move; CSS transitions and keyframes decide *how* it interpolates. This is why 61 tracked eyes, 120 particles, a breathing macro iris and a scan-line overlay coexist without a frame-time crisis.

**The interface should have a point of view.** The lids, the cascade blink, the dilation coupling and the cursor that looks back are not chrome — they are the argument that a tool for looking at your own thinking should visibly be looking back. The theme is load-bearing, and it is implemented with the same rigour as the transform math.

**Untrusted by default at the boundary.** Everything authored in-repo is trusted; everything crossing back in from storage is not, regardless of who wrote it. That line is drawn once, at the sanitiser, rather than being re-litigated at each call site.

**Direct state over abstraction.** With a single-file application and one writer per field, a reactive layer would add indirection without removing a class of bug. The trade is explicit: this design does not survive multi-writer concurrency, and the roadmap treats persistence and collaboration as the point where a real state layer becomes justified.

---

## Engineering considerations

### Performance

- One transform for the entire scene: pan/zoom cost is independent of card count.
- `will-change: transform` is scoped to eye globes and pupils — the elements that actually mutate every frame — rather than sprayed across all cards, avoiding needless layer promotion and GPU memory pressure.
- Gaze tracking culls to the viewport plus a 400 px margin and runs at half frame rate.
- Cached offset math replaces per-frame `getBoundingClientRect()`, so the gaze loop never forces synchronous layout.
- Card geometry is measured once after insertion (`setTimeout(…, 100)` lets layout settle) and cached on the state record for the minimap.
- Session writes are debounced and flushed on `beforeunload`, so serialisation never runs inside an interaction frame; seed-slot compression keeps the payload near 100 KB.
- Search is debounced at 120 ms and matches against `textContent` — one string comparison per card, no layout reads.
- Group drag resolves its offsets once on `pointerdown`; per-frame cost is two style writes per selected card.
- **Known hot path:** `renderConnectors()` rebuilds every path on each `pointermove` during a card drag. At the seeded scale (28 links) this is imperceptible; at several hundred links it would need incremental updates — see the [roadmap](#roadmap-proposed).

### Security

- No network I/O after load, no cookies, no telemetry, no analytics, no third-party scripts. Session data is written to this origin's `localStorage` and never transmitted; nothing you put on the board leaves the browser.
- **Stored content is treated as untrusted.** Everything read back passes through the allowlist sanitiser described in [Session persistence](#session-persistence), parsed inside an inert `<template>` so nothing executes during inspection. Nine assertions pin this behaviour, including the negative case that sanitisation itself executes nothing.
- Card content authored in-repo is injected via `innerHTML` from literals, which is safe by construction. The standing review gate: **any new path bringing outside markup in — import, paste, drag-and-drop, URL fragment — must route through `sanitizeHTML()`**, never straight to `innerHTML`.
- Remaining surface is supply chain, now limited to three webfonts. **Recommended hardening:** vendor the fonts, then serve under a strict policy:

  ```
  Content-Security-Policy: default-src 'none'; img-src 'self' data:;
                           style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';
                           connect-src 'none'; frame-ancestors 'none';
  ```

  (`'unsafe-inline'` is required by the single-file design; moving to hashed inline blocks is a viable hardening step and is on the roadmap.)
- The GitHub Actions workflow follows least privilege: `contents: read`, `pages: write`, `id-token: write`, with OIDC-based deployment and a concurrency group that never cancels an in-flight production deploy.

### Accessibility

Assessed honestly, because the current state is mixed:

**Implemented** — `prefers-reduced-motion` is honoured in both CSS and JavaScript: fiber drift, pupil pulse, iris breath, scan lines, sweeps, marquee text, glow pulses and boot flicker stop; the particle field paints one static frame and halts its RAF loop; the blink scheduler and the 40-second cascade never start; the boot splash clears in 300 ms instead of 2.3 s. Pointer-driven gaze is retained at a third of its travel, because it answers user input directly rather than animating on its own.

Also implemented: semantic `<button>` elements for every toolbar control, natively focusable, keyboard-activatable and titled; a labelled search `<input>` with an `aria-live` result counter; `Escape` as a universal cancel; every global shortcut suppressed inside text-entry contexts; `Ctrl`/`Cmd`-`F` routed to canvas search, which — unlike the browser's page search — can see cards outside the viewport; a responsive breakpoint at 768 px.

**Not yet implemented** — the canvas exposes no keyboard navigation model, so cards cannot be reached, moved or edited without a pointer; the status bar and notifications carry no ARIA live regions; the custom gaze cursor replaces the system cursor; several metadata registers use 8 px letter-spaced type below comfortable contrast ratios. These are the honest remaining gaps and they lead the [roadmap](#roadmap-proposed).

### Reliability

- Defensive lookups throughout: `getCardCenter()` returns `null` for missing elements and every caller checks; connector rendering skips links with a dangling endpoint rather than throwing.
- Deleting a card prunes its connectors and its selection membership in the same operation, so no orphan state can persist.
- `scanEyes()` marks registrations with `data-reg`, making it idempotent — re-scanning a subtree cannot double-register an eye or double the animation cost.
- Duplicate ids are structurally impossible: a monotonic counter, never decremented, never reused.
- Session restore is all-or-nothing and self-healing: malformed JSON, an unknown schema version or a throwing card tears down the partial board, drops the snapshot and falls back to the seeded build. Both failure modes are asserted.
- Connections referencing a card absent from the snapshot are dropped at restore, so a stored board cannot resurrect dangling links.
- Storage failure is contained: `localStorage` is probed at boot, and a write failure disables persistence, reports once, and leaves the board fully usable.
- Pointer gestures have an explicit abandon path — `pointercancel` and pinch entry run the same teardown, so no interaction is ever left half-applied.

### Maintainability

- Public functions carry JSDoc with `@typedef` records for `Card`, `Connection` and `CanvasState`, so editors provide real type inference in a codebase with no type system.
- Banner comments partition both engines into named sections in a consistent order.
- The ocular engine is an IIFE with exactly one export, giving a genuine module boundary without a module system.
- Shared colours, fonts and surfaces resolve through custom properties, so a reskin is a single `:root` edit. Card-specific tints and generated SVG still carry literal hex values — the main outstanding cleanup in the stylesheet.
- Documentation is split by audience — architecture, API, configuration, contribution, security, support — rather than accumulating in one file.
- The smoke suite runs in about ten seconds behind a single on-demand dependency, so the feedback loop is short enough to actually be used.

---

## Testing and quality assurance

Two layers: an automated suite for logic and state, and a manual matrix for the geometry, gestures and visual behaviour a headless DOM cannot judge.

### Automated smoke suite

```bash
npm install --no-save jsdom@25     # test-only; nothing is added to the shipped artifact
node tests/smoke.mjs               # ~10s, exits non-zero on failure
```

`tests/smoke.mjs` loads `index.html` in jsdom with a stubbed 2D context and asserts 53 expectations across seven groups:

| Group | Covers |
|---|---|
| Seeded board | Boots without script errors; 85 cards, 28 connections, 61 registered eyes; every card record typed; every eye card carrying its generation params; no external script tags |
| Search | Exact and case-insensitive matching, dim/hit classes, live counter, full restore on an empty query |
| Marquee | Multi-card commit, visual marking parity with `state`, sub-threshold rectangles treated as clicks |
| Group drag | Offset capture, translation of unpointed members, state records tracking the DOM, clean release |
| Editing | Double-click opens an editor, card flagged, blur commits, edited text becomes searchable |
| Sanitisation | Strips `script`, `img`, `iframe`, `javascript:` hrefs, `on*` handlers, `url()` styles, stale `data-reg`; preserves SVG geometry and benign inline styles; executes nothing |
| Persistence | Round trip through storage, schema version, seed-slot compression (~100 KB for 85 cards), position fidelity, no double-build, iris rehydration, connector repaint, gaze re-registration, id-space advance, corrupt-snapshot and unknown-schema fallback, reduced-motion boot |

jsdom implements no layout, so the suite deliberately asserts logic and state only — never geometry. That boundary is why the manual matrix below still exists.

### Continuous integration

`.github/workflows/verify.yml` runs on every push and pull request:

1. **Smoke suite** — the run above, on Node 22.
2. **Parse check** — both inline script blocks are compiled with `new Function`, catching syntax errors without a browser.
3. **Dependency guard** — fails the build if any `<script src=…>` appears in `index.html`, making the zero-dependency invariant executable rather than aspirational.

### Pre-merge manual matrix

Run against Chrome, Firefox and Safari at both default and 200 % browser zoom:

| Area | Check | Expected |
|---|---|---|
| Boot | Cold load | Boot iris appears, auto-dismisses at 2.3 s, click skips early, no console errors |
| Transform | Wheel-zoom over a specific card | The point under the cursor does not drift; clamps at 6 % and 300 % |
| Transform | `FIT` | Returns to `-600, -300 @ 0.72` |
| Cards | Spawn one of each of the four toolbar types | Lands in view, jittered, telemetry increments |
| Drag | Drag a linked card across the viewport | Connectors track continuously; no ghosting; drop restores cursor |
| Links | LINK → source → target | Notification fires, tool returns to SELECT, arrowhead points at the target |
| Delete | Delete a card with ≥ 2 links | Card and all its connectors vanish; counts decrement correctly |
| Context menu | All five actions | Front/back reorder, duplicate offsets by 30 px, connect arms linking, delete removes |
| Keyboard | Hold `Space`, `Escape`, `Delete` | Pan engages and reverts; Escape cancels a half-built link; Delete is inert while a text field has focus |
| Minimap | Click a far quadrant | Viewport recenters; the indicator rectangle matches the actual viewport |
| Ocular | Move the cursor across zones | Eyes track; off-screen eyes are not animated (verify in the Performance panel) |
| Ocular | Zoom from 300 % to 6 % | Dilation stays at 0 above 130 %, then increases monotonically to 100 %; lids close at both extremes; the macro iris fades in |
| Determinism | Reload twice, compare screenshots | Identical iris geometry — any difference is a regression in seeding |
| Search | Type a term present on two cards | Matches ring amber within ~120 ms, rest dim, counter reads `2/85`, `Enter` frames both |
| Marquee | Sweep across a cluster | Rectangle tracks the pointer; on release every intersecting card is ringed |
| Group drag | Select three cards, drag one | All three move rigidly; their connectors follow; positions survive a reload |
| Editing | Double-click a sticky, type, click away | Caret lands at the click point; text commits; the edit survives a reload |
| Persistence | Move a card, reload | Board, edits and viewport return; status bar counts match |
| Persistence | `⟲ RESET` | Confirms, then rebuilds the seeded board |
| Touch | On a tablet: one-finger drag, two-finger pinch | Pan follows the finger; pinch scales about the midpoint without drift |
| Reduced motion | Enable the OS setting, reload | Particles static, no blinking, no drift, boot clears immediately; gaze still tracks, damped |
| Responsive | Below 768 px | Toolbar labels collapse to glyphs; search hides; no horizontal overflow |

### Performance verification

Record a 10-second Performance profile while panning at 60 Hz. Expectations on mid-range 2020-era hardware: sustained 60 fps at default zoom, no layout thrash during the gaze loop (zero purple "Layout" bars inside RAF callbacks), and no unbounded growth in DOM node count across a 5-minute idle.

### Static checks

```bash
npx html-validate index.html     # structural HTML validation
npx prettier --check index.html  # formatting drift
```

Neither is wired into CI yet; promoting them to required checks is proposed below.

---

## Deployment

### GitHub Pages (configured)

`.github/workflows/static.yml` deploys the repository root on every push to `main` and on manual dispatch. It uses OIDC token deployment, scoped permissions, and a `pages` concurrency group with `cancel-in-progress: false` so a production deploy is never interrupted mid-flight.

Enable it once under **Settings → Pages → Build and deployment → GitHub Actions**. No build command, no output directory, no environment variables.

### Any static host

There is nothing to compile, so the deploy target is a filesystem:

| Platform | Configuration |
|---|---|
| Netlify | Build command: *(empty)*, publish directory: `.` |
| Cloudflare Pages | Framework preset: None, build command: *(empty)* |
| Vercel | Framework preset: Other, output directory: `.` |
| S3 + CloudFront | `aws s3 sync . s3://bucket --exclude ".git/*"`, enable static hosting |
| nginx / Apache | Drop the directory in the web root |

### Offline and air-gapped deployment

For deployments with no outbound network access:

1. Download the three font families, place them alongside `index.html`, and replace the Google Fonts `@import` at the top of the stylesheet with local `@font-face` declarations. This is the only outbound request the page makes.
2. Verify: load with DevTools' network panel set to offline. The board must render fully; only typography should change if a font fails to resolve.

The result is a genuinely self-contained artifact — a single file plus fonts, servable from anywhere, including a USB stick.

### Recommended headers

```
Cache-Control: public, max-age=300           # index.html — short, it is the whole app
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Content-Security-Policy: …                   # see the Security section
```

---

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| Typography looks generic | Google Fonts blocked or offline | Expected fallback behaviour. Vendor fonts locally for deterministic rendering |
| Boot splash never clears | A JavaScript error before the 2.3 s dismissal | Check the console; click the splash to dismiss manually and read the stack trace |
| Nothing visible after load | Panned outside the seeded region | Press `⊡ FIT`, or run `resetView()` in the console |
| Wheel scrolls the page instead of zooming | Pointer was outside `#canvas-wrapper` | The `wheel` handler is bound to the wrapper; move the pointer over the canvas |
| Dragging pans instead of moving a card | PAN tool is active, or `Space` is held | Click `SELECT` or press `Escape` |
| A card cannot be dragged | Another card overlaps it with higher `z-index` | Right-click the obstructing card → Send to Back |
| Connectors detach from a card | Card resized after creation without a re-measure | Call `updateMinimapCards()`, which re-measures geometry and repaints |
| Frame rate drops on a large board | Connector rebuild on every drag frame | Reduce link count, or lower the particle count in `initParticles()` |
| Eyes stop tracking the cursor | An `eyeCard` was inserted without registration | Call `scanEyes(cardElement)` after insertion; `iris()` alone only renders markup |
| Board looks stale, or an old layout returns | A saved session is being restored | `⟲ RESET`, or `localStorage.removeItem('void-oculus/session')` |
| "SESSION NOT SAVED" notification | Storage blocked — private browsing, zero quota, or a `file://` policy | Serve over HTTP, or accept an in-memory session for this run |
| Edits vanish after reload | The edit never committed — the region was still focused when the tab closed | Click outside the region, or press `Escape`, before leaving |
| Restored eyes render as empty wells | `data-eye-opts` was hand-edited into an unparseable state | `⟲ RESET`; the slot is only regenerated when its params parse |
| Double-click does not open an editor | The region is not one of the 14 editable selectors | Add a `data-editable` attribute to the element, or extend `EDITABLE_REGIONS` |
| Pinch zooms the browser instead of the board | The gesture began outside `#canvas-wrapper` | `touch-action: none` applies to the canvas only; start the gesture over it |

---

## Current limitations

Documented deliberately. Each is a known boundary of the current design, not an unknown defect.

| Limitation | Detail |
|---|---|
| No keyboard navigation model | Toolbar controls are focusable, but cards cannot be reached, moved or edited without a pointer. The largest remaining accessibility gap. |
| No ARIA live regions | The status bar and transient notifications are invisible to assistive technology. Search results are the one exception. |
| Single-writer state | `state` is a plain mutable record with one writer per field. This is correct for a single local session and would not survive concurrent editing without a real state layer. |
| Connector rebuild during drags | Every path is re-emitted per pointer frame. Imperceptible at the seeded scale; it would need incremental updates in the several-hundred-link range. |
| No DOM virtualisation | Every card stays in the DOM at every zoom level. The gaze loop culls; card rendering does not. |
| Session is device-local | `localStorage` is per-origin and per-browser. There is no export file, no sync and no sharing. |
| Structured content is not modelled | Cards persist as sanitised markup, not as a typed content tree, so a chart's data cannot be edited as data — only its rendered text. |
| No collaboration | Single user, single tab. Two tabs on the same origin will overwrite each other's snapshots. |

---

## Roadmap (proposed)

Nothing in this section is implemented. It is a prioritised set of proposals, ordered by the ratio of user value to structural risk.

**Accessibility — the remaining gap**
- Roving-tabindex keyboard model: `Tab` between cards, arrow keys to move the selection, `Enter` to edit, `Delete` to remove.
- ARIA live regions for notifications and the telemetry bar; `role="application"` with a documented key map on the canvas.
- An opt-out for the custom gaze cursor, and a contrast pass over the 8 px metadata registers.

**Portability**
- Export and import the session snapshot as a `.json` file — the sanitiser and schema version already make this safe; only the file plumbing is missing.
- Multi-board support keyed under `void-oculus/session/<name>`, with a switcher in the toolbar.
- `BroadcastChannel` coordination so two tabs on the same origin reconcile instead of overwriting.

**Content model**
- Promote cards from sanitised markup to a typed content tree, so charts, timelines and progress cards can be edited as data rather than as rendered text.
- Undo/redo over a command log, which the typed model makes tractable.

**Scale**
- Incremental connector updates keyed by card id, replacing the full rebuild during drags.
- DOM virtualisation for cards outside the viewport, reusing the culling logic already proven in the gaze loop.
- Spatial index (quadtree) over card bounds to make hit-testing, marquee selection and culling sublinear.

**Quality infrastructure**
- Visual regression snapshots — cheap and reliable precisely because generation is seeded.
- HTML validation and formatting as required status checks.
- A gesture-level suite once a headless browser is available in CI; jsdom cannot exercise pinch or layout.

---

## Contributing

Contributions are welcome. Read `CONTRIBUTING.md` for the full standard; the summary:

```bash
git checkout -b feature/your-change
# edit index.html

npm install --no-save jsdom@25
node tests/smoke.mjs             # must stay green
python3 -m http.server 8000      # then walk the manual matrix

git commit -m "Add: concise description"
git push origin feature/your-change
```

Non-negotiables for review:

1. **Preserve the single-file architecture.** Every change lands in `index.html`. If a change genuinely requires a build step, open an issue first — it is an architectural decision, not an implementation detail.
2. **No new runtime dependencies.** The zero-dependency property is a headline feature.
3. **Seeded, not random.** Any new procedural element must draw from `rng(seed)` so output stays reproducible.
4. **Tokens, not literals.** Colours, fonts and surfaces come from custom properties.
5. **JSDoc on public functions,** including `@param`, `@returns`, and a one-line summary.
6. **Keep the smoke suite green, and extend it.** Behaviour that can be asserted without layout should arrive with assertions. CI runs it on every push and pull request.
7. **Sanitise at the boundary.** Any new path that brings outside markup into the DOM goes through `sanitizeHTML()`, and adds a case to the sanitisation group of the suite.
8. **Walk the manual matrix** on Chrome, Firefox and Safari before requesting review, and note in the PR what you exercised.
9. **Respect the frame budget.** New per-frame work must be culled, throttled, or delegated to CSS. Attach a Performance profile if you touch an animation loop.

Bug reports and feature requests have structured templates under `.github/ISSUE_TEMPLATE/`. Security issues follow the private disclosure process in `SECURITY.md` — do not open a public issue.

---

## License

MIT © 2024 Zazie Productions. Full text in [LICENSE.md](./LICENSE.md).

The typefaces loaded at runtime are licensed separately: JetBrains Mono, Space Grotesk and Orbitron are all under the SIL Open Font License 1.1.

---

## Further reading

| Document | Contents |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Layer model, coordinate transforms, state machine, event flow |
| [API.md](./API.md) | Function-level reference for the global surface |
| [CONFIGURATION.md](./CONFIGURATION.md) | Theming, tunable constants, embedding, offline setup |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Workflow, coding standards, review criteria |
| [SECURITY.md](./SECURITY.md) | Threat model and disclosure process |
| [SUPPORT.md](./SUPPORT.md) | Help routing and common questions |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [tests/smoke.mjs](./tests/smoke.mjs) | The executable specification for everything above |

<p align="center">
  <img src="void-oculus-detail.png" alt="VOID//OCULUS at 65 percent zoom: linked definition cards, a fragment shader panel, gaze telemetry charts, and THE WATCHER centerpiece iris" width="92%">
</p>

<p align="center"><sub>85 cards · 28 links · 61 eyes · all open</sub></p>
