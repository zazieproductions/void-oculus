# Testing

VOID//OCULUS currently has **no automated test suite** — a deliberate consequence of the zero-build architecture ([ADR-001](Design-Decisions#adr-001-single-file-zero-build-architecture)). Quality is maintained through a disciplined manual test protocol, console-driven verification, and a browser matrix. This page defines that protocol precisely so "manually tested" means the same thing to everyone.

---

## Testing Philosophy

1. **The console is the test harness.** Every public function is globally accessible ([API Reference](API-Reference)); deterministic checks run as console snippets.
2. **Coordinate math is the highest-risk area.** Any change touching pan/zoom/drag must be tested at both zoom extremes (0.06 and 3.0) — this is where historical defects cluster.
3. **Cross-browser is non-negotiable.** Compositing, wheel-event deltas, and font metrics differ meaningfully across engines.

## Smoke Checklist

Run before every PR (Chrome + Firefox minimum) and on the live URL after every deploy. Target time: ~5 minutes.

### Boot & chrome
- [ ] Page loads with boot animation; `⚡ OCULUS LOADED` notification appears
- [ ] Console shows **zero** errors or warnings
- [ ] Toolbar, search bar, status bar, and minimap all render

### Navigation
- [ ] Wheel zoom anchors at the cursor (point under cursor stays fixed)
- [ ] Zoom clamps at 6% and 300% without visual glitches
- [ ] PAN tool and Space-hold both pan; Space release returns to SELECT
- [ ] ⊡ FIT restores the default view exactly
- [ ] Minimap viewport rectangle tracks pan/zoom; clicking the minimap jumps

### Cards
- [ ] +NOTE, {CODE}, ⌖ DEF, ◉ EYE each create a card near the viewport center
- [ ] Drag is pixel-accurate at zoom 0.06, 0.72, and 3.0 (no offset drift)
- [ ] Shift-click builds multi-selection; drag on empty canvas rubber-band selects
- [ ] Context menu: Bring to Front / Send to Back / Duplicate / Connect / Delete all work
- [ ] Delete/Backspace removes the selection — but **not** while an input field has focus

### Connections
- [ ] LINK tool: source click shows `⊸ SELECT TARGET NODE`; target click draws the connector
- [ ] Connectors track both endpoints during card drag
- [ ] Deleting a linked card removes its connectors (no orphan paths in `#connector-svg`)
- [ ] Escape cancels a link-in-progress

### Ocular systems
- [ ] Eyes track the pointer; blinks occur; the ~40 s cascade fires
- [ ] Macro iris visible when zoomed out; DILATION % in the status bar responds to zoom
- [ ] Particle field animates without frame drops

## Console Verification Snippets

Deterministic checks for the riskiest logic:

```javascript
// 1. State/DOM consistency after a create/delete cycle
const before = state.cards.length;
addStickyNote();
console.assert(state.cards.length === before + 1, 'create failed');
const id = state.cards[state.cards.length - 1].id;
deleteCard(id);
console.assert(state.cards.length === before, 'delete failed');
console.assert(!document.getElementById(id), 'DOM orphan after delete');

// 2. Zoom anchor invariance: world point under a screen point must not move
const px = 400, py = 300;
const wx = (px - state.x) / state.scale, wy = (py - state.y) / state.scale;
zoom(1.5, px, py);
const wx2 = (px - state.x) / state.scale, wy2 = (py - state.y) / state.scale;
console.assert(Math.abs(wx - wx2) < 1e-6 && Math.abs(wy - wy2) < 1e-6, 'zoom anchor drift');

// 3. Connection cascade on delete
addStickyNote(); addStickyNote();
const [a, b] = state.cards.slice(-2).map(c => c.id);
addConnection(a, b);
deleteCard(a);
console.assert(!state.connections.some(c => c.from === a || c.to === a), 'orphan connection');
```

All three blocks must pass silently (no `console.assert` output).

## Browser Matrix

| Browser | Version | Cadence | Notes |
|---|---|---|---|
| Chrome | 90+ (latest stable in practice) | Every PR | Primary development target |
| Firefox | 88+ | Every PR | Different wheel deltas — verify zoom feel |
| Safari | 14+ | Before release | Compositing/backdrop differences; test on real macOS |
| Edge | 90+ | Before release | Chromium; usually tracks Chrome results |
| Internet Explorer | — | Never | Unsupported |

**Performance spot-check:** with ~30 cards, ~10 connections, and ~10 eyes on screen, panning and gaze animation should hold visually smooth (~60 fps pan, ~30 fps gaze loop) on mid-range hardware. Use DevTools Performance panel if in doubt.

## Regression Focus by Change Type

| If you touched… | Re-test with extra care |
|---|---|
| `zoom()`, `applyTransform()`, coordinate math | Snippet 2 above; drag accuracy at zoom extremes; minimap tracking |
| Card lifecycle (`createCard`, `deleteCard`, `ctxAction`) | Snippets 1 & 3; duplicate + delete cycles; status-bar counts |
| `renderConnectors()` / SVG | Connector correctness during drag; glow filter; many-link canvases |
| Oculus IIFE | Blink schedules, cascade, culling (eyes off-screen), no new globals leaked |
| CSS / theming | All card types in all accent variants; both zoom extremes; narrow viewport (`#search-bar` hides < mobile width) |
| Workflow YAML | A deploy on a fork before merging ([Deployment](Deployment#verifying-a-deploy)) |

## Future Automation

Planned, in order of value-for-effort (contributions welcome — see [Contributing](Contributing)):

1. **Playwright smoke suite** — boot, create/drag/link/delete, zoom-anchor assertion; runs headless in CI on PRs. Requires no change to the zero-build architecture (tests live in `test/`, dev-only).
2. **Console-assert harness** — promote the snippets above into a `?selftest=1` query-string mode that runs assertions on load and reports to the notification system.
3. **Visual regression** — screenshot diffs of the default canvas at fixed seeds (the iris PRNG is deterministic, which makes this feasible).

---

**See also:** [Development Workflow § Definition of Done](Development-Workflow#definition-of-done) · [Troubleshooting](Troubleshooting)
