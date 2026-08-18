# VOID//OCULUS

**A spatial thinking surface that looks back at you.**

An infinite, pan-and-zoom knowledge canvas rendered entirely by the browser — no build step, no bundler, no server, no framework. One HTML file, three coordinate spaces, and a procedural ocular engine that draws every eye on the board from a single deterministic function.

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

The engineering thesis is that a coherent, atmospheric interface does not require a framework. The whole application is one 120 KB HTML file: 991 lines of CSS, 86 lines of markup, and 2,111 lines of JavaScript across two independent engines. It loads from `file://`, deploys as a static artifact, and has no package manifest, no lockfile, and no transitive dependency graph to audit.

**Intended for** people who think spatially — researchers, designers, producers and engineers building dense reference boards — and for developers who want a compact, readable reference implementation of an infinite canvas: transform math, hit routing, layered compositing, procedural SVG generation, and a soft real-time animation loop, all legible in a single file.

---

## What it does

### Canvas and navigation

- **Infinite pan/zoom** across an 8000 × 6000 px world, clamped to a scale range of `0.06`–`3.0` (a 50× dynamic range).
- **Cursor-anchored zoom**: the world point under the pointer stays under the pointer through a wheel gesture, computed by inverse-transforming before the scale change and re-solving pan afterwards.
- **Single composited transform**: one `translate() scale()` on the canvas root moves the entire scene, so pan and zoom cost the same whether the board holds 5 cards or 500.
- **Fovea map**: a 160 × 100 minimap rendering cards, connectors and the live viewport rectangle under an anisotropic 1:50 horizontal / 1:60 vertical projection, with click-to-recenter.
- **Telemetry bar**: world X/Y under the cursor, zoom percentage, card count, link count, registered eye count, and macro-iris dilation — all updated live.

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

Requires a browser with ES2020 support, CSS custom properties, `backdrop-filter` and SVG `clipPath`: Chrome/Edge 90+, Firefox 88+, Safari 14+. Internet Explorer is not supported.

