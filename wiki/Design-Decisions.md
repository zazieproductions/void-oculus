# Design Decisions

Architecture Decision Records (ADRs) for VOID//OCULUS. Each record captures the context, the decision, alternatives considered, and consequences — so future contributors change things *knowingly* rather than accidentally.

**Status legend:** ✅ Accepted · 🔄 Superseded · 🧪 Provisional

> **Convention:** New ADRs are appended with the next sequential number. Never edit an accepted ADR's decision retroactively; supersede it with a new one and cross-link both.

---

## ADR-001: Single-file, zero-build architecture

**Status:** ✅ Accepted

**Context.** The project is a self-contained creative tool. Distribution friction (installs, toolchains, node_modules) would harm its primary audience: people who want to open it and use it.

**Decision.** The entire application — markup, styles, and scripts — lives in one `index.html`. No bundler, no transpiler, no package manager, no `node_modules`.

**Alternatives considered.**
- *Vite/ESBuild + src tree:* better modularity, but introduces a toolchain, lockfiles, and a build artifact pipeline for an app that fits comfortably in one file.
- *Separate `style.css` / `app.js`:* marginal organization win; breaks the "download one file and it works" property.

**Consequences.**
- ✅ Deployment is `cp index.html` to any static host; the file is also portable via email/USB.
- ✅ Zero supply-chain surface beyond two CDNs.
- ⚠️ Diffs concentrate in one file; contributors must follow the internal section banners (`// ====== CANVAS STATE ======` etc.) documented in [Conventions](Conventions#file-organization).
- ⚠️ No tree-shaking or minification; acceptable at the current ~120 KB size.

---

## ADR-002: Vanilla JavaScript, no framework

**Status:** ✅ Accepted

**Context.** UI frameworks earn their cost when component trees are deep and state synchronization is complex. Here, state is a single object and the DOM is manipulated in a handful of well-named functions.

**Decision.** ES2020+ vanilla JavaScript. The only library is D3.js, used narrowly (see ADR-004).

**Consequences.**
- ✅ No framework version churn; the file will still run in a decade.
- ✅ Every behavior is greppable — no virtual-DOM indirection.
- ⚠️ Manual DOM/state discipline is required; the invariant "the DOM is a projection of `state`" ([Architecture § State Model](Architecture#state-model)) must be preserved by review.

---

## ADR-003: Hybrid rendering (DOM + SVG + Canvas)

**Status:** ✅ Accepted

**Context.** The app renders three very different workloads: interactive text-bearing cards, geometric link curves, and a dense ambient particle field.

**Decision.** Use the best-fit technology per layer:
- **DOM divs** for cards — free hit-testing, text layout, CSS theming.
- **SVG** for connectors — resolution-independent curves, CSS-stylable, native glow filters.
- **`<canvas>` 2D** for particles — immediate-mode raster is the only efficient option for hundreds of moving points.

**Alternatives considered.**
- *Everything in one `<canvas>`:* fastest, but re-implements text layout, hit-testing, focus, and selection from scratch.
- *Everything in SVG:* particle animation at that node count would thrash the retained-mode scene graph.

**Consequences.** Four compositor layers ([Architecture § Rendering Layers](Architecture#rendering-layers)); slightly more complex mental model, each layer maximally simple.

---

## ADR-004: D3.js from a pinned CDN, used narrowly

**Status:** ✅ Accepted

**Context.** Particle simulation and path generation benefit from D3's primitives, but pulling D3 into everything would couple the codebase to it.

**Decision.** Load `d3@7.8.5` (exact pin) from cdnjs. Restrict use to particle simulation and SVG path helpers. Core interaction code stays dependency-free.

**Consequences.**
- ✅ Version pinning guarantees reproducible behavior.
- ⚠️ First load requires network access; [Configuration → Offline Deployment](Configuration#offline-deployment) documents the self-hosting path, and [Security](Security#subresource-integrity-sri) recommends SRI for production forks.

---

## ADR-005: No persistence layer

**Status:** ✅ Accepted (revisit candidate — see roadmap)

**Context.** Persistence (localStorage/IndexedDB/export) adds schema versioning, migration, and privacy considerations.

**Decision.** Ship stateless. Every session starts from the built-in demo canvas (`buildCanvas()`); refresh discards user changes.

**Consequences.**
- ✅ Zero data-privacy surface: nothing is stored, transmitted, or tracked ([Security § Threat Model](Security#threat-model)).
- ⚠️ Users must be told clearly (README, [Getting Started](Getting-Started#important-nothing-is-saved)) that work is ephemeral.
- 🔭 IndexedDB persistence and JSON export/import are on the [roadmap](Project-Overview#roadmap); when implemented, this ADR should be superseded.

---

## ADR-006: Single CSS transform for pan/zoom

**Status:** ✅ Accepted

**Context.** Pan/zoom could be implemented by repositioning every card, or by transforming their common ancestor.

**Decision.** Apply one `translate(...) scale(...)` transform to `#canvas` with `transform-origin: 0 0` (`applyTransform()`). Zoom re-anchors around the cursor using world-coordinate math (`zoom()`).

**Consequences.**
- ✅ O(1) cost per frame regardless of card count; GPU-composited.
- ✅ Connector SVG nested inside `#canvas` inherits the transform for free.
- ⚠️ Event handlers must convert viewport → world coordinates explicitly ([Architecture § Coordinate Systems](Architecture#coordinate-systems)); this math is the most defect-prone area — test pan/zoom/drag together whenever touching it ([Testing](Testing#smoke-checklist)).

---

## ADR-007: Ocular engine isolated in an IIFE

**Status:** ✅ Accepted

**Context.** The decorative eye subsystem is substantial (~900 lines) but must never interfere with core canvas interaction.

**Decision.** Encapsulate it in an IIFE that exposes exactly one global, `window.addEyeCard`. Internals (`rng`, `iris`, `scanEyes`, `gazeLoop`, `blink`, `buildMacroIris`) stay private.

**Consequences.**
- ✅ The core engine can be reasoned about without the ocular code, and vice versa.
- ✅ The ocular layer is `pointer-events: none` — it can never swallow input.
- ⚠️ Console experimentation with iris internals requires temporarily exposing them; the [API Reference](API-Reference#ocular-engine) documents the intended public surface only.

---

## ADR-008: GitHub Pages via Actions as the reference deployment

**Status:** ✅ Accepted

**Context.** The project needs a zero-cost, zero-maintenance public deployment.

**Decision.** Deploy the repository root to GitHub Pages on every push to `main` using the first-party actions pipeline (`.github/workflows/static.yml`), with `pages: write` + `id-token: write` OIDC permissions and a `concurrency: pages` group to serialize deploys.

**Alternatives considered.** Netlify/Vercel/Cloudflare Pages all work (the app is host-agnostic; see [Deployment](Deployment#alternative-static-hosts)) but add a third-party account dependency for the canonical instance.

**Consequences.** `main` is effectively production — every merge deploys. This raises the bar for review on `main` (see [Development Workflow](Development-Workflow#branching-model)).

---

**See also:** [Architecture](Architecture) · [Conventions](Conventions) · [Project Overview § Assumptions](Project-Overview#assumptions)
