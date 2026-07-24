# Project Overview

**VOID//OCULUS** is an experimental browser-based infinite canvas and visual knowledge management system. It combines spatial arrangement of heterogeneous content blocks — sticky notes, code fragments, definition cards, and animated "eye" nodes — with an immersive ocular interface: procedurally generated irises, gaze tracking, blink cascades, particle fields, and CRT-style overlays.

The entire application ships as **one HTML file** (`index.html`) and runs fully client-side. There is no build step, no server, no database, and no account system.

- **Try it:** <https://zazieproductions.github.io/void-oculus/>
- **New here?** Continue to [Getting Started](Getting-Started).
- **Want internals?** Continue to [Architecture](Architecture).

---

## Scope

### What it is

| Capability | Description |
|---|---|
| Infinite canvas | 8000 × 6000 px virtual space with pointer-centric pan/zoom (scale 0.06–3.0) |
| Card system | Four card types placed, dragged, layered, duplicated, and deleted on the canvas |
| Visual linking | Cubic-bezier SVG connectors with neon glow between any two cards |
| Ocular engine | Procedural iris rendering, per-eye gaze tracking, randomized and cascade blinking |
| Spatial navigation | Minimap ("fovea map"), fit-to-view reset, status bar with position/zoom/entity counts |
| Ambience | D3-driven particle field, scan-line overlay, boot animation, vignette |

### What it is not (non-goals)

These are deliberate exclusions, each with recorded rationale in [Design Decisions](Design-Decisions):

- **Not a persistence tool.** Canvas state is in-memory only; a refresh clears everything ([ADR-005](Design-Decisions#adr-005-no-persistence-layer)).
- **Not a collaborative editor.** No networking, no multi-user sync.
- **Not a framework-based app.** No React/Vue/Svelte; vanilla ES2020+ by design ([ADR-002](Design-Decisions#adr-002-vanilla-javascript-no-framework)).
- **Not offline-first out of the box.** D3.js and fonts load from CDNs; offline operation requires the steps in [Configuration → Offline Deployment](Configuration#offline-deployment).

## Card Types

| Type | `data-type` | Purpose | Visual identity |
|---|---|---|---|
| Sticky Note | `sticky` | Quick notes, tasks, annotations | Color-coded label variants (green, red, violet, amber, cyan) |
| Code Block | `code` | Syntax-styled code snippets | Monospace body, window-chrome header with dots |
| Definition Card | `def` | Term–definition pairs with metadata line | Term highlighting in accent color |
| Eye Node | `eye` | Visual anchors / focal points | Procedural animated iris with gaze tracking |

See [API Reference → Card Operations](API-Reference#card-operations) for programmatic creation.

## Feature Status

| Feature | Status | Notes |
|---|---|---|
| Pan / zoom / fit-to-view | ✅ Shipped | `zoom()`, `resetView()` |
| Card create / drag / duplicate / layer / delete | ✅ Shipped | Context menu + toolbar |
| Multi-select (Shift-click, selection box) | ✅ Shipped | `state.selectedCards` (a `Set`) |
| Card linking | ✅ Shipped | LINK tool → click source → click target |
| Keyboard: Space (pan), Esc (deselect), Delete/Backspace | ✅ Shipped | Global `keydown` handler |
| Search bar | ⚠️ UI only | Input renders; filtering logic not yet implemented ([Troubleshooting](Troubleshooting#known-limitations)) |
| In-place card text editing | ⚠️ Placeholder | "double-click to edit" is placeholder copy; no edit handler yet |
| Persistence / export-import | ❌ Planned | See roadmap below |
| Touch gestures | ❌ Planned | Mouse-first today |

## Roadmap

Tracked in `ARCHITECTURE.md → Future Considerations` and GitHub issues:

- WebGL rendering for the particle system
- IndexedDB session persistence and canvas export/import
- WebSocket multi-user collaboration
- Expanded keyboard shortcuts; touch gesture support
- Plugin system for custom card types

## Assumptions

The system assumes:

1. **A modern evergreen browser** — ES2020, CSS custom properties, `transform` compositing (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).
2. **Network access at load time** for the D3.js CDN and Google Fonts (unless configured for [offline mode](Configuration#offline-deployment)).
3. **A pointing device.** Interaction is mouse/trackpad-driven; touch support is future work.
4. **Ephemeral sessions.** Users accept that content is not saved — the tool is a spatial thinking scratchpad, not a system of record.

## Dependencies

| Dependency | Version | Source | License | Failure mode if unavailable |
|---|---|---|---|---|
| D3.js | 7.8.5 (pinned) | `cdnjs.cloudflare.com` | ISC | Particle field and D3-based rendering fail; console errors |
| JetBrains Mono / Space Grotesk / Orbitron | latest | Google Fonts | OFL-1.1 | Fallback to system monospace/sans; cosmetic only |
| GitHub Actions (`actions/checkout@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v5`) | pinned major | GitHub | MIT | Deployment only; app unaffected |

Dependabot monitors the GitHub Actions ecosystem weekly (`.github/dependabot.yml`). There is intentionally no `package.json` — see [ADR-001](Design-Decisions#adr-001-single-file-zero-build-architecture).

## Repository Layout

```
void-oculus/
├── index.html                  # The entire application (CSS + HTML + JS, ~3,200 lines)
├── README.md                   # Landing documentation
├── ARCHITECTURE.md             # Technical deep-dive (mirrored by wiki Architecture page)
├── API.md                      # JS function reference (mirrored by wiki API Reference)
├── CONFIGURATION.md            # Customization guide
├── CONTRIBUTING.md             # Contribution process
├── SECURITY.md · SUPPORT.md · CHANGELOG.md · CODE_OF_CONDUCT.md · LICENSE.md
├── void-oculus-preview.png     # README hero image
├── void-oculus-detail.png      # README detail image
└── .github/
    ├── workflows/static.yml    # GitHub Pages deploy on push to main
    ├── dependabot.yml          # Weekly GitHub Actions updates
    ├── ISSUE_TEMPLATE/         # Bug report & feature request forms
    └── PULL_REQUEST_TEMPLATE.md
```

---

**Next:** [Architecture](Architecture) · [Getting Started](Getting-Started)
