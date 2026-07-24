# API Reference

The public JavaScript surface of VOID//OCULUS. All functions are defined in `index.html` and (except where noted) attached to the global scope, so everything here is callable from the browser console — the console **is** the REPL for this project.

> **Stability:** this API is "public" in the sense of *documented and console-accessible*. There is no semver guarantee on it yet; breaking changes are listed in `CHANGELOG.md`.

**Contents:** [State](#global-state) · [Canvas](#canvas-operations) · [Tools](#tool-operations) · [Cards](#card-operations) · [Creation helpers](#card-creation-helpers) · [Connections](#connection-operations) · [Context menu](#context-menu) · [Ocular engine](#ocular-engine) · [Notifications](#notifications)

---

## Global State

### `state`

The single source of truth (see [Architecture § State Model](Architecture#state-model)).

```javascript
state.cards          // Card[]      — { id, type, x, y, w, h }
state.connections    // Connection[]— { from, to, color, id }
state.selectedCards  // Set<string> — selected card IDs
state.tool           // 'select' | 'pan' | 'connect'
state.scale          // number      — zoom factor, clamped [0.06, 3.0]
state.x, state.y     // number      — pan offset in px
```

Read freely; **mutate only through the functions below**. After manual mutation in the console, call `applyTransform()` / `renderConnectors()` to re-project.

## Canvas Operations

### `applyTransform()`

Applies `state.x/y/scale` to `#canvas` as a CSS transform, updates the zoom readout, and refreshes the minimap. Call after any manual change to pan/zoom state.

```javascript
applyTransform()
```

### `zoom(factor, cx, cy)`

Zooms around a focal point, keeping the world point under `(cx, cy)` stationary. Scale clamps to `[0.06, 3.0]`.

| Parameter | Type | Description |
|---|---|---|
| `factor` | `number` | Multiplier — `1.2` zooms in 20%, `0.8` zooms out |
| `cx`, `cy` | `number?` | Focal point in viewport px (defaults to viewport center) |

```javascript
zoom(1.2)                 // in, centered
zoom(0.8)                 // out, centered
zoom(1.5, e.clientX, e.clientY)  // anchored at cursor
```

### `resetView()`

Restores the default view (`x: -600, y: -300, scale: 0.72`) — the FIT toolbar button.

## Tool Operations

### `setTool(t)`

Switches the active tool, updates toolbar highlighting and the cursor, and cancels any link-in-progress when leaving `connect`.

| `t` | Mode |
|---|---|
| `'select'` | Selection / drag (default) |
| `'pan'` | Canvas panning |
| `'connect'` | Two-click link creation |

## Card Operations

### `createCard(type, x, y, content, extraClass = '')`

Creates a card DOM element, registers it in `state.cards`, wires interaction, and returns the element.

| Parameter | Type | Description |
|---|---|---|
| `type` | `string` | `'sticky'` \| `'code'` \| `'def'` \| `'eye'` (custom types allowed — see [Configuration](Configuration#custom-card-type)) |
| `x`, `y` | `number` | Position in **canvas (world) coordinates** |
| `content` | `string` | Inner HTML for the card body |
| `extraClass` | `string?` | Additional CSS classes |

**Returns:** `HTMLElement`

```javascript
const note = createCard('sticky', 100, 200,
  '<div class="sticky sticky-cyan"><div class="sticky-label">NOTE</div>Hello</div>');
```

> ⚠️ `content` is injected via `innerHTML`. Pass only trusted markup — see [Security § XSS Considerations](Security#xss-considerations).

### `setupCardInteraction(card)`

Attaches `mousedown` (select/drag/link) and `contextmenu` handlers to a card element. `createCard()` calls this automatically; needed only for hand-built elements.

### `selectCard(card)` / `clearSelected()`

Add a card element to the selection set / clear the entire selection (removing the `selected-card` class).

### `deleteCard(id)`

Removes a card **and cascades**: DOM node, `state.cards` record, all connections touching it, selection membership; then re-renders connectors, minimap, and the status count.

```javascript
deleteCard('card-5')
```

## Card Creation Helpers

Each helper places a new card near the current viewport center (with slight randomization) and delegates to `createCard()`:

| Function | Creates | Notes |
|---|---|---|
| `addStickyNote()` | Sticky note | Random color variant and label (IDEA/TODO/…) |
| `addCodeBlock()` | Code block | Pre-filled `untitled.js` stub |
| `addDefCard()` | Definition card | TERM / definition placeholder |
| `addEyeCard()` | Animated eye node | Exposed by the oculus IIFE as `window.addEyeCard` |

```javascript
addStickyNote(); addCodeBlock(); addDefCard(); addEyeCard();
```

## Connection Operations

### `addConnection(from, to, color)`

Creates a link between two cards and re-renders the connector layer.

| Parameter | Type | Description |
|---|---|---|
| `from`, `to` | `string` | Source / target card IDs |
| `color` | `string?` | Hex color; random accent from the theme set if omitted |

```javascript
addConnection('card-1', 'card-2')
addConnection('card-1', 'card-3', '#ff0000')
```

### `getCardCenter(id)`

**Returns:** `{x, y}` center in canvas coordinates, or `null` if the card doesn't exist.

### `renderConnectors()`

Rebuilds the entire `#connector-svg` from `state.connections` as one batch (cubic beziers + glow filter). Runs automatically on topology changes and drag end; call manually after console-level mutation.

## Context Menu

### `showContextMenu(x, y, cardId)`

Opens the card context menu at viewport coordinates and records the target in `state.contextCard`.

### `ctxAction(action)`

Executes a context-menu action against `state.contextCard`:

| `action` | Effect |
|---|---|
| `'front'` / `'back'` | Adjust z-order |
| `'duplicate'` | Clone the card with an offset |
| `'connect'` | Enter link mode from this card |
| `'delete'` | `deleteCard()` cascade |

## Ocular Engine

Internals live in an IIFE ([ADR-007](Design-Decisions#adr-007-ocular-engine-isolated-in-an-iife)); the documented surface is:

### `iris(opt)` *(internal, documented for fork authors)*

Generates SVG markup for a procedural iris. Deterministic per `seed`.

| Option | Type | Default | Description |
|---|---|---|---|
| `size` | `number` | `160` | Eye diameter (px) |
| `pal` | `string` | `'phosphor'` | Palette key in `PAL` |
| `seed` | `number` | `1` | PRNG seed |
| `pupil` | `number` | `0.34` | Pupil radius ratio (0–1) |
| `fibers` | `number` | `60` | Stroma fiber count |
| `lids` | `boolean` | `true` | Eyelid shapes |
| `veins` | `boolean` | `true` | Sclera veins |
| `drift` | `boolean` | `false` | Fiber animation |

**Returns:** `string` (SVG markup)

### `scanEyes(root, worldX, worldY)` *(internal)*

Registers eye elements under `root` for gaze tracking and blink scheduling.

### `window.addEyeCard()`

The one intentional global export — creates an eye card at the viewport center (listed under [creation helpers](#card-creation-helpers)).

## Notifications

### `showNotif(message)`

Shows a transient toast for ~3.2 s.

```javascript
showNotif('⊸ LINK ESTABLISHED')
```

---

**See also:** [Architecture](Architecture) · [Configuration](Configuration) · repository `API.md` (kept in sync per [Conventions § Documentation Standards](Conventions#documentation-standards))
