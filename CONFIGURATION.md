# Configuration Guide

Customize VOID//OCULUS to match your preferences or integrate with your workflow.

## CSS Variables

The entire visual theme is controlled via CSS custom properties in `:root`:

```css
:root {
  /* Backgrounds */
  --bg: #0a0a0b;              /* Main background */
  --surface: #111113;          /* Card backgrounds */
  --surface2: #161618;         /* Elevated surfaces */
  --surface3: #1c1c1f;         /* Highest elevation */
  
  /* Borders */
  --border: #2a2a2e;          /* Default borders */
  --border-glow: #3a3a40;     /* Hover borders */
  
  /* Phosphor Green (primary accent) */
  --phosphor: #00ff9d;        /* Main color */
  --phosphor-dim: #00cc7a;   /* Dimmed variant */
  --phosphor-faint: #00ff9d22; /* Transparency */
  
  /* Crimson (warnings/delete) */
  --crimson: #cc2233;
  --crimson-bright: #ff2244;
  --crimson-faint: #cc223322;
  
  /* Violet (eye accent) */
  --violet: #7b4fff;
  --violet-bright: #9966ff;
  --violet-faint: #7b4fff22;
  
  /* Amber (progress/highlight) */
  --amber: #ffaa00;
  --amber-faint: #ffaa0022;
  
  /* Cyan (info/links) */
  --cyan: #00ccff;
  --cyan-faint: #00ccff22;
  
  /* Typography */
  --text-primary: #e8e8ec;
  --text-secondary: #888890;
  --text-dim: #555558;
  
  /* Fonts */
  --mono: 'JetBrains Mono', monospace;
  --display: 'Orbitron', monospace;
  --body: 'Space Grotesk', sans-serif;
}
```

### Quick Theme Customization

To create a custom theme, copy and modify these variables:

```css
/* Dark Theme (Default) */
:root {
  --bg: #0a0a0b;
  --phosphor: #00ff9d;
}

/* Light Theme */
:root {
  --bg: #f5f5f7;
  --surface: #ffffff;
  --border: #d1d1d6;
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --phosphor: #00a854;  /* Green adjusted for light bg */
}

/* Neon Purple Theme */
:root {
  --bg: #0f0f1a;
  --phosphor: #bf5fff;
  --phosphor-dim: #9933ff;
  --violet: #ff5fff;
}
```

## Canvas Configuration

### Virtual Canvas Size

The default 8000×6000px canvas can be adjusted:

```javascript
// In index.html, modify the #canvas CSS:
#canvas {
  width: 12000px;   /* Default: 8000px */
  height: 8000px;   /* Default: 6000px */
}
```

### Zoom Limits

Adjust the minimum and maximum zoom levels:

```javascript
// In the zoom() function, modify these values:
state.scale = Math.min(Math.max(state.scale * factor, 0.1), 4);
//                                                      ↑ min  ↑ max
```

## Eye Configuration

### Default Eye Palette

Modify the default color palettes in the `PAL` object:

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

### Eye Generation Options

The `iris()` function accepts configuration options:

```javascript
iris({
  size: 160,      // Eye diameter in pixels
  pal: 'phosphor', // Color palette name
  seed: 1,        // Random seed for reproducibility
  pupil: 0.34,    // Pupil size ratio (0-1)
  fibers: 60,     // Number of iris fibers
  lids: true,     // Show eyelid shapes
  veins: true,    // Show sclera veins
  drift: false,   // Enable fiber animation
  sweep: false    // Enable sweep animation
});
```

### Macro Iris Position

The large decorative iris (visible when zoomed out):

```javascript
const MX = 1560;  // X position
const MY = 1480;  // Y position  
const MR = 2450;  // Radius
```

## Offline Deployment

To run without internet dependencies:

### 1. Download D3.js

```bash
curl -o d3.min.js https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js
```

### 2. Download Fonts

```bash
# JetBrains Mono
curl -o fonts/JetBrainsMono-Regular.woff2 https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2

# Space Grotesk
curl -o fonts/SpaceGrotesk-Regular.woff2 https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPb54C_k3HqUtEw.woff2

# Orbitron
curl -o fonts/Orbitron-Regular.woff2 https://fonts.gstatic.com/s/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy0.woff2
```

### 3. Update References

```html
<!-- Replace CDN links with local paths -->
<script src="./d3.min.js"></script>
<link href="./fonts.css" rel="stylesheet">
```

## Integration Examples

### Embed in iframe

```html
<iframe 
  src="index.html" 
  width="100%" 
  height="800px"
  style="border: 1px solid var(--border);"
></iframe>
```

### Embed in React

```jsx
function OcularCanvas() {
  useEffect(() => {
    // Load D3 if not already loaded
    if (!window.d3) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <iframe 
      src="/void-oculus/index.html" 
      title="VOID OCULUS"
      style={{ width: '100%', height: '100vh', border: 'none' }}
    />
  );
}
```

### Custom Card Type

Add a custom card type by extending the `createCard` function:

```javascript
function addQuoteCard(x, y, quote, author) {
  const content = `
    <div class="quote-card">
      <div class="quote-text">"${quote}"</div>
      <div class="quote-author">— ${author}</div>
    </div>
  `;
  return createCard('quote', x, y, content);
}
```

## Performance Tuning

### Particle Count

Adjust particle count for performance:

```javascript
// In the particle initialization section
const PARTICLE_COUNT = 150;  // Default: varies by viewport
```

### Connector Simplification

For large numbers of connections:

```javascript
// In renderConnectors(), skip rendering very small connections
if (Math.hypot(dx, dy) < 50) return;
```

---

*For advanced customization, refer to [ARCHITECTURE.md](./ARCHITECTURE.md)*
