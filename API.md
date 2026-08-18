# JavaScript API Reference

This document provides a reference for the JavaScript functions available in VOID//OCULUS.

## Global State

### `state`

The central state object containing all canvas data.

```javascript
state.cards          // Array of card objects
state.connections    // Array of connection objects
state.selectedCards  // Set of selected card IDs
state.tool           // Current tool mode
state.scale          // Zoom level
state.x              // Pan offset X
state.y              // Pan offset Y
```

## Canvas Operations

### `applyTransform()`

Applies the current pan and zoom transform to the canvas.

```javascript
applyTransform()
```

### `zoom(factor, cx, cy)`

Zooms the canvas around a focal point.

| Parameter | Type | Description |
|-----------|------|-------------|
| `factor` | number | Zoom multiplier (e.g., 1.2 for 20% increase) |
| `cx` | number | Focal point X in viewport coords (optional) |
| `cy` | number | Focal point Y in viewport coords (optional) |

```javascript
// Zoom in 20%
zoom(1.2)

// Zoom out 20%
zoom(0.8)

// Zoom around specific point
zoom(1.5, mouseX, mouseY)
```

### `resetView()`

Resets the canvas to the default pan and zoom state.

```javascript
resetView()
```

## Tool Operations

### `setTool(t)`

Sets the active tool mode.

| Parameter | Type | Description |
|-----------|------|-------------|
| `t` | string | Tool name: `'select'`, `'pan'`, or `'connect'` |

```javascript
setTool('select')   // Enable selection/drag mode
setTool('pan')      // Enable canvas panning
setTool('connect')  // Enable card linking mode
```

## Card Operations

### `createCard(type, x, y, content, extraClass, opts)`

Creates a new card element on the canvas.

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Card type: `'sticky'`, `'code'`, `'def'`, `'eye'`, … |
| `x` | number | X position in canvas coordinates |
| `y` | number | Y position in canvas coordinates |
| `content` | string | HTML content for the card |
| `extraClass` | string | Additional CSS classes applied to the card root (optional) |
| `opts.id` | string | Reuse a persisted identifier instead of allocating one (restore path) |
| `opts.z` | string\|number | Restore an explicit `z-index` |
| `opts.silent` | boolean | Suppress per-card save and measure churn during bulk rehydration |

**Returns:** `HTMLElement` — The created card DOM element

```javascript
// Create a sticky note
const note = createCard('sticky', 100, 200, 
  '<div class="sticky">My note content</div>');

// Create a code block
const code = createCard('code', 300, 400,
  '<div class="code-block">console.log("hello")</div>');

// Create a definition
const def = createCard('def', 500, 600,
  '<div class="def-term">API</div><div class="def-text">Definition here</div>');
```

### `setupCardInteraction(card)`

Attaches mouse event handlers to a card.

| Parameter | Type | Description |
|-----------|------|-------------|
| `card` | HTMLElement | The card DOM element |

```javascript
setupCardInteraction(cardElement)
```

### `selectCard(card)`

Selects a card and adds it to the selection set.

| Parameter | Type | Description |
|-----------|------|-------------|
| `card` | HTMLElement | The card DOM element |

```javascript
selectCard(document.getElementById('card-5'))
```

### `clearSelected()`

Deselects all selected cards.

```javascript
clearSelected()
```

### `deleteCard(id)`

Removes a card and its connections.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Card element ID |

```javascript
deleteCard('card-5')
```

## Card Creation Helpers

### `addStickyNote(x, y)`

Adds a new sticky note near the viewport center or at coordinates.

| Parameter | Type | Description |
|-----------|------|-------------|
| `x` | number | X position (optional, defaults to viewport center) |
| `y` | number | Y position (optional, defaults to viewport center) |

```javascript
addStickyNote()           // Adds at viewport center
addStickyNote(100, 200)   // Adds at specific position
```

### `addCodeBlock(x, y)`

Adds a new code block.

```javascript
addCodeBlock()            // At viewport center
addCodeBlock(150, 250)    // At specific position
```

### `addDefCard(x, y)`

Adds a new definition card.

```javascript
addDefCard()              // At viewport center
addDefCard(200, 300)      // At specific position
```

### `addEyeCard(x, y)`

Adds a new animated eye card.

```javascript
addEyeCard()              // At viewport center
addEyeCard(250, 350)      // At specific position
```

## Connection Operations

### `addConnection(from, to, color)`

Creates a visual connection between two cards.

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Source card ID |
| `to` | string | Target card ID |
| `color` | string | Hex color for the connector (optional, random if omitted) |

```javascript
// Connect two cards
addConnection('card-1', 'card-2')

// Connect with specific color
addConnection('card-1', 'card-3', '#ff0000')
```

### `getCardCenter(id)`

Calculates the center point of a card.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Card element ID |

