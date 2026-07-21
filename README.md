# VOID//OCULUS

> The canvas is an eye.

<p align="center">
  <a href="https://zazieproductions.github.io/void-oculus/">
    <img
      src="void-oculus-preview.png"
      alt="VOID OCULUS full spatial knowledge interface"
      width="100%"
    >
  </a>
</p>

<p align="center">
  <a href="https://zazieproductions.github.io/void-oculus/">
    <strong>◉ ENTER THE OCULUS ◉</strong>
  </a>
</p>

**VOID//OCULUS** is an experimental browser-based infinite canvas and visual knowledge system combining draggable notes, diagrams, code fragments, linked nodes, animated particles, and a reactive ocular interface.

## Interface detail

<p align="center">
  <img
    src="void-oculus-detail.png"
    alt="VOID OCULUS detailed view of linked cards, diagrams, and the central ocular interface"
    width="88%"
  >
</p>

## Features

- Large pannable and zoomable canvas
- Draggable cards and multi-card selection
- Sticky notes, code blocks, definition cards, and eye nodes
- Visual links between cards
- Search, minimap, zoom controls, and status readouts
- Context menu for duplicating, layering, connecting, and deleting cards
- Animated particle field and scan-line effects
- Reactive eyes that track the pointer and blink
- Ocular boot animation, vignette, eyelid, and gaze effects
- Responsive toolbar behavior for smaller screens
- No installation or build step required

## Run locally

Download or clone the repository, then open `index.html` in a modern browser.

For more consistent browser behavior, serve it locally instead of opening it directly:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Controls

- **Select:** select and drag cards
- **Pan:** move around the canvas
- **Link:** click one card and then another to connect them
- **Note / Code / Def / Eye:** add new elements to the visible area
- **Mouse wheel:** zoom around the pointer
- **Right-click a card:** open its context menu
- **Shift-click:** add cards to the current selection
- **Minimap:** jump to another area of the board

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas and SVG
- D3.js 7.8.5, loaded from CDN
- Google Fonts, loaded remotely

## Project structure

```text
void-oculus/
├── index.html
├── README.md
└── .gitignore
```

## Deployment

Because this is a static site, it can be published directly with GitHub Pages, Netlify, Cloudflare Pages, or another static host.

### GitHub Pages

1. Upload the repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder.
5. Save.

GitHub will provide a public URL after deployment.

## Notes

The interface relies on remotely hosted fonts and D3.js, so an internet connection is needed for those resources unless they are downloaded and hosted locally.

## License

No license has been selected yet. Add a license before allowing reuse or redistribution by others.
