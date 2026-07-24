# Conventions

The documented norms that keep a single-file, framework-free codebase maintainable. These are enforced in code review; deviations require justification in the PR description.

---

## File Organization

`index.html` has a fixed macro-structure. **Preserve it.** New code goes into the section it belongs to, not at the end of the file.

```
<head>
  ├─ Meta + title
  ├─ D3.js <script> (pinned 7.8.5)
  ├─ Google Fonts <link>
  └─ <style>            ← ALL CSS, grouped by component, themed via :root variables
<body>
  ├─ Overlay & chrome markup (toolbar, search, status bar, minimap, context menu)
  ├─ #canvas-wrapper > #canvas > #connector-svg
  ├─ <script>  — CANVAS ENGINE (global scope)
  │    ├─ @fileoverview + JSDoc typedefs (Card, Connection, CanvasState)
  │    ├─ // ====== CANVAS STATE ======
  │    ├─ // ====== TRANSFORM ======
  │    ├─ // ====== CARD MANAGEMENT ======
  │    ├─ // ====== CONNECTIONS ======
  │    ├─ // ====== CONTEXT MENU / MINIMAP / PARTICLES ======
  │    └─ event wiring + buildCanvas()
  └─ <script>  — OCULUS ENGINE (IIFE; exposes only window.addEyeCard)
```

Two hard boundaries:

1. **Canvas engine ↔ Oculus engine.** The ocular IIFE may read the DOM but exposes exactly one global ([ADR-007](Design-Decisions#adr-007-ocular-engine-isolated-in-an-iife)). Don't add globals to it.
2. **State discipline.** All logical state lives in `state`; every mutation goes through a named function. The DOM is a projection, never the source of truth ([Architecture § State Model](Architecture#state-model)).

## JavaScript

- **Language level:** ES2020+ as shipped by browsers — `const`/`let`, arrow functions, template literals, optional chaining, nullish coalescing. **No transpiled-only syntax.**
- **No new dependencies** without an ADR. D3.js is the only permitted library ([ADR-004](Design-Decisions#adr-004-d3js-from-a-pinned-cdn-used-narrowly)).
- **JSDoc on every public function**, including `@param`, `@returns`, and types. Typedefs (`Card`, `Connection`, `CanvasState`) live at the top of the canvas engine.

```javascript
/**
 * Calculates the center point of a card in canvas coordinates.
 * @param {string} id - Card element ID
 * @returns {{x: number, y: number}|null} Center coordinates or null if not found
 */
function getCardCenter(id) { /* … */ }
```

- **Naming:** `camelCase` functions and variables; `UPPER_SNAKE` or short-caps constants (`PAL`, `MX`, `MY`, `MR`); DOM ids in `kebab-case` (`#connector-svg`, `#minimap-canvas`); card ids as `card-<n>`.
- **Meaningful names** — single letters only for loop counters and well-established math (`dx`, `cx1`).
- **Comment the why**, not the what. If a line needed thought (coordinate math, timing constants), it needs a comment.

## CSS

- **Theme via variables only.** Every color must reference a `:root` custom property; never hard-code hex in a component rule ([Configuration § Theming](Configuration#theming-css-custom-properties)).
- **Accent semantics are stable:** phosphor = primary, crimson = destructive, violet = ocular, amber = highlight, cyan = info.
- **BEM-flavored naming:** `.card`, `.card--selected` (state), `.card__header` (part). Existing classes like `.sticky-label`, `.code-header` predate this; match local style, apply BEM to new components.
- **Animation performance:** animate only `transform` and `opacity`; use `will-change: transform` sparingly and deliberately.

## HTML

- Semantic elements where they exist; `div` is acceptable for canvas geometry.
- Overlay layers that must not intercept input get `pointer-events: none`.
- Inline `onclick` is used for static chrome (context menu items, toolbar); dynamic elements attach listeners in JS (`setupCardInteraction()`). Follow the pattern of the surrounding code.

## Commit Messages

Format: `<Type>: <imperative summary ≤ 72 chars>`

| Type | Use |
|---|---|
| `Add:` | New feature or capability |
| `Fix:` | Bug fix |
| `Docs:` | Documentation only (repo docs or wiki) |
| `Style:` | Visual/CSS change with no behavior change |
| `Refactor:` | Behavior-preserving restructuring |
| `Perf:` | Performance improvement |
| `Chore:` | CI, tooling, housekeeping |

Examples:

```
Add: keyboard shortcut map for tool switching
Fix: drag offset drift at zoom levels below 0.1
Docs: document blink cascade timing in Architecture
```

Body (optional, wrapped at 72): motivation, approach, and any follow-up work. Reference issues with `Fixes #12`.

## Documentation Standards

- **English, present tense, active voice.** "The zoom clamps to 0.06–3.0", not "zoom will be clamped".
- **Precision over flourish:** name the function (`renderConnectors()`), the constant (`MR = 2450`), the file section.
- New public functions must be added to `API.md` and the wiki [API Reference](API-Reference) in the same PR.
- New terminology enters the [Glossary](Glossary) before it's used elsewhere.
- Changelog follows [Keep a Changelog](https://keepachangelog.com/); versioning follows [SemVer](https://semver.org/).
- Wiki pages: one H1, sentence-case headings from H2 down, tables for enumerable facts, Mermaid for flows/structures, cross-link on first mention of another page's concept.

## Performance Rules of Thumb

1. Batch DOM reads and writes; never interleave in a loop (layout thrashing).
2. Debounce or RAF-throttle high-frequency events (`mousemove`, `resize`, `wheel`).
3. Rebuild the connector SVG as one operation, not per-path mutations.
4. Keep per-frame work out of `updateMinimap()`-style periodic refreshers.

---

**See also:** [Development Workflow](Development-Workflow) · [Contributing](Contributing) · [Design Decisions](Design-Decisions)