**Returns:** `{x: number, y: number}` — Center coordinates, or `null` if not found

```javascript
const center = getCardCenter('card-5')
if (center) {
  console.log(`Center: ${center.x}, ${center.y}`)
}
```

### `renderConnectors()`

Renders all card connections as SVG bezier curves.

```javascript
renderConnectors()
```

## Context Menu

### `showContextMenu(x, y, cardId)`

Displays the context menu for a card.

| Parameter | Type | Description |
|-----------|------|-------------|
| `x` | number | X position in viewport coordinates |
| `y` | number | Y position in viewport coordinates |
| `cardId` | string | ID of the target card |

### `ctxAction(action)`

Executes a context menu action.

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | Action: `'front'`, `'back'`, `'duplicate'`, `'connect'`, `'delete'` |

## Ocular Engine

### `iris(opt)`

Generates SVG for a procedural iris.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opt.size` | number | Eye diameter in pixels (default: 160) |
| `opt.pal` | string | Color palette (default: 'phosphor') |
| `opt.seed` | number | Random seed (default: 1) |
| `opt.pupil` | number | Pupil size ratio 0-1 (default: 0.34) |
| `opt.fibers` | number | Iris fiber count (default: 60) |
| `opt.lids` | boolean | Show eyelids (default: true) |
| `opt.veins` | boolean | Show veins (default: true) |
| `opt.drift` | boolean | Animate fibers (default: false) |

**Returns:** `string` — SVG markup

```javascript
// Generate a small cyan eye
const eyeSvg = iris({
  size: 80,
  pal: 'cyan',
  seed: 42
})
```

### `scanEyes(root, worldX, worldY)`

Scans for eye elements and registers them for gaze tracking. Idempotent —
already-registered eyes are marked with `data-reg` and skipped, so re-scanning a
subtree cannot double-register or double the animation cost.

```javascript
scanEyes(canvasElement, 1000, 800)
```

> `iris()` and `scanEyes()` are exported from the ocular engine onto `window`
> alongside `addEyeCard()`. Generating an iris only produces markup; a card is
> not gaze-tracked until it has been scanned.

## Search

### `applySearch(query)`

Filters the board by substring match against each card's rendered text. Matching
cards receive `.search-hit`; the rest receive `.search-dim` and become
click-through. An empty query restores everything.

**Returns:** `number` — count of matching cards

```javascript
applySearch('saccade')   // → 3
```

### `clearSearch()`

Clears the input and restores full visibility.

### `fitToMatches()`

Frames the viewport on the current match set with a 120px world-space margin.
No-op when nothing matches.

## Selection and Editing

### `commitMarquee()`

Selects every card whose axis-aligned bounding box intersects the active marquee
rectangle. Rectangles under 4px on both axes are treated as clicks and ignored.
Called automatically on `pointerup`.

### `beginEdit(card, event)`

Puts the nearest editable region of `card` into `contenteditable` mode, placing
the caret at the event's coordinates. Commits on blur or `Escape`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `card` | HTMLElement | The card to edit |
| `event` | MouseEvent | Originating double-click, used for caret placement |

## Session Persistence

### `saveSession()`

Serialises the board to `localStorage` immediately. Normally reached through
`scheduleSave()`.

### `scheduleSave(delay)`

Coalesces a session write. Every mutation calls this; the write lands once the
board has been quiet for `delay` ms (default `600`).

### `restoreSession()`

Rebuilds the board from a stored snapshot. All-or-nothing: any structural
problem tears down the partial board and returns `false`.

**Returns:** `boolean` — true when the board came from storage

### `resetBoard()`

Discards the saved session and reloads, rebuilding the seeded board.

### `sanitizeHTML(html)`

Filters untrusted markup through a tag allowlist and attribute deny policy.
Parsing occurs inside an inert `<template>`, so nothing executes.

**Returns:** `string` — markup safe to assign to `innerHTML`

```javascript
sanitizeHTML('<img src=x onerror=alert(1)><b>ok</b>')   // → '<b>ok</b>'
```

## Runtime Namespace

### `VO`

The only shared mutable surface between the canvas engine and the ocular engine.

| Property | Type | Description |
|----------|------|-------------|
| `VO.restored` | boolean | Board came from storage rather than the seeded builders |
| `VO.pendingEyes` | HTMLElement[] | Restored cards awaiting iris rehydration and gaze registration |
| `VO.reducedMotion` | boolean | Mirrors `prefers-reduced-motion` |
| `VO.storage` | boolean | `localStorage` is writable |
| `VO.booting` | boolean | Suppresses session writes during startup |

## Notifications

### `showNotif(message)`

Displays a temporary notification.

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | string | Notification text |

```javascript
showNotif('⊸ LINK ESTABLISHED')
```

---

*Last updated: 2024*
