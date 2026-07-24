# Configuration

VOID//OCULUS has no config file: **configuration is code**. All tunables live in `index.html` as CSS custom properties and JavaScript constants. This page catalogs them, states their defaults, and shows safe modification patterns.

> **Convention:** when changing a tunable in a fork, keep the original value in a trailing comment (`/* default: 8000px */`) so upstream merges stay reviewable.

---

## Theming (CSS custom properties)

The entire visual theme derives from CSS variables declared on `:root` in the `<style>` block:

```css
:root {
  /* Backgrounds */
  --bg: #0a0a0b;               /* Main background */
  --surface: #111113;          /* Card backgrounds */
  --surface2: #161618;         /* Elevated surfaces */
  --surface3: #1c1c1f;         /* Highest elevation */

  /* Borders */
  --border: #2a2a2e;
  --border-glow: #3a3a40;

  /* Accent families (each with dim/faint variants) */
  --phosphor: #00ff9d;         /* Primary accent */
  --crimson: #cc2233;          /* Warnings / delete */
  --violet: #7b4fff;           /* Eye accent */
  --amber: #ffaa00;            /* Progress / highlight */
  --cyan: #00ccff;             /* Info / links */

  /* Typography */
  --text-primary: #e8e8ec;
  --text-secondary: #888890;
  --text-dim: #555558;
  --mono: 'JetBrains Mono', monospace;
  --display: 'Orbitron', monospace;
  --body: 'Space Grotesk', sans-serif;
}
```

**Rules for theme changes:**

1. Never hard-code colors in components — always reference a variable ([Conventions § CSS](Conventions#css)).
2. Preserve the *semantic* meaning of accent families (crimson stays destructive, phosphor stays primary) even when changing hues.
3. Each accent has `-dim` and `-faint` (22-alpha) variants; update all three together.

### Example themes

```css
/* Light */
:root {
  --bg: #f5f5f7; --surface: #ffffff; --border: #d1d1d6;
  --text-primary: #1d1d1f; --text-secondary: #6e6e73;
  --phosphor: #00a854;   /* green re-tuned for light bg */
}

/* Neon purple */
:root {
  --bg: #0f0f1a;
  --phosphor: #bf5fff; --phosphor-dim: #9933ff;
  --violet: #ff5fff;
}
```

## Canvas Geometry

| Tunable | Default | Location | Notes |
|---|---|---|---|
| World size | 8000 × 6000 px | `#canvas { width; height; }` | The minimap scale (`updateMinimap()`: `cw = 8000, ch = 6000`) **must be updated to match** |
| Initial view | `x: -600, y: -300, scale: 0.72` | `state` initializer + `resetView()` | Change both places or FIT will diverge from first load |
| Zoom clamp | `[0.06, 3.0]` | `zoom()`: `Math.min(Math.max(...), 0.06), 3)` | Widening the lower bound magnifies float error in coordinate math — test drag accuracy at extremes |

## Ocular Engine

### Color palettes

`PAL` maps palette names to `[bright, dim, dark]` triples used by `iris()`:

```javascript
const PAL = {
  phosphor: ['#00ff9d', '#00cc7a', '#04231a'],
  crimson:  ['#ff2244', '#cc2233', '#26060c'],
  violet:   ['#9966ff', '#7b4fff', '#150a2e'],
  amber:    ['#ffaa00', '#cc8800', '#2a1c00'],
  cyan:     ['#00ccff', '#0099cc', '#04222e'],
  bone:     ['#e8e8ec', '#8a8a95', '#1b1b1f'],
};
```

### Iris generation options

```javascript
iris({
  size: 160,        // Eye diameter (px)
  pal: 'phosphor',  // Palette key from PAL
  seed: 1,          // Deterministic seed — same seed, same iris
  pupil: 0.34,      // Pupil radius ratio (0–1)
  fibers: 60,       // Stroma fiber count (perf-sensitive)
  lids: true,       // Eyelid shapes
  veins: true,      // Sclera veins
  drift: false,     // Animate fibers
  sweep: false      // Sweep animation
});
```

### Macro iris

The large decorative iris visible when zoomed out:

```javascript
const MX = 1560;   // World X of center
const MY = 1480;   // World Y of center
const MR = 2450;   // Radius (px)
```

### Blink timing

Individual blinks are randomized at **2.6–13.6 s** intervals; a synchronized cascade sweeps all eyes roughly every **40 s** (see `blink()` and the cascade scheduler in the oculus IIFE).

## Performance Tuning

| Lever | Effect | Guidance |
|---|---|---|
| Particle count (`initParticles()`) | Ambient density vs. frame budget | Reduce first on low-end hardware |
| `fibers` per iris | Iris detail vs. SVG node count | 60 default; 30 is visually acceptable |
| Eye count on canvas | Gaze loop cost | Off-screen eyes are culled, but on-screen eyes each cost per frame |
| Connector count | SVG rebuild cost on drag | Consider skipping sub-50 px connectors in `renderConnectors()` |

## Offline Deployment

The stock build requires network for D3.js and fonts. To remove that dependency:

**1. Vendor D3.js:**

```bash
curl -o d3.min.js https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js
```

**2. Vendor fonts** (or accept system-font fallback and delete the Google Fonts `<link>`):

```bash
mkdir -p fonts
# Download the woff2 files for JetBrains Mono, Space Grotesk, Orbitron
# from fonts.google.com, then write a local fonts.css with @font-face rules.
```

**3. Repoint `<head>` references in `index.html`:**

```html
<script src="./d3.min.js"></script>
<link href="./fonts.css" rel="stylesheet">
```

**4. (Recommended)** add [SRI hashes](Security#subresource-integrity-sri) if you keep any CDN reference.

Note: `.gitignore` excludes `*.min.js` — if you vendor D3 in a fork, either rename it (e.g., `vendor/d3.v7.8.5.js`) or amend the ignore rule deliberately.

## Integration Patterns

### Embed in an iframe

```html
<iframe src="https://zazieproductions.github.io/void-oculus/"
        width="100%" height="800" style="border:0"></iframe>
```

### Custom card type

Extend rather than modify: add a helper that delegates to `createCard()`:

```javascript
function addQuoteCard(x, y, quote, author) {
  const content = `
    <div class="quote-card">
      <div class="quote-text">"${quote}"</div>
      <div class="quote-author">— ${author}</div>
    </div>`;
  return createCard('quote', x, y, content);
}
```

Style the new type with theme variables, and register any interactive behavior via `setupCardInteraction()` conventions. See [API Reference § Card Operations](API-Reference#card-operations).

---

**See also:** [Architecture](Architecture) · [Security](Security) · [Deployment](Deployment)
