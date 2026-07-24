# Getting Started

Everything needed to run VOID//OCULUS locally, understand the controls, and make a first change. Time required: **under five minutes** — there is no build step ([ADR-001](Design-Decisions#adr-001-single-file-zero-build-architecture)).

---

## Prerequisites

| Requirement | Minimum | Why |
|---|---|---|
| Browser | Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+ | ES2020 syntax, CSS custom properties, composited transforms |
| Network (first load) | Any | D3.js CDN + Google Fonts (see [offline mode](Configuration#offline-deployment) to remove this) |
| Git | Any recent | Only needed for development, not for use |
| Python 3 **or** Node.js | Optional | Only to run a local HTTP server |

Internet Explorer is **not supported**.

## Run It

### Option A — Open the file

```bash
git clone https://github.com/zazieproductions/void-oculus.git
cd void-oculus
# macOS
open index.html
# Linux
xdg-open index.html
# Windows
start index.html
```

Opening via `file://` works for normal use. Some browser APIs (clipboard, fullscreen) behave more consistently over HTTP — prefer Option B when developing.

### Option B — Local HTTP server (recommended for development)

```bash
cd void-oculus

# Python 3
python3 -m http.server 8000

# or Node.js
npx serve .
```

Visit <http://localhost:8000>. No hot reload exists — press **refresh** after editing `index.html`.

### Option C — Just use the hosted instance

<https://zazieproductions.github.io/void-oculus/>

## First Session Walkthrough

1. **Boot sequence.** An ocular boot animation plays; click through if prompted. A notification confirms: `⚡ OCULUS LOADED`.
2. **Look around.** Scroll to zoom (zoom centers on your cursor), drag empty space with the **PAN** tool (or hold **Space**) to move.
3. **Create a card.** Click **+NOTE** in the toolbar — a sticky note appears near the viewport center. Try **{CODE}**, **⌖ DEF**, and **◉ EYE** too.
4. **Move and select.** With **SELECT** active, drag cards. **Shift-click** for multi-select, or drag on empty canvas to rubber-band select.
5. **Link two cards.** Activate **LINK (⊸)**, click a source card (`⊸ SELECT TARGET NODE` appears), then a target card. A glowing bezier connector appears.
6. **Right-click a card** for the context menu: Bring to Front, Send to Back, Duplicate, Connect, Delete.
7. **Orient yourself.** The minimap (bottom corner) shows the whole 8000×6000 world; click it to jump. **⊡ FIT** resets the view. The status bar reports position, zoom, and entity counts.

### Important: nothing is saved

⚠️ Canvas state is in-memory only. **Refreshing the page discards all changes** — this is by design ([ADR-005](Design-Decisions#adr-005-no-persistence-layer)). Treat the canvas as a spatial scratchpad.

## Controls Reference

### Mouse

| Action | Input |
|---|---|
| Select card | Click (SELECT tool) |
| Multi-select | Shift + click, or drag a selection box on empty canvas |
| Drag card | Click + drag on card |
| Pan canvas | Drag empty canvas (PAN tool) or hold **Space** + drag |
| Zoom | Mouse wheel (anchored at cursor) |
| Link cards | LINK tool → click source → click target |
| Context menu | Right-click a card |
| Jump via minimap | Click a location on the minimap |

### Keyboard

| Key | Effect |
|---|---|
| **Space** (hold) | Temporary PAN tool; releases back to SELECT |
| **Escape** | Cancel link-in-progress, clear selection, return to SELECT |
| **Delete** / **Backspace** | Delete all selected cards (ignored while typing in an input) |

### Toolbar

| Tool | Glyph | Function |
|---|---|---|
| SELECT | ⊹ | Selection and drag (default) |
| PAN | ✦ | Canvas panning |
| LINK | ⊸ | Create a connection between two cards |
| +NOTE | + | Add sticky note |
| {CODE} | { | Add code block |
| ⌖ DEF | ⌖ | Add definition card |
| ◉ EYE | ◉ | Add animated eye node |
| ⊡ FIT | ⊡ | Reset view to default pan/zoom |
| ✕ DESELECT | ✕ | Clear selection |

## Verify Your Setup (development)

After cloning, confirm the app is healthy:

1. Serve locally (Option B) and open the browser console (`F12`).
2. **Expect zero errors** on load. A failed `d3.min.js` fetch means no network or a blocked CDN — see [Troubleshooting](Troubleshooting#canvas-loads-but-particleseffects-are-missing).
3. In the console, run a quick API sanity check:
   ```javascript
   addStickyNote();                 // a note appears
   state.cards.length;              // increments
   zoom(1.5);                       // zooms toward center
   resetView();                     // returns to origin
   ```

## Where to Go Next

- **Users:** [Configuration](Configuration) to theme and tune · [Troubleshooting](Troubleshooting) if something misbehaves
- **Contributors:** [Development Workflow](Development-Workflow) → [Conventions](Conventions) → [Contributing](Contributing)
- **Curious engineers:** [Architecture](Architecture) → [API Reference](API-Reference)
