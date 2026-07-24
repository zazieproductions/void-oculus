# Troubleshooting

Symptom → cause → fix, ordered by frequency. If your issue isn't here, check the browser console first (`F12` / `Cmd+Option+I`) — this app fails loudly there — then [open an issue](https://github.com/zazieproductions/void-oculus/issues/new/choose) with console output attached.

---

## Diagnosis Order

1. **Console errors?** A red error on load almost always means a CDN fetch failed or an unsupported browser.
2. **`typeof d3`** in the console — `"undefined"` means D3 didn't load; everything downstream of particles/rendering degrades.
3. **`state`** — if it exists and looks sane, the engine booted; the problem is interaction- or rendering-level.

## Load & Rendering Issues

### Blank page / nothing renders

| Likely cause | Check | Fix |
|---|---|---|
| Unsupported browser | Console shows syntax errors (e.g., optional chaining) | Use Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+ |
| JavaScript disabled | Page is static text | Enable JavaScript |
| Corrupted download | `index.html` size ≪ 120 KB | Re-clone / re-download |

### Canvas loads but particles/effects are missing

| Likely cause | Check | Fix |
|---|---|---|
| D3 CDN blocked (offline, ad-blocker, corporate proxy) | `typeof d3 === 'undefined'`; failed request to `cdnjs.cloudflare.com` in the Network tab | Allow the CDN, or [vendor D3 locally](Configuration#offline-deployment) |
| Battery-saver / reduced-motion throttling | Animations resume when plugged in | Expected behavior; disable power-saving to compare |

### Wrong fonts (generic monospace everywhere)

Google Fonts is unreachable or blocked. Cosmetic only — vendor fonts per [Configuration § Offline Deployment](Configuration#offline-deployment) or ignore.

## Interaction Issues

### Can't drag cards

- The **PAN** tool is active — switch to **SELECT** (⊹). Space-hold also forces pan until released.
- You're dragging the canvas background, not the card — click directly on the card body.

### Can't connect cards

1. Activate the **LINK (⊸)** tool first.
2. Click the **source** card — expect the `⊸ SELECT TARGET NODE` notification.
3. Click a **different** card (clicking the source again does nothing).
4. Escape cancels a half-finished link; the tool auto-returns to SELECT after a successful link.

### Delete key doesn't delete

Deletion is intentionally ignored while any input has focus (guard: `document.activeElement === document.body`). Click empty canvas first, then Delete/Backspace.

### Cards jump or drift while dragging

This indicates a coordinate-math regression (viewport↔world conversion). Verify at zoom 100% (`resetView()`), then re-test at extremes. If reproducible on `main`, file a bug with your zoom level and browser — and see [Architecture § Coordinate Systems](Architecture#coordinate-systems) if you intend to fix it.

### Zoom feels wrong / off-center

Zoom anchors at the **cursor**, not the viewport center — this is intended. UI zoom buttons anchor at center. Trackpad pinch is interpreted as wheel events and varies by browser.

## Performance Issues

| Symptom | Mitigation |
|---|---|
| Choppy panning with many cards | Reduce visible card count; close other tabs; check DevTools Performance for long tasks |
| Slow with many eye nodes | Each on-screen eye costs per frame in `gazeLoop()`; delete unused eyes (off-screen ones are already culled) |
| Fan noise / high CPU at idle | Particle field + gaze loop run continuously; reduce particle count ([Configuration § Performance Tuning](Configuration#performance-tuning)) |
| Sluggish on integrated GPUs | Lower the browser zoom, shrink the window, or reduce iris `fibers` |

## Data Questions

### "I refreshed and lost everything"

Correct and by design — there is **no persistence** ([ADR-005](Design-Decisions#adr-005-no-persistence-layer)). Nothing was ever written to disk, cookies, or a server. Export/import is on the [roadmap](Project-Overview#roadmap).

### "Where is my data stored?"

Nowhere. RAM only, for the lifetime of the tab. See [Security § Threat Model](Security#threat-model).

## Known Limitations

Documented so nobody debugs them as defects:

| Limitation | Status |
|---|---|
| Search bar filters nothing (UI shell only) | Planned feature; input renders but has no handler |
| Card text isn't editable in place ("double-click to edit" is placeholder copy) | Planned feature |
| No touch/gesture support (mobile is view-mostly) | Planned; `#search-bar` hides on narrow viewports by design |
| No undo/redo | Planned |
| Keyboard shortcuts limited to Space / Escape / Delete | Expansion planned |
| No state persistence or export | Planned ([ADR-005](Design-Decisions#adr-005-no-persistence-layer)) |

## Reporting a Bug

Use the [bug report template](https://github.com/zazieproductions/void-oculus/issues/new/choose) and include:

1. Browser name + version, OS
2. Steps to reproduce from a fresh load
3. Expected vs. actual behavior
4. Console output (copy text, not just a screenshot)
5. Zoom level and rough card/link/eye counts (from the status bar)

---

**See also:** [Getting Started](Getting-Started) · [Testing](Testing) · [Configuration](Configuration)
