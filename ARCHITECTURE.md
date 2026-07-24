# Architecture Overview

This document provides an in-depth technical explanation of VOID//OCULUS's architecture, design decisions, and implementation details.

## System Overview

VOID//OCULUS is a single-page application (SPA) that runs entirely in the browser with no build step or server dependencies. It implements an infinite canvas metaphor with a reactive ocular interface.

```
┌────────────────────────────────────────────────────────────────┐
│                        BROWSER RENDERER                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐ │
│  │ Particle │   │  Canvas  │   │Connector│   │   Ocular     │ │
│  │  Canvas  │   │  Layer   │   │   SVG   │   │   Overlay    │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              APPLICATION STATE (state object)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    EVENT HANDLERS                        │  │
│  │   Mouse │ Keyboard │ Touch │ Resize │ Context Menu       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Rendering Layers

### Layer 0: Particle Canvas

The `#particles-bg` canvas element runs a D3.js force simulation to render ambient floating particles. These particles:

- Drift slowly with randomized velocities
- React subtly to mouse proximity
- Provide atmospheric depth without impacting card interaction

**Performance note:** Particle count is capped to maintain 60fps on mid-range hardware.

### Layer 1: Grid Canvas

The `#canvas` div represents the infinite canvas space (8000×6000px). Cards are absolutely positioned div elements within this container. The entire canvas is transformed via CSS `translate()` and `scale()`.

```
#canvas {
  transform-origin: 0 0;
  transform: translate(panX, panY) scale(zoom);
}
```

### Layer 2: Connector SVG

The `#connector-svg` overlay renders bezier curves between connected cards. SVG is used instead of Canvas for:

- Crisp rendering at all zoom levels
- Easy styling via CSS
- Native support for paths and gradients

### Layer 3: Ocular Overlay

Fixed-position DOM elements for:
- Eyelids (vignette effect)
- Scan-line overlay
- Boot animation
- Notifications

## State Management

### Global State Object

```javascript
const state = {
  x: -600,                    // Pan offset X
  y: -300,                    // Pan offset Y
  scale: 0.72,                // Zoom level (0.06 - 3.0)
  tool: 'select',             // Current tool mode
  isDragging: false,          // Drag state
  isPanning: false,           // Pan state
  dragCard: null,             // Active drag target
  dragOffset: {x, y},         // Drag offset
  selectedCards: new Set(),   // Selection state
  contextCard: null,           // Context menu target
  connecting: {active, from},  // Link creation state
  connections: [],            // All card connections
  cards: [],                  // All cards
  nextId: 0,                  // ID counter
  mouseX: 0, mouseY: 0,       // Mouse position
  selectionStart: null,       // Selection box origin
};
```

### State Transitions

```
┌─────────────┐
│   IDLE      │
└──────┬──────┘
       │ click on card
       ▼
┌─────────────┐     ┌─────────────┐
│  SELECTED   │────▶│  DRAGGING   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ release           │ release
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   IDLE      │◀────│   IDLE      │
└─────────────┘     └─────────────┘
```

## Coordinate Systems

VOID//OCULUS operates in multiple coordinate spaces:

| Space | Origin | Units | Description |
|-------|--------|-------|-------------|
| Viewport | Top-left | CSS pixels | Screen coordinates |
| Canvas | Top-left | Canvas pixels | Transformed coordinates |
| World | Canvas origin | Canvas pixels | Pan/zoom independent |

### Coordinate Transformation

```javascript
// Viewport → Canvas
const canvasX = (mouseX - rect.left - state.x) / state.scale;
const canvasY = (mouseY - rect.top - state.y) / state.scale;

// Canvas → Viewport
const screenX = canvasX * state.scale + state.x + rect.left;
const screenY = canvasY * state.scale + state.y + rect.top;
```

## Card System

### Card Types

| Type | Data Attribute | Content Structure |
|------|-----------------|-------------------|
| Sticky | `data-type="sticky"` | Label + body text |
| Code | `data-type="code"` | Header + syntax-highlighted body |
| Definition | `data-type="def"` | Term + type + definition |
| Eye | `data-type="eye"` | SVG iris element |

### Card Lifecycle

1. **Creation** → `createCard()` generates DOM element
2. **Registration** → Added to `state.cards` array
3. **Interaction** → Event handlers attached via `setupCardInteraction()`
4. **Selection** → Added to `state.selectedCards` Set
5. **Deletion** → Removed from DOM and state arrays

## Link System

### Bezier Curve Calculation

Connections use cubic bezier curves for smooth S-shapes:

```javascript
// Calculate control points
const dx = to.x - from.x;
const cx1 = from.x + dx * 0.4;  // 40% along horizontal
const cy1 = from.y;               // Vertical from source
const cx2 = from.x + dx * 0.6;  // 60% along horizontal  
const cy2 = to.y;                 // Vertical to target

const path = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
```

### Glow Effect

SVG filters create the neon glow:

```xml
<filter id="glow">
  <feGaussianBlur stdDeviation="3" result="blur"/>
  <feMerge>
    <feMergeNode in="blur"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```

## Ocular Engine

### Iris Rendering

The `iris()` function generates procedurally animated irises:

1. **Sclera** — White outer layer with vein paths
2. **Stroma** — Radial fiber patterns using quadratic curves
3. **Crypts** — Dark elliptical voids in the iris
4. **Pupil** — Central black circle with highlight
5. **Limbal Ring** — Dark edge definition

### Gaze Tracking

Each eye element is registered in the `eyes[]` array with:
- Globe position (offset from card origin)
- Next blink time (randomized interval)
- Pupil reference (for micro-movements)

### Blink Animation

Blinks occur on two schedules:
- **Individual**: Random 2.6-13.6 second intervals
- **Cascade**: Synchronized wave across all eyes every 40 seconds

## Event System

### Pointer Events

All mouse interactions flow through pointer event handlers:

```
mousedown → determine action (select/drag/pan/connect)
mousemove → update position, apply deltas
mouseup   → finalize action, update state
```

### Wheel Events

Zoom centers on the mouse position using the formula:

```javascript
// World position before zoom
const worldX = (mouseX - state.x) / state.scale;
const worldY = (mouseY - state.y) / state.scale;

// Apply zoom
state.scale = state.scale * factor;

// Adjust pan to keep world position under mouse
state.x = mouseX - worldX * state.scale;
state.y = mouseY - worldY * state.scale;
```

## Performance Optimizations

| Technique | Implementation |
|-----------|----------------|
| GPU Compositing | Cards use `will-change: transform` |
| Debouncing | Connector re-render on drag end |
| RAF Throttling | Gaze loop runs at ~30fps |
| Culling | Off-screen eyes skip render |
| Batch DOM | Connector SVG rebuilt as single operation |

## Future Considerations

- [ ] WebGL rendering for particle system
- [ ] IndexedDB for session persistence
- [ ] WebSocket for multi-user collaboration
- [ ] Keyboard shortcuts
- [ ] Touch gesture support
- [ ] Export/import canvas state
- [ ] Plugin system for custom card types