**Network requirements.** The application logic is fully self-contained. One `@import` pulls three families from Google Fonts (JetBrains Mono, Space Grotesk, Orbitron); offline, the browser falls back to generic monospace and the layout survives with degraded typography. See [Offline and air-gapped deployment](#offline-and-air-gapped-deployment) to vendor them.

---

## Interaction model

### Pointer

| Action | Input |
|---|---|
| Select card | Click (SELECT tool) |
| Add to selection | Shift-click |
| Move card | Drag (SELECT tool) |
| Pan | Drag on empty canvas (PAN tool) or middle-mouse drag from any tool |
| Zoom | Wheel, anchored at cursor |
| Create link | LINK tool → click source → click target |
| Card actions | Right-click a card |
| Recenter | Click anywhere in the fovea map |

### Keyboard

| Key | Behaviour |
|---|---|
| `Space` (hold) | Temporarily switch to PAN; releasing restores SELECT |
| `Escape` | Cancel an in-flight link, clear the selection, return to SELECT |
| `Delete` / `Backspace` | Delete the current selection (suppressed unless `document.activeElement` is `<body>`, so text fields are never hijacked) |

### Toolbar

`SELECT` · `PAN` · `LINK` — mode switches, mutually exclusive, reflected in the active button state and the canvas cursor.
`+ NOTE` · `{ CODE` · `⌖ DEF` · `◉ EYE` — spawn a card into the visible region with jittered placement so repeated clicks fan out instead of stacking.
`⊡ FIT` · `✕ DESELECT` — restore the default framing; clear the selection.

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

### Event routing

All pointer interaction funnels through three document-level handlers plus one per-card handler, which keeps the listener count flat as the board grows:

```
mousedown  card    → connect / select / begin drag   (stopPropagation)
mousedown  canvas  → begin pan (PAN or middle-click) or begin marquee
mousemove  document→ update world cursor + telemetry
                   → pan, or drag + reflow connectors, or size the marquee
mouseup    document→ commit and reset all transient state
wheel      wrapper → cursor-anchored zoom, passive: false
contextmenu        → suppress native menu, route to card menu or dismiss
```

Cards call `stopPropagation` on `mousedown` so that card interaction and canvas interaction are mutually exclusive by construction rather than by hit-test guards scattered through both paths.

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

### Code map

| Region | Lines | Responsibility |
|---|---|---|
| Design tokens + component CSS | 8–998 | 27 custom properties, all card typologies, 13 keyframe animations, one responsive breakpoint |
| Markup | 1000–1085 | Chrome, overlays, canvas root — 86 lines total |
| Canvas engine | 1086–2322 | Transform, state, cards, connectors, events, minimap, particles, seeded board |
| Ocular engine | 2323–3196 | Seeded PRNG, `iris()`, gaze registry, blink scheduler, macro iris, ocular zones |

The two engines are separate `<script>` blocks with a single, explicit contract: the ocular engine is an IIFE that reads `state` and calls `createCard`/`showNotif`, and exports exactly one symbol back — `window.addEyeCard`. Everything else in it is private. Delete the second script block and the canvas still runs; the `◉ EYE` button is the only casualty.

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
| `renderConnectors` | Event-driven | Full SVG rebuild | Only on link add/delete, card delete, and during drags |
| `updateMinimap` | On transform + 1 Hz | 160 × 100 canvas repaint | Trivially small raster; the interval catches async layout settling |

Steady-state cost with no interaction is two RAF loops and one 260 ms timer. Nothing polls the DOM, nothing observes mutations, and no work is scheduled for elements outside the viewport.

---

## Technology stack

| Component | Version | Role |
|---|---|---|
| HTML5 | — | Single-file delivery; 86 lines of semantic chrome |
| CSS3 custom properties | — | 27-token design system; every colour, font and surface is a variable |
| Vanilla JavaScript | ES2020 | Both engines. Optional chaining, nullish coalescing, `Set`, template literals |
| Canvas 2D | — | Particle field and fovea map — raster where per-pixel cost matters |
| Inline SVG | — | Connectors and irises — vector where crispness at 50× zoom matters |
| Google Fonts | — | JetBrains Mono (UI/mono), Space Grotesk (body), Orbitron (display) |
| GitHub Actions | `configure-pages@v5`, `upload-pages-artifact@v5`, `deploy-pages@v5` | Static deployment on push to `main`, concurrency-guarded |
| Dependabot | v2 | Weekly GitHub Actions update PRs |

**Runtime JavaScript dependencies: zero.** The `<head>` still carries a `d3.min.js@7.8.5` script tag, but the codebase contains no D3 call sites — connectors, particles and the minimap are all hand-written. It is dead weight on the critical path and is tracked for removal in the [roadmap](#roadmap-proposed).

The choice of raster versus vector is per-subsystem rather than doctrinal: the particle field and minimap are pure raster because they redraw wholesale and never need hit-testing or scaling fidelity; connectors and irises are SVG because they must stay sharp across a 50× zoom range and inherit CSS custom properties (`--sclera`, `--vein`) directly into generated markup.

---

## Repository structure

```
void-oculus/
├── index.html                  # The entire application — CSS, markup, and both engines
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
    ├── dependabot.yml          # Weekly Actions updates
    ├── ISSUE_TEMPLATE/         # Structured bug report and feature request forms
    ├── PULL_REQUEST_TEMPLATE.md
    └── FUNDING.yml
```

Within `index.html`, the internal structure is enforced by banner comments and consistent section ordering — tokens, then components, then overlays in CSS; state, then transform, then cards, then connectors, then events, then seeded content in the canvas engine.

---

## Configuration

There are no environment variables. The application takes no runtime configuration, reads no config file, and requires no build-time substitution — a direct consequence of the static, dependency-free design. All customisation is done by editing declared constants at the top of their sections.

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

### Navigate and inspect

```js
resetView();                       // restore default framing
zoom(1.5, innerWidth/2, innerHeight/2);

state.cards.length;                // 85 on the seeded board
state.connections.length;          // 28
[...state.selectedCards];          // current selection, as ids

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
5. Right-click for layering, duplication and deletion.
6. Zoom out past ~24 % to watch the board resolve into the macro iris.

---

## Design principles

**No build step is a feature, not a limitation.** The distribution artifact is the source. There is no compilation gap between what you read and what runs, no source map to load, no toolchain to keep alive. `index.html` will open in a browser in 2035 exactly as it does today.

**Dependencies are liabilities.** No library is called at runtime, which means no supply-chain surface, no version drift, and nothing to audit. The two capabilities a visualisation library would have supplied here — path generation and data-joined DOM updates — are a few dozen lines each, written directly and read in one sitting.

**Determinism over novelty.** Seeded generation everywhere. A procedural system that changes on every reload cannot be reviewed, screenshotted, or regression-tested; one that is seeded can.

**One function per visual concept.** Every eye in the product routes through `iris()`. Every world transform routes through `applyTransform()`. Every connector through `renderConnectors()`. When a rendering concept has exactly one implementation, a fix is a fix everywhere.

**Push animation to the compositor.** JavaScript decides *what* should move; CSS transitions and keyframes decide *how* it interpolates. This is why 61 tracked eyes, 120 particles, a breathing macro iris and a scan-line overlay coexist without a frame-time crisis.

**The interface should have a point of view.** The lids, the cascade blink, the dilation coupling and the cursor that looks back are not chrome — they are the argument that a tool for looking at your own thinking should visibly be looking back. The theme is load-bearing, and it is implemented with the same rigour as the transform math.

**Direct state over abstraction.** With a single-file application and one writer per field, a reactive layer would add indirection without removing a class of bug. The trade is explicit: this design does not survive multi-writer concurrency, and the roadmap treats persistence and collaboration as the point where a real state layer becomes justified.

---

## Engineering considerations

### Performance

- One transform for the entire scene: pan/zoom cost is independent of card count.
- `will-change: transform` is scoped to eye globes and pupils — the elements that actually mutate every frame — rather than sprayed across all cards, avoiding needless layer promotion and GPU memory pressure.
- Gaze tracking culls to the viewport plus a 400 px margin and runs at half frame rate.
- Cached offset math replaces per-frame `getBoundingClientRect()`, so the gaze loop never forces synchronous layout.
- Card geometry is measured once after insertion (`setTimeout(…, 100)` lets layout settle) and cached on the state record for the minimap.
- **Known hot path:** `renderConnectors()` rebuilds every path on each `mousemove` during a card drag. At the seeded scale (28 links) this is imperceptible; at several hundred links it would need incremental updates — see the [roadmap](#roadmap-proposed).

### Security

- No network I/O after load, no cookies, no `localStorage`, no telemetry, no analytics, no third-party scripts other than the CDN tag noted above. Nothing you put on the board leaves the browser.
- The threat surface is therefore almost entirely supply chain. **Recommended hardening:** vendor the fonts and delete the unused D3 tag, then serve under a strict policy:

  ```
  Content-Security-Policy: default-src 'none'; img-src 'self' data:;
                           style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';
  ```

  (`'unsafe-inline'` is required by the single-file design; moving to hashed inline blocks is a viable hardening step and is on the roadmap.)
- Card content is injected via `innerHTML` from literals authored in-repo — safe as shipped, since no user-supplied string reaches the DOM. **Any future import, paste, or persistence feature must sanitise before injection**; this is called out in `SECURITY.md` and should be treated as a hard review gate.
- The GitHub Actions workflow follows least privilege: `contents: read`, `pages: write`, `id-token: write`, with OIDC-based deployment and a concurrency group that never cancels an in-flight production deploy.

### Accessibility

Assessed honestly, because the current state is mixed:

**Implemented** — semantic `<button>` elements for all toolbar controls, so they are natively focusable and keyboard-activatable; a real `<input>` for search; `Escape` as a universal cancel; delete-key handling explicitly gated on focus so text entry is never intercepted; a responsive breakpoint at 768 px that collapses labels and hides the search field.

**Not yet implemented** — no ARIA roles or live regions on the status bar and notifications; the canvas exposes no keyboard navigation model (cards cannot be reached or moved without a pointer); the custom gaze cursor replaces the system cursor; no `prefers-reduced-motion` handling, and the interface animates continuously; several metadata registers use 8 px letter-spaced type below comfortable contrast ratios.

The tracked remediations are, in priority order: a `prefers-reduced-motion` block disabling drift, breath, blink and scan-line animations; a roving-tabindex keyboard model for card focus and arrow-key movement; ARIA live regions for notifications and telemetry. These are proposals, not commitments — see the [roadmap](#roadmap-proposed).

### Reliability

- Defensive lookups throughout: `getCardCenter()` returns `null` for missing elements and every caller checks; connector rendering skips links with a dangling endpoint rather than throwing.
- Deleting a card prunes its connectors and its selection membership in the same operation, so no orphan state can persist.
- `scanEyes()` marks registrations with `data-reg`, making it idempotent — re-scanning a subtree cannot double-register an eye or double the animation cost.
- Duplicate ids are structurally impossible: a monotonic counter, never decremented, never reused.
- The macro iris, ambient eyes, and card eyes are all rebuilt from seeds on load, so there is no persisted state that can become corrupt. A reload is a guaranteed clean slate — which is also the reliability cost of having no persistence.

### Maintainability

- Public functions carry JSDoc with `@typedef` records for `Card`, `Connection` and `CanvasState`, so editors provide real type inference in a codebase with no type system.
- Banner comments partition both engines into named sections in a consistent order.
- The ocular engine is an IIFE with exactly one export, giving a genuine module boundary without a module system.
- Shared colours, fonts and surfaces resolve through custom properties, so a reskin is a single `:root` edit. Card-specific tints and generated SVG still carry literal hex values — the main outstanding cleanup in the stylesheet.
- Documentation is split by audience — architecture, API, configuration, contribution, security, support — rather than accumulating in one file.

---

## Testing and quality assurance

**There is no automated test suite.** The project is a zero-dependency static artifact with no test harness configured; adding one is the highest-value item on the roadmap. What exists today is a disciplined manual protocol, documented so it is repeatable rather than ad hoc.

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
| Responsive | Below 768 px | Toolbar labels collapse to glyphs; search hides; no horizontal overflow |

### Performance verification

Record a 10-second Performance profile while panning at 60 Hz. Expectations on mid-range 2020-era hardware: sustained 60 fps at default zoom, no layout thrash during the gaze loop (zero purple "Layout" bars inside RAF callbacks), and no unbounded growth in DOM node count across a 5-minute idle.

### Static checks

```bash
npx html-validate index.html     # structural HTML validation
npx prettier --check index.html  # formatting drift (not yet enforced in CI)
```

Neither is currently wired into CI. Adding an HTML validation job and a headless smoke test to `.github/workflows/` is proposed below.

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

1. Remove the unused D3 `<script>` tag from `<head>` — nothing references it.
2. Download the three font families, place them alongside `index.html`, and replace the Google Fonts `@import` at the top of the stylesheet with local `@font-face` declarations.
3. Verify: load with DevTools' network panel set to offline. The board must render fully; only typography should change if a font fails to resolve.

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
| Search box does nothing | Not yet implemented — see [Current limitations](#current-limitations) | — |
| Marquee draws but selects nothing | Not yet implemented — see [Current limitations](#current-limitations) | — |

---

## Current limitations

Documented deliberately. Each is a known gap in a shipped surface, not an unknown defect.

| Limitation | Detail |
|---|---|
| Search is inert | `#search-input` renders and is styled, but no handler is bound. Nothing filters. |
| Marquee does not commit | The selection rectangle draws correctly during a drag and is discarded on `mouseup` — no intersection test runs against card bounds. |
| Drag moves one card | Shift-click builds a multi-card selection, and `Delete` operates on all of it, but dragging translates only the pointed card. |
| No persistence | Nothing is written to storage. Every reload rebuilds the seeded board and discards user edits. |
| Cards are not editable | The default sticky reads "double-click to edit", but no editing affordance exists. Content is authored in code. |
| Mouse only | Handlers are bound to `mousedown`/`mousemove`/`mouseup`. Touch and pen input are unsupported; there is no pinch-zoom. |
| Unused dependency | The D3 v7.8.5 CDN tag is loaded and never called. |
| Unused SVG filters | `renderConnectors()` emits five `feGaussianBlur` glow filters per pass that no path references; bloom is achieved with a wide translucent underlay stroke instead. |
| Inert parameter | `createCard(type, x, y, content, extraClass)` accepts `extraClass` but never applies it. |
| No reduced-motion support | Continuous animation runs regardless of the user's OS-level motion preference. |

---

## Roadmap (proposed)

Nothing in this section is implemented. It is a prioritised set of proposals, ordered by the ratio of user value to structural risk.

**Close the documented gaps**
- Wire `#search-input` to a debounced filter that dims non-matching cards and fits the viewport to the matches.
- Complete marquee selection with an AABB intersection test against cached card geometry on `mouseup`.
- Extend dragging to translate the entire selection, with a single connector reflow per frame.
- Remove the unused D3 tag and the unreferenced SVG filter definitions.
- Add a `@media (prefers-reduced-motion: reduce)` block disabling drift, breath, blink, sweep and scan-line animations.

**Persistence and portability**
- Serialise `{ cards, connections, transform }` to JSON; import/export round-trip; autosave to `localStorage`.
- Sanitise all imported HTML through an allowlist before injection — a hard prerequisite for any of the above.
- In-place card editing via `contenteditable`, with content written back to the state record.

**Input and platform**
- Migrate to Pointer Events for unified mouse/touch/pen handling, with pinch-zoom and two-finger pan.
- Keyboard navigation: roving tabindex across cards, arrow-key movement, `Enter` to edit.
- ARIA live regions for notifications and the telemetry bar.

**Scale**
- Incremental connector updates keyed by card id, replacing the full rebuild during drags.
- DOM virtualisation for cards outside the viewport, reusing the culling logic already proven in the gaze loop.
- Spatial index (quadtree) over card bounds to make hit-testing, marquee selection and culling sublinear.

**Quality infrastructure**
- Headless smoke test in CI: load the page, assert zero console errors, assert `state.cards.length === 85`, assert eye registration count.
- Visual regression snapshots — cheap and reliable precisely because generation is seeded.
- HTML validation and formatting checks as required status checks.

---

## Contributing

Contributions are welcome. Read `CONTRIBUTING.md` for the full standard; the summary:

```bash
git checkout -b feature/your-change
# edit index.html
python3 -m http.server 8000     # verify against the manual matrix above
git commit -m "Add: concise description"
git push origin feature/your-change
```

Non-negotiables for review:

1. **Preserve the single-file architecture.** Every change lands in `index.html`. If a change genuinely requires a build step, open an issue first — it is an architectural decision, not an implementation detail.
2. **No new runtime dependencies.** The zero-dependency property is a headline feature.
3. **Seeded, not random.** Any new procedural element must draw from `rng(seed)` so output stays reproducible.
4. **Tokens, not literals.** Colours, fonts and surfaces come from custom properties.
5. **JSDoc on public functions,** including `@param`, `@returns`, and a one-line summary.
6. **Walk the manual matrix** on Chrome, Firefox and Safari before requesting review, and note in the PR what you exercised.
7. **Respect the frame budget.** New per-frame work must be culled, throttled, or delegated to CSS. Attach a Performance profile if you touch an animation loop.

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

<p align="center">
  <img src="void-oculus-detail.png" alt="VOID//OCULUS at 65 percent zoom: linked definition cards, a fragment shader panel, gaze telemetry charts, and THE WATCHER centerpiece iris" width="92%">
</p>

<p align="center"><sub>85 cards · 28 links · 61 eyes · all open</sub></p>
