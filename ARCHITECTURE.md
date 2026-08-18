# VOID//OCULUS — Architecture

> Visual design review of the repository as it actually exists at commit `70249b0`.
> Every diagram below was derived by reading `index.html`, `.github/`, and the repository
> metadata. Nothing that is not in the repository is drawn as if it existed; anything
> uncertain is explicitly marked **[unknown]**, **[inferred]** or **[proposed]**.

---

## 0. One-paragraph summary

VOID//OCULUS is a **zero-dependency-at-build-time, single-artifact web application**. The entire
product — markup, ~990 lines of CSS, and two classic (non-module) `<script>` blocks totalling
~2100 lines of JavaScript — lives in one file, `index.html` (3197 lines). There is **no backend, no
database, no API server, no package manager, no bundler and no test suite**. The only runtime
"services" are the static host (GitHub Pages) and two third-party CDNs (`cdnjs.cloudflare.com`,
`fonts.googleapis.com`). All application state is a single mutable global `state` object plus a
module-private `eyes[]` registry; the DOM itself is the second, redundant source of truth. The
"pipeline" is a single GitHub Actions workflow that uploads the repository root verbatim to Pages.

| Dimension | Reality in this repo |
|---|---|
| Runtime tiers | 1 (browser) |
| Deployable artifacts | 1 (`index.html` + 2 PNGs) |
| Build step | none |
| Automated tests | none |
| Persistence | none — in-memory only, lost on refresh |
| Auth | none in the app; only GitHub OIDC in CI |
| External integrations | cdnjs (D3), Google Fonts |

---

## 1. High-level system architecture

**What it shows:** the complete set of runtime participants and the only network calls the system
makes. The browser tab is the entire application tier; everything outside `Client Runtime` is a
third-party or hosting concern.

```mermaid
flowchart LR
  User(["Operator<br/>mouse · wheel · keyboard"])

  subgraph Client["Client Runtime — one browser tab"]
    direction TB
    subgraph Doc["index.html — single deployable artifact"]
      CSS["CSS layer<br/>lines 8-998<br/>176 rules · 13 keyframes"]
      DOM["Static DOM skeleton<br/>lines 1000-1085<br/>toolbar · minimap · overlays"]
      S1["Script A — Canvas Engine<br/>lines 1086-2322"]
      S2["Script B — Oculus Engine IIFE<br/>lines 2323-3196"]
    end
    WEBAPI["Browser Web APIs<br/>DOM · Canvas2D · SVG · rAF · timers"]
  end

  subgraph Edge["Static hosting — no application code"]
    PAGES[["GitHub Pages CDN<br/>zazieproductions.github.io/void-oculus"]]
  end

  subgraph Third["External third parties"]
    CDNJS[["cdnjs.cloudflare.com<br/>d3.min.js 7.8.5"]]
    GFONTS[["fonts.googleapis.com + gstatic<br/>JetBrains Mono · Space Grotesk · Orbitron"]]
  end

  subgraph CI["Build and release plane"]
    GHA["GitHub Actions<br/>.github/workflows/static.yml"]
    REPO[("Git repository<br/>branch main")]
  end

  User -->|"pointer and key events"| DOM
  DOM --> S1
  S1 -->|"shared globals: state, createCard, canvas"| S2
  S1 --> WEBAPI
  S2 --> WEBAPI
  WEBAPI -->|"pixels"| User

  User -->|"HTTPS GET /"| PAGES
  PAGES -->|"index.html + png"| Doc
  Doc -->|"HTTPS GET blocking script"| CDNJS
  CSS -->|"HTTPS GET css2 @import"| GFONTS

  REPO -->|"push to main / workflow_dispatch"| GHA
  GHA -->|"upload-pages-artifact v5 · deploy-pages v5"| PAGES

  classDef ext fill:#1c1c1f,stroke:#ffaa00,color:#ffaa00
  classDef infra fill:#1c1c1f,stroke:#00ccff,color:#00ccff
  classDef code fill:#111113,stroke:#00ff9d,color:#00ff9d
  class CDNJS,GFONTS ext
  class PAGES,GHA,REPO infra
  class CSS,DOM,S1,S2,WEBAPI code
```

> **Note on D3.js:** `d3.min.js` is loaded as a **render-blocking `<script>` in `<head>`** but
> `grep -n "d3\." index.html` returns **only the script tag**. No D3 symbol is ever referenced.
> The dependency is currently **dead weight and an unnecessary third-party trust relationship**
> (see §15 and §17).

---

## 2. Repository and module dependency map

**What it shows:** every file in the repository and the direction of dependency between them.
Because there is no module system, the two script blocks are coupled through the **global lexical
scope**, not through imports — the arrows labelled *global scope* are the real coupling.

```mermaid
flowchart TB
  subgraph Runtime["Shipped at runtime"]
    IDX["index.html"]
    P1["void-oculus-preview.png"]
    P2["void-oculus-detail.png"]
  end

  subgraph Inside["Inside index.html — implicit modules"]
    direction LR
    M0["head: CDN script tag + font import"]
    M1["style block: design tokens in :root"]
    M2["body: static DOM skeleton"]
    M3["Script A: Canvas Engine<br/>state · transform · cards · connections<br/>events · context menu · minimap · particles<br/>buildCanvas 7 zones"]
    M4["Script B: Oculus Engine<br/>rng · iris · scanEyes · gazeLoop · blink<br/>macro iris · background eyes · buildOculus<br/>gaze cursor · boot iris"]
  end

  subgraph Docs["Documentation — not shipped logic"]
    RM["README.md"]
    AR["ARCHITECTURE.md"]
    AP["API.md"]
    CF["CONFIGURATION.md"]
    CH["CHANGELOG.md"]
    SE["SECURITY.md"]
    CO["CONTRIBUTING.md"]
    OTH["CODE_OF_CONDUCT · SUPPORT · LICENSE"]
  end

  subgraph Ops[".github — repository automation"]
    WF["workflows/static.yml"]
    DEP["dependabot.yml<br/>ecosystem: github-actions"]
    TPL["ISSUE_TEMPLATE/* · PULL_REQUEST_TEMPLATE.md · FUNDING.yml"]
  end

  IDX --> M0 --> M1 --> M2 --> M3 --> M4
  M3 -->|"reads globals: canvas, state"| M2
  M4 -->|"global scope: state, createCard, addConnection, showNotif, updateMinimapCards, canvas"| M3
  M3 -->|"global scope: window.addEyeCard consumed by toolbar onclick"| M4
  M2 -->|"inline onclick handlers"| M3

  RM --> IDX
  AR --> IDX
  AP --> M3
  AP --> M4
  CF --> M1
  SE --> M0
  WF -->|"path: '.' uploads whole repo"| IDX
  WF --> P1
  WF --> P2
  DEP -->|"weekly PRs"| WF
  RM --> P1
  RM --> P2

  classDef doc fill:#111113,stroke:#555558,color:#888890
  classDef ops fill:#1c1c1f,stroke:#00ccff,color:#00ccff
  class RM,AR,AP,CF,CH,SE,CO,OTH doc
  class WF,DEP,TPL ops
```

**Dependency boundary rules observable in the code**

| Boundary | Enforcement | Strength |
|---|---|---|
| Script B → Script A | none — plain global reads (`state`, `createCard`, `canvas`) | very weak, load-order dependent |
| Script A → Script B | one named contract: `window.addEyeCard` | weak, but explicit |
| DOM → Script A | inline `onclick="setTool('select')"` etc. in markup | hard-coded, requires globals to stay global |
| CSS → JS | shared `:root` custom properties and class names (`.blink`, `.dragging`, `.selected-card`) | convention only |

---

## 3. Frontend component hierarchy

**What it shows:** the actual DOM tree created by `index.html` plus the nodes injected at runtime,
grouped by stacking context. `z-index` values are read directly from the stylesheet.

```mermaid
flowchart TB
  BODY["body"]

  subgraph Fixed["Fixed overlay plane — viewport space"]
    direction TB
    SL[".scan-line — z 900"]
    VIG["ocular-vignette — z 890"]
    LT["lid-top / lid-bottom .lid-shade + .lash"]
    GC["gaze-cursor — z 1200<br/>34px iris, follows pointer"]
    BOOT["boot-oculus — z 4000<br/>boot-eye · OCULUS ONLINE · boot-sub"]
    PART["particles-bg canvas — z 0<br/>120 particles, rAF loop"]
    TB["toolbar — z 1000<br/>SELECT PAN LINK NOTE CODE DEF EYE FIT DESELECT"]
    SB["search-bar + search-input"]
    ZC["zoom-controls"]
    ST["status-bar<br/>stat-x stat-y stat-zoom stat-cards stat-links stat-eyes stat-dil"]
    MM["minimap<br/>minimap-canvas 160x100 · minimap-viewport · minimap-eye · minimap-label"]
    TT["tooltip"]
    CM["context-menu — front · back · duplicate · connect · delete"]
    NOTIF["notif elements — created and removed after 3200 ms"]
  end

  subgraph World["canvas-wrapper — world space, single CSS transform"]
    direction TB
    CANVAS["canvas div — 8000 x 6000 px<br/>translate x y scale s"]
    SVG["connector-svg — z 2<br/>defs glow-0..4 + glow path + line + arrow"]
    SELBOX["selection-box"]
    CARDS[".card elements — z 10<br/>62 seeded by buildCanvas + buildOculus"]
    LABELS[".zone-label x 7 + .glow-orb x 5"]
    MACRO[".macro-iris — 4900 px wide SVG<br/>300 fibers · 6 rings · pupil · halo · collar · rim"]
    BGEYE[".bg-eye x 42 — near / deep depth classes"]
  end

  BODY --> Fixed
  BODY --> World
  CANVAS --> SVG
  CANVAS --> SELBOX
  CANVAS --> CARDS
  CANVAS --> LABELS
  CANVAS --> MACRO
  CANVAS --> BGEYE

  subgraph CardKinds["Card content variants — data-type attribute"]
    direction LR
    K1["sticky x11"]
    K2["code x8"]
    K3["def x6"]
    K4["img x9"]
    K5["section x12"]
    K6["eye x3"]
    K7["waveform x2 · chart · graph · mindmap · timeline · progress · tags · marquee · hexcolor"]
  end
  CARDS --> CardKinds
```

**Observation:** `README.md` documents four card types (`sticky`, `code`, `def`, `eye`). The code
actually emits **15 distinct `data-type` values**; the minimap colour table
(`updateMinimap`) knows about only 9 of them and falls back to `#555` for the rest.

---

## 4. Service interaction — there is no backend

**What it shows:** the complete inventory of network interactions. This diagram exists precisely to
make the *absence* of a backend explicit and auditable: the only cross-origin traffic is one
blocking script and a font stylesheet, both `GET`, both unauthenticated, both un-integrity-checked.

```mermaid
sequenceDiagram
  autonumber
  actor U as Operator browser
  participant GP as GitHub Pages CDN
  participant CJ as cdnjs.cloudflare.com
  participant GF as fonts.googleapis.com
  participant GS as fonts.gstatic.com

  U->>GP: GET / (index.html)
  GP-->>U: 200 text/html — 122 KB, immutable
  Note over U: HTML parser reaches head, line 7

  U->>CJ: GET /ajax/libs/d3/7.8.5/d3.min.js
  Note right of U: render-blocking, no integrity attribute, no crossorigin
  CJ-->>U: 200 application/javascript (never referenced by app code)

  U->>GF: GET /css2?family=JetBrains+Mono|Space+Grotesk|Orbitron
  GF-->>U: 200 text/css with @font-face rules
  U->>GS: GET woff2 font binaries
  GS-->>U: 200 font/woff2

  Note over U,GS: No XHR, fetch, WebSocket, cookie, storage or beacon exists anywhere in the codebase
  Note over U: All subsequent work is local: DOM, Canvas2D, SVG, requestAnimationFrame
```

**Failure semantics of each dependency** — see §16.

---

## 5. Data-flow diagram

**What it shows:** how a raw input event becomes pixels. Note the two competing stores: the `state`
object and the DOM (`element.style.left/top`). Several functions read positions back **out of the
DOM** (`getCardCenter`, `gazeLoop`) rather than out of `state` — this is the single most important
data-flow characteristic of the system.

```mermaid
flowchart LR
  subgraph In["Inputs"]
    MS["mousedown / mousemove / mouseup"]
    WH["wheel"]
    KB["keydown / keyup<br/>Space · Escape · Delete · Backspace"]
    CTX["contextmenu"]
    CLK["toolbar and minimap clicks"]
    RS["window resize"]
    TMR["timers: rAF · 260 ms blink · 1 s minimap · 5.2 s cursor · 40 s cascade"]
  end

  subgraph Transform["Coordinate transform — the central abstraction"]
    T1["viewport to world<br/>wx = clientX - rect.left - state.x, all over state.scale"]
    T2["world to viewport<br/>used by zoom focal-point correction"]
  end

  subgraph Stores["Stores"]
    ST[("state — mutable global<br/>x y scale tool cards connections<br/>selectedCards Set · connecting · dragOffset")]
    DOMST[("DOM — second source of truth<br/>style.left style.top style.zIndex<br/>classList dataset.type")]
    EYES[("eyes[] — Script B private array<br/>svg globe pupil r card ox oy next")]
    PARTS[("particles[] — 120 objects<br/>x y vx vy r a col")]
  end

  subgraph Out["Renderers / sinks"]
    R1["applyTransform<br/>canvas.style.transform"]
    R2["renderConnectors<br/>rebuilds connector-svg from scratch"]
    R3["updateMinimap<br/>Canvas2D 160x100 redraw"]
    R4["gazeLoop<br/>per-eye translate on globe and pupil"]
    R5["ocularTick<br/>macro pupil radius, lid heights, stat-dil"]
    R6["animParticles<br/>particle field + proximity links"]
    R7["status bar text nodes"]
    R8["showNotif<br/>ephemeral toast div"]
  end

  MS --> T1 --> ST
  WH --> T2 --> ST
  KB --> ST
  CTX --> ST
  CLK --> ST
  RS --> PARTS
  TMR --> EYES

  ST --> R1 --> DOMST
  MS -->|"drag writes style.left/top directly"| DOMST
  DOMST -->|"getCardCenter reads offsetWidth and style"| R2
  ST --> R2
  ST --> R3
  DOMST --> R3
  ST --> R4
  EYES --> R4
  ST --> R5
  PARTS --> R6
  ST --> R7
  ST --> R8
  R2 --> DOMST
  R3 --> DOMST
  R4 --> DOMST
  R5 --> DOMST

  classDef store fill:#1c1c1f,stroke:#7b4fff,color:#9966ff
  class ST,DOMST,EYES,PARTS store
```

**Consequences of the dual store**

* `state.cards[i].x/y` is updated during drag, but `getCardCenter()` still parses `style.left`,
  so `state.cards` is effectively a **cache used only by the minimap**.
* `state.cards` entries carry `w`/`h` that are `0` until `updateMinimapCards()` measures them
  (100 ms after creation, and again 300–400 ms after boot).
* Cards created by `ctxAction('duplicate')` clone `innerHTML`, which **also clones any iris SVG**;
  the clone is *not* passed to `scanEyes`, so duplicated eyes never track the cursor — a real,
  observable bug that falls straight out of this diagram.

---

## 6. Request lifecycle — page load to interactive

**What it shows:** the boot sequence, in file order, with the timers that fire after it. This is the
"request lifecycle" for a system whose only request is `GET /`.

```mermaid
sequenceDiagram
  autonumber
  participant P as HTML parser
  participant A as Script A — Canvas Engine
  participant B as Script B — Oculus Engine
  participant D as DOM / CSSOM
  participant R as Render loop

  P->>D: parse head, block on cdnjs d3.min.js
  P->>D: apply style block, start Google Fonts fetch
  P->>D: build static skeleton (toolbar, minimap, overlays, canvas-wrapper)
  P->>A: execute Script A
  A->>A: define state literal, cache canvas / wrapper / connSvg / selBox
  A->>D: attach wrapper, document and minimap listeners
  A->>A: initParticles() then animParticles() — rAF loop starts
  A->>A: applyTransform()
  A->>D: buildCanvas() — 7 zones, ~46 cards, 7 zone labels, 5 glow orbs
  A-->>A: setTimeout 300 ms — seed 16 initial connections, updateMinimapCards
  A-->>A: setTimeout 500 ms — exp-canvas rAF animation
  A->>D: showNotif("OCULUS LOADED")
  A-->>A: setInterval 1000 ms — updateMinimap
  P->>B: execute Script B IIFE
  B->>D: buildMacroIris() — 4900 px SVG appended to canvas
  B->>D: buildBackgroundEyes() — 42 bg-eye divs, each scanEyes-registered
  B->>D: buildOculus() — OCULUS, SACCADE, PHOSPHENE, SCRYING, OPTIC SIGNAL zones
  B-->>B: setTimeout 400 ms — optic-nerve connectors from THE WATCHER
  B->>D: install gaze-cursor iris and boot iris
  B->>R: gazeLoop() — rAF loop starts
  R-->>D: every 2nd frame eye transforms, every frame ocularTick
  B-->>D: setTimeout 2300 ms — boot-oculus gets .gone, removed at 3700 ms
  B-->>D: setTimeout 3000 ms — showNotif("N EYES OPEN")
  Note over R,D: Steady state = 3 concurrent rAF loops + 5 intervals
```

**Steady-state execution budget (read from the source, not measured)**

| Loop | Rate | Work per tick |
|---|---|---|
| `animParticles` | every frame | 120 particle integrations + **7 140 pair distance checks** (O(n²)) |
| `gazeLoop` | every frame; eye math every 2nd frame | up to ~50 eyes, viewport-culled at ±400 world px |
| `ocularTick` | every frame (called from `gazeLoop`) | 4 SVG attribute writes + 2 style writes + 1 text write |
| `drawExp` | every frame | 5 arcs on a 200×160 canvas |
| blink scan | 260 ms | linear scan of `eyes[]` |
| `updateMinimap` | 1000 ms, plus every transform/drag-end | full 160×100 redraw, iterates all cards and connections, **`getElementById` per card** |
| cursor blink | 5200 ms | class toggle |
| cascade blink | 40000 ms | schedules one `setTimeout` per eye + a notification |

---

## 7. Authentication and authorization

**What it shows:** the application has **no authentication or authorization whatsoever** — no
accounts, cookies, tokens, storage or `connect-src` traffic. The only real authorization boundary in
the repository is the **GitHub Actions OIDC exchange** that lets CI publish to Pages. Both facts are
drawn so a reviewer can confirm the negative.

```mermaid
flowchart TB
  subgraph App["Application trust model — runtime"]
    direction LR
    ANON(["Any anonymous visitor"]) -->|"HTTPS GET, no credentials"| SITE["Static site"]
    SITE --> CAP["Full capability: every global function<br/>createCard, addConnection, deleteCard, setTool<br/>is callable from the devtools console"]
    CAP --> LOCAL["Effect scope: this tab only<br/>no persistence, no other user is affected"]
  end

  subgraph CI["The only authorization boundary that exists"]
    direction TB
    PUSH["push to main<br/>or manual workflow_dispatch"]
    TOK["GITHUB_TOKEN with least-privilege grants<br/>contents: read · pages: write · id-token: write"]
    OIDC["actions/deploy-pages@v5<br/>OIDC id-token exchange"]
    ENVP["environment: github-pages<br/>branch and reviewer rules [unknown - configured in repo settings, not in git]"]
    CONC["concurrency group 'pages'<br/>cancel-in-progress: false"]
    PUB["Pages deployment"]
    PUSH --> TOK --> OIDC --> ENVP --> PUB
    PUSH --> CONC --> PUB
  end

  App -.->|"no shared identity between planes"| CI

  classDef none fill:#26060c,stroke:#cc2233,color:#ff2244
  class ANON,CAP,LOCAL none
```

> **Explicitly absent (verified by grep):** `localStorage`, `sessionStorage`, `document.cookie`,
> `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.credentials`, `crypto.subtle`.
> Any future multi-user feature would need an entirely new tier — see §17.

---

## 8. Persistence model — ephemeral, in-memory

**What it shows:** the entity model that *would* be a schema if anything were persisted. These are
JavaScript object shapes living in the heap for the lifetime of one page view. There is **no
database, no IndexedDB, no file export**; a refresh destroys everything and `buildCanvas()` /
`buildOculus()` regenerate a deterministic seeded board.

```mermaid
erDiagram
  STATE ||--o{ CARD : "cards[]"
  STATE ||--o{ CONNECTION : "connections[]"
  STATE ||--o{ SELECTION : "selectedCards Set of id"
  STATE ||--|| CONNECTING : "connecting"
  CARD ||--o{ CONNECTION : "from"
  CARD ||--o{ CONNECTION : "to"
  CARD ||--|| DOM_ELEMENT : "mirrored by id"
  DOM_ELEMENT ||--o{ EYE_RECORD : "contains svg.eye-svg"
  RUNTIME ||--o{ EYE_RECORD : "eyes[] registry"
  RUNTIME ||--o{ PARTICLE : "particles[]"

  STATE {
    number x "pan offset, default -600"
    number y "pan offset, default -300"
    number scale "zoom, clamped 0.06 to 3, default 0.72"
    string tool "select | pan | connect"
    boolean isDragging
    boolean isPanning
    element dragCard
    object dragOffset "x, y in world units"
    object panStart "UNDECLARED in literal, added on mousedown"
    element contextCard "holds a card id string, not an element"
    number nextId "auto-increment card counter"
    number mouseX "world coords"
    number mouseY "world coords"
    object selectionStart "world coords or null"
  }

  CARD {
    string id PK "card-N"
    number x "world px, updated on drag"
    number y "world px, updated on drag"
    number w "0 until updateMinimapCards measures"
    number h "0 until updateMinimapCards measures"
  }

  CONNECTION {
    string id PK "conn-<Date.now> COLLIDES within same ms"
    string from FK "card id"
    string to FK "card id"
    string color "one of 5 hex accents"
  }

  DOM_ELEMENT {
    string id PK "same as CARD.id"
    string dataset_type "sticky code def eye img section waveform chart graph mindmap timeline progress tags marquee hexcolor"
    string style_left "authoritative position"
    string style_top "authoritative position"
    string style_zIndex "10 default, 500 front, 5 back, 999 dragging"
    string innerHTML "authored markup, cloned on duplicate"
  }

  EYE_RECORD {
    element svg "svg.eye-svg, marked data-reg=1"
    element globe ".eye-globe group"
    element pupil ".pupil-grp group"
    number r "half of svg size"
    element card "owning card or null for bg eyes"
    number ox "svg offset inside card, measured once"
    number oy "svg offset inside card, measured once"
    number cx "world x for non-card eyes"
    number cy "world y for non-card eyes"
    number next "performance.now deadline for next blink"
  }

  PARTICLE {
    number x
    number y
    number vx "+/- 0.15 px per frame"
    number vy "+/- 0.15 px per frame"
    number r "0.3 to 1.8"
    number a "alpha 0.1 to 0.6"
    string col "one of 5 hex accents"
  }

  SELECTION {
    string card_id PK
  }

  CONNECTING {
    boolean active
    string from "source card id or null"
  }

  RUNTIME {
    number uid "iris id counter"
    number frame "gazeLoop frame counter"
    object PAL "6 named 3-stop palettes"
  }
```

**Persistence gaps worth flagging**

* `conn-' + Date.now()` is not unique — the boot sequence adds 16 connections inside one
  `setTimeout`, so several share an id. Nothing currently reads `connection.id`, so the defect is
  latent rather than active.
* `deleteCard` cleans `state.cards`, `state.connections` and `selectedCards`, but **not**
  `eyes[]` — a deleted eye card leaves a dangling record whose `e.card` is detached from the
  document, so it keeps being iterated by `gazeLoop` forever (slow leak).

---

## 9. Internal API interaction map

**What it shows:** the global JavaScript surface documented in `API.md`, as a class-style map of
"who calls whom". This is the closest thing the project has to an API contract; everything on the
left is reachable from the console and from inline `onclick` attributes.

```mermaid
classDiagram
  direction LR

  class CanvasEngine {
    <<Script A — global scope>>
    +state : CanvasState
    +applyTransform() void
    +zoom(factor, cx, cy) void
    +resetView() void
    +setTool(t) void
    +createCard(type, x, y, content, extraClass) HTMLElement
    +setupCardInteraction(card) void
    +selectCard(card) void
    +clearSelected() void
    +deleteCard(id) void
    +addConnection(from, to, color) void
    +getCardCenter(id) Point
    +renderConnectors() void
    +showContextMenu(x, y, cardId) void
    +ctxAction(action) void
    +addStickyNote() void
    +addCodeBlock() void
    +addDefCard() void
    +showNotif(msg) void
    +updateMinimap() void
    +updateMinimapCards() void
    +initParticles() void
    +animParticles() void
    +buildCanvas() void
  }

  class OculusEngine {
    <<Script B — IIFE private>>
    -uid : number
    -eyes : EyeRecord[]
    -PAL : Palettes
    -rng(seed) function
    -iris(opt) string
    -scanEyes(root, worldX, worldY) void
    -gazeLoop() void
    -blink(e, hold) void
    -buildMacroIris() void
    -buildBackgroundEyes() void
    -eyeCard(x, y, o) HTMLElement
    -buildOculus() void
    -ocularTick() void
    +window.addEyeCard() void
  }

  class InlineMarkup {
    <<index.html onclick attributes>>
    setTool('select' | 'pan' | 'connect')
    addStickyNote()
    addCodeBlock()
    addDefCard()
    addEyeCard()
    resetView()
    clearSelected()
    zoom(1.2) / zoom(0.8)
    ctxAction('front'|'back'|'duplicate'|'connect'|'delete')
  }

  class BrowserAPI {
    <<host environment>>
    document.getElementById()
    document.createElementNS()
    requestAnimationFrame()
    setInterval() / setTimeout()
    CanvasRenderingContext2D
    performance.now()
    element.getBoundingClientRect()
  }

  class D3 {
    <<external, loaded, UNUSED>>
    d3.* : never referenced
  }

  InlineMarkup ..> CanvasEngine : direct global calls
  InlineMarkup ..> OculusEngine : addEyeCard only
  OculusEngine ..> CanvasEngine : state, createCard, addConnection, showNotif, updateMinimapCards, canvas
  CanvasEngine ..> BrowserAPI
  OculusEngine ..> BrowserAPI
  CanvasEngine ..> D3 : no call sites
```

**Dead or unwired surface found while mapping the API**

| Element | Evidence | Status |
|---|---|---|
| `#search-input` | no listener anywhere in the file | **dead UI** |
| `#tooltip` | element exists, never populated or shown | **dead UI** |
| `.sticky` body text "double-click to edit..." | no `dblclick` handler exists | **misleading affordance** |
| `d3.min.js` | zero call sites | **dead dependency** |
| `targets` const in `buildOculus` optic-nerve block | assigned, never read | dead local |
| `extraClass` param of `createCard` | accepted, never applied to the element | **silently ignored parameter** |

---

## 10. Deployment and infrastructure topology

**What it shows:** everything between a commit and a rendered pixel. There is exactly one
environment; there is no staging, no CDN of our own, no runtime configuration.

```mermaid
flowchart TB
  subgraph Dev["Developer workstation"]
    ED["editor — edit index.html directly"]
    LOC["optional local server<br/>python3 -m http.server 8000 or npx serve ."]
    BR["manual cross-browser check<br/>Chrome 90+ · Firefox 88+ · Safari 14+ · Edge 90+"]
    ED --> LOC --> BR
  end

  subgraph GH["GitHub — control plane"]
    MAIN[("branch main<br/>default, protected? [unknown]")]
    PR["pull request<br/>PULL_REQUEST_TEMPLATE.md"]
    DB["Dependabot<br/>github-actions ecosystem, weekly, limit 10"]
    ACT["Actions runner: ubuntu-latest<br/>job: deploy, environment github-pages"]
  end

  subgraph Artifact["Artifact plane"]
    ART["pages artifact<br/>path: '.' — the ENTIRE repository<br/>index.html + 2 PNGs + all Markdown + .github"]
  end

  subgraph Edge["Serving plane"]
    PAGES[["GitHub Pages<br/>zazieproductions.github.io/void-oculus<br/>HTTPS, HTTP/2, gzip, global edge cache"]]
  end

  subgraph Alt["Documented alternatives — not configured in repo"]
    NET["Netlify"]
    CFP["Cloudflare Pages"]
    VER["Vercel"]
    S3["AWS S3 static website"]
  end

  subgraph Client["Client plane"]
    UB(["End user browser"])
    CDN3[["cdnjs — D3"]]
    GFO[["Google Fonts"]]
  end

  BR --> PR --> MAIN
  DB --> PR
  MAIN -->|"on: push branches main"| ACT
  ACT -->|"actions/checkout@v7"| ART
  ACT -->|"actions/configure-pages@v5<br/>upload-pages-artifact@v5"| ART
  ART -->|"actions/deploy-pages@v5"| PAGES
  PAGES -->|"static GET"| UB
  UB --> CDN3
  UB --> GFO
  PAGES -.->|"README-documented, no config committed"| Alt

  classDef unk fill:#2a1c00,stroke:#ffaa00,color:#ffaa00
  class Alt,NET,CFP,VER,S3 unk
```

**Operational assumptions baked into this topology**

1. Deployment is **whole-repository publication** — `path: '.'` means `README.md`,
   `SECURITY.md`, `.github/workflows/static.yml` and both 1.4 MB PNGs are all publicly fetchable at
   the site origin. Nothing secret exists in the repo today, so this is a hygiene issue, not a leak.
2. Payload per cold visit ≈ **122 KB HTML** plus fonts plus an unused ~280 KB D3 bundle. The two
   PNGs (3 MB combined) are only fetched by people reading the README on GitHub.
3. No cache-busting strategy exists; Pages serves `index.html` with short-lived caching by default
   **[inferred — not configured in the repo]**.
4. Rollback = revert the commit and let the workflow re-run. There is no artifact retention policy
   or environment promotion.

---

## 11. Build, test, and release pipeline

**What it shows:** the real CI graph. There is no build, no lint, no test and no version gate — the
only job is `deploy`. Everything drawn dashed is a *documented human step*, not automation.

```mermaid
flowchart LR
  subgraph Local["Local — manual, per CONTRIBUTING.md"]
    L1["edit index.html"]
    L2["open in 4 browsers"]
    L3["commit: 'Add: description'"]
    L1 -.-> L2 -.-> L3
  end

  subgraph Review["GitHub review"]
    R1["PR from feature/* fork branch"]
    R2["human review<br/>no required status checks [unknown]"]
    R3["merge to main"]
    R1 --> R2 --> R3
  end

  subgraph Pipeline["Actions — static.yml, single job 'deploy'"]
    direction TB
    T0{"trigger:<br/>push to main OR workflow_dispatch"}
    C1["concurrency group 'pages'<br/>queued runs skipped, in-progress never cancelled"]
    S1["actions/checkout@v7"]
    S2["actions/configure-pages@v5"]
    S3["actions/upload-pages-artifact@v5<br/>path: '.'"]
    S4["actions/deploy-pages@v5<br/>outputs page_url"]
    T0 --> C1 --> S1 --> S2 --> S3 --> S4
  end

  subgraph Missing["Absent stages — proposed, not present"]
    M1["HTML / CSS / JS lint"]
    M2["unit or DOM tests"]
    M3["Lighthouse or perf budget"]
    M4["SRI hash generation"]
    M5["semver tag + GitHub Release"]
  end

  L3 --> R1
  R3 --> T0
  S4 --> DONE(["live at page_url"])
  Pipeline -.->|"gap"| Missing

  classDef gap fill:#26060c,stroke:#cc2233,color:#ff2244,stroke-dasharray: 4 3
  class Missing,M1,M2,M3,M4,M5 gap
```

### 11.1 Branch and release history model

**What it shows:** the branching pattern actually observable in the repository — a linear `main`
receiving Dependabot merge commits (HEAD is *"Merge pull request #3 from
zazieproductions/dependabot/github_actions/actions/upload-pages-artifact-5"*), plus the
`feature/*` convention that `CONTRIBUTING.md` prescribes. Versioning is `Keep a Changelog` +
SemVer per `CHANGELOG.md`, but **no git tags exist yet**.

```mermaid
gitGraph
  commit id: "initial single-file app"
  commit id: "docs: README, API, ARCHITECTURE"
  branch feature/example
  checkout feature/example
  commit id: "feature work (CONTRIBUTING convention)"
  checkout main
  merge feature/example
  branch dependabot/github_actions/upload-pages-artifact-5
  checkout dependabot/github_actions/upload-pages-artifact-5
  commit id: "bump upload-pages-artifact to v5"
  checkout main
  merge dependabot/github_actions/upload-pages-artifact-5 tag: "PR #3 — HEAD 70249b0"
  commit id: "CHANGELOG [Unreleased] — no v1.0.0 tag exists"
```

---

## 12. Primary user workflow

**What it shows:** the end-to-end journey from cold load to a linked knowledge graph, and where the
journey terminates because a capability does not exist.

```mermaid
flowchart TB
  A(["Cold load"]) --> B["Boot iris animation, 2.3 s<br/>click to skip"]
  B --> C["Seeded board appears<br/>62 cards · 7+5 zones · 42 background eyes · macro iris"]
  C --> D{"Choose intent"}

  D -->|"orient"| E["Zoom out — scale toward 0.06<br/>macro iris opens, DILATION climbs to 100"]
  D -->|"navigate"| F["Wheel zoom at cursor · Space to pan · click minimap to jump"]
  D -->|"read"| G["Zoom in past 1.5 — lids squint, eyes track cursor"]
  D -->|"author"| H["Toolbar: NOTE · CODE · DEF · EYE<br/>card spawns at viewport origin + random 200-600 px"]
  D -->|"organise"| I["SELECT tool: click, shift-click, marquee drag<br/>drag to reposition"]
  D -->|"relate"| J["LINK tool or right-click Connect"]
  D -->|"prune"| K["Right-click Delete, or Delete key on selection"]

  E --> F --> G
  H --> I --> J
  J --> L["Bezier connector + arrow rendered<br/>LINKS counter increments"]
  K --> M["Card, its connectors and its selection entry removed"]
  L --> N{"Save the work?"}
  M --> N
  N -->|"no mechanism exists"| O["Refresh discards everything<br/>board regenerates from seed"]

  classDef dead fill:#26060c,stroke:#cc2233,color:#ff2244
  class O dead
```

> The workflow is **read-mostly by construction**: cards created at runtime carry placeholder text
> and cannot be edited (no `contenteditable`, no `dblclick`), and search is unwired. The product's
> authoring loop is therefore *spatial* (place, move, link, delete) rather than *textual*.

---

## 13. State management

**What it shows:** the interaction state machine implied by `state.tool`, `state.isDragging`,
`state.isPanning`, `state.selectionStart` and `state.connecting`. Transitions are labelled with the
handler that performs them.

```mermaid
stateDiagram-v2
  direction LR
  [*] --> Booting : script A + B execute

  Booting --> Select : boot-oculus .gone after 2300 ms

  state "Tool: SELECT" as Select {
    [*] --> Idle
    Idle --> Marquee : wrapper mousedown on empty canvas<br/>selectionStart = world point
    Marquee --> Idle : mouseup — selBox hidden<br/>NOTE: no hit test, marquee selects nothing
    Idle --> Selected : card mousedown<br/>selectCard, shiftKey = additive
    Selected --> Dragging : same mousedown sets isDragging + dragOffset
    Dragging --> Selected : mouseup — dragging class removed, updateMinimap
    Selected --> Idle : clearSelected via empty-canvas mousedown, DESELECT button or Escape
    Dragging --> Dragging : mousemove — writes style.left/top + renderConnectors every frame
  }

  state "Tool: PAN" as Pan {
    [*] --> PanIdle
    PanIdle --> Panning : mousedown sets panStart = client - state offset
    Panning --> PanIdle : mouseup — cursor back to grab
    Panning --> Panning : mousemove — state.x/y then applyTransform
  }

  state "Tool: CONNECT" as Connect {
    [*] --> AwaitSource
    AwaitSource --> AwaitTarget : card mousedown<br/>connecting.from = id, notify SELECT TARGET NODE
    AwaitTarget --> AwaitSource : same card clicked — ignored
    AwaitTarget --> LinkMade : different card mousedown<br/>addConnection then setTool('select')
    LinkMade --> [*] : notify LINK ESTABLISHED
  }

  Select --> Pan : toolbar PAN, or keydown Space
  Pan --> Select : toolbar SELECT, or keyup Space
  Select --> Connect : toolbar LINK, or context menu Connect
  Connect --> Select : link completed, or Escape, or any setTool
  Pan --> Connect : toolbar LINK

  Select --> Select : wheel zoom, minimap click, Delete key, card creation
  Pan --> Pan : wheel zoom
  Connect --> Connect : wheel zoom

  note right of Connect
    Escape clears connecting.active
    but setTool also nulls connecting.from
    and re-renders connectors
  end note
```

**State-management assessment**

* Single mutable global object, no reducer, no immutability, no change notification — every mutation
  site is also responsible for calling the right renderer. Missing that call is the most likely class
  of future bug (e.g. `deleteCard` correctly calls `renderConnectors()`; `ctxAction('front'/'back')`
  correctly needs none).
* The middle-mouse button (`e.button === 1`) enters panning **without changing `state.tool`**, so the
  cursor reset on `mouseup` reads the stale tool — a small state-versus-presentation divergence.
* `state.panStart` is created ad hoc and is absent from both the literal and the JSDoc typedef.

---

## 14. Sequence — the most important end-to-end operation: creating a link

**What it shows:** the full call chain for "connect two cards", the operation that turns the canvas
from a pile of cards into a knowledge graph. It exercises the tool state machine, both stores, the
SVG renderer, the minimap and the notification system.

```mermaid
sequenceDiagram
  autonumber
  actor U as Operator
  participant TB as Toolbar / context-menu
  participant CE as Canvas Engine
  participant SM as state
  participant CardA as Card A element
  participant CardB as Card B element
  participant SVG as connector-svg
  participant MM as minimap-canvas
  participant N as Notification

  U->>TB: click LINK (or right-click card then Connect)
  TB->>CE: setTool('connect')
  CE->>SM: tool = 'connect'
  CE->>TB: toggle .active class, cursor = crosshair
  CE->>SVG: renderConnectors() — full rebuild

  U->>CardA: mousedown
  CardA->>CE: setupCardInteraction handler, stopPropagation
  CE->>SM: connecting = {active: true, from: 'card-A'}
  CE->>N: showNotif("SELECT TARGET NODE")
  N-->>U: toast, auto-removed after 3200 ms

  U->>CardB: mousedown
  CardB->>CE: handler sees connecting.active and different id
  CE->>CE: addConnection('card-A','card-B')
  CE->>SM: connections.push({from, to, color: random of 5, id: 'conn-'+Date.now()})
  CE->>TB: stat-links textContent = connections.length
  CE->>CE: renderConnectors()

  loop for each connection in state.connections
    CE->>CardA: getCardCenter — parse style.left/top + offsetWidth/Height
    CE->>CardB: getCardCenter
    CE->>CE: cubic bezier control points at 40% and 60% of dx
    CE->>SVG: append glow path (width 4, opacity 0.15)
    CE->>SVG: append main path (width 1.2, opacity 0.6)
    CE->>SVG: append arrow polygon at target, angle from atan2
  end

  CE->>SM: connecting = {active: false, from: null}
  CE->>CE: setTool('select') — which calls renderConnectors() a second time
  CE->>N: showNotif("LINK ESTABLISHED")
  Note over CE,MM: next updateMinimap tick (<= 1 s, or immediately on any transform)<br/>redraws the link as a straight line in fovea space
  MM-->>U: link visible in minimap
```

**What this sequence exposes**

* `renderConnectors()` is **O(connections)** but rebuilds the *entire* SVG subtree — including
  re-creating 5 `<filter>` defs — on every call, and it is called on **every `mousemove` during a
  card drag**. With ~20 connections this is fine; it is the first thing that will break at scale.
* The glow filters are created but **never referenced** by any path (`filter="url(#glow-N)"` never
  appears) — the glow is faked with a wide translucent stroke instead. `ARCHITECTURE.md`'s previous
  claim of `feGaussianBlur`-driven glow was aspirational.
* Two `renderConnectors()` calls happen back to back (once from `addConnection`, once from
  `setTool('select')`).

---

## 15. Security boundaries and trust zones

**What it shows:** where code and data cross a trust boundary. For a client-only static site the
interesting boundaries are *supply chain* (CDN), *authoring* (innerHTML), and *publication* (CI).

```mermaid
flowchart TB
  subgraph Z0["Zone 0 — Public internet, untrusted"]
    VISITOR(["Anonymous visitor"])
  end

  subgraph Z1["Zone 1 — Third-party origins, trusted implicitly"]
    direction LR
    CDNJS["cdnjs.cloudflare.com<br/>script-src, FULL JS execution rights"]
    GAPI["fonts.googleapis.com<br/>style-src"]
    GSTA["fonts.gstatic.com<br/>font-src"]
  end

  subgraph Z2["Zone 2 — Application origin, GitHub Pages"]
    direction TB
    IDX["index.html served as-is<br/>no CSP meta tag present<br/>no X-Frame-Options controllable"]
    INLINE["inline script + inline style + inline onclick<br/>would require unsafe-inline in any CSP"]
    HTMLSINK["innerHTML sinks: createCard, iris output,<br/>macro iris, ctxAction duplicate"]
    SRCDATA["All content is author-authored literals<br/>no user text ever reaches a sink today"]
    IDX --> INLINE --> HTMLSINK
    SRCDATA --> HTMLSINK
  end

  subgraph Z3["Zone 3 — Repository / CI, authenticated"]
    direction TB
    WRITERS["Maintainers with push rights"]
    DEPBOT["Dependabot — opens PRs only"]
    GHTOK["GITHUB_TOKEN<br/>contents: read, pages: write, id-token: write"]
    RUNNER["ubuntu-latest runner<br/>runs 4 pinned marketplace actions"]
    WRITERS --> RUNNER
    DEPBOT --> WRITERS
    RUNNER --> GHTOK
  end

  VISITOR -->|"HTTPS, no credentials, nothing to steal"| IDX
  IDX -->|"BOUNDARY 1: unauthenticated remote code<br/>no integrity= no crossorigin= no fallback"| CDNJS
  IDX -->|"BOUNDARY 2: remote CSS via @import"| GAPI
  GAPI --> GSTA
  GHTOK -->|"BOUNDARY 3: publishes whole repo to public origin"| IDX

  classDef risk fill:#26060c,stroke:#cc2233,color:#ff2244
  classDef ok fill:#04231a,stroke:#00ff9d,color:#00ff9d
  class CDNJS,GAPI,GSTA risk
  class SRCDATA ok
```

**Boundary-by-boundary finding**

| # | Boundary | Current control | Residual risk |
|---|---|---|---|
| 1 | `cdnjs` → page | none — no SRI, no `crossorigin`, no local fallback | A compromised or hijacked CDN response executes with full page privileges. **The library is not even used**, so the risk is entirely gratuitous. `SECURITY.md` recommends SRI; the recommendation is not implemented in `index.html`. |
| 2 | Google Fonts `@import` | none | Style-injection and a privacy/GDPR-relevant third-party request. Low severity. |
| 3 | CI → public origin | least-privilege `GITHUB_TOKEN`, OIDC deploy, pinned major-version actions, Dependabot upkeep | Good. Weakness: `path: '.'` publishes everything in the repo by default. |
| 4 | `innerHTML` usage | none | Not currently exploitable — no untrusted input path exists. **Becomes a real XSS surface the moment editable cards, URL/query state, or import are added.** |
| 5 | Client data | nothing stored | Strongest property of the design: no data at rest means no data to breach. |

---

## 16. Failure handling, fallback and recovery

**What it shows:** what actually happens when each dependency or invariant fails. Solid arrows are
behaviours present in the code; dashed red boxes are unhandled paths.

```mermaid
flowchart TB
  subgraph Ext["External failure modes"]
    F1{"cdnjs unreachable<br/>or blocked"}
    F2{"Google Fonts unreachable"}
    F3{"Pages deploy fails"}
  end

  subgraph Int["Internal failure modes — guards found in code"]
    F4{"getCardCenter target missing"}
    F5{"scanEyes finds no .eye-globe"}
    F6{"stat-* element missing"}
    F7{"exp-canvas missing"}
    F8{"eyes[] entry card detached after delete"}
    F9{"O(n^2) particle loop at high n"}
    F10{"renderConnectors called every drag frame"}
  end

  F1 -->|"script tag is not async/defer"| R1["Parser blocks until timeout,<br/>then app still boots — d3 is unused"]
  R1 -.->|"UNHANDLED: no onerror, no local copy"| X1["Slow first paint on flaky networks"]

  F2 --> R2["CSS @import fails silently<br/>font-family falls back to monospace / sans-serif"]
  R2 --> OK2["Degrades gracefully"]

  F3 --> R3["concurrency 'pages' keeps last good deploy live<br/>cancel-in-progress: false"]
  R3 --> OK3["Recovery = revert commit and re-run workflow"]

  F4 --> G4["returns null; renderConnectors and updateMinimap<br/>skip that connection via early return"]
  G4 --> OK4["Handled — stale links are simply not drawn"]

  F5 --> G5["early return before pushing to eyes[]"]
  G5 --> OK5["Handled"]

  F6 --> G6["optional chaining / if(st) guards<br/>in scanEyes and ocularTick"]
  G6 --> OK6["Handled"]

  F7 --> G7["if (ec) guard before getContext"]
  G7 --> OK7["Handled"]

  F8 -.->|"deleteCard never prunes eyes[]"| X8["Dangling record iterated forever<br/>slow memory and CPU leak"]
  F9 -.->|"fixed 120 particles, no adaptive cap"| X9["7140 distance checks per frame,<br/>independent of device class"]
  F10 -.->|"no rAF batching or debounce"| X10["Full SVG subtree rebuild per mousemove"]

  classDef bad fill:#26060c,stroke:#cc2233,color:#ff2244,stroke-dasharray: 4 3
  classDef good fill:#04231a,stroke:#00ff9d,color:#00ff9d
  class X1,X8,X9,X10 bad
  class OK2,OK3,OK4,OK5,OK6,OK7 good
```

> There is **no error boundary of any kind** — no `try/catch`, no `window.onerror`, no telemetry.
> An exception thrown inside `gazeLoop` silently kills the rAF chain and freezes every eye and the
> macro-iris dilation while the rest of the UI keeps working. That partial-failure mode would be
> invisible to both user and maintainer.

---

## 17. Architecture narrative

### 17.1 Major layers and their responsibilities

| Layer | Location | Responsibility | Depends on |
|---|---|---|---|
| **Design-token layer** | `:root` in the style block | Single source of colour, typography, elevation. Referenced by both CSS rules and JS (`var(--phosphor)` inside generated markup). | nothing |
| **Presentation layer** | 176 CSS rules, 13 `@keyframes` | All static appearance and all ambient animation (scan line, marquee, shimmer, iris breathing, boot open). Deliberately keeps animation *off* the JS thread. | tokens |
| **Document skeleton** | body markup, lines 1000–1085 | Declares the fixed chrome (toolbar, status bar, minimap, context menu, overlays) and the world container. Binds UI to logic via inline `onclick`. | Canvas Engine globals |
| **Canvas Engine (Script A)** | lines 1086–2322 | The application core: state, coordinate transform, card CRUD, connection model, pointer/keyboard/wheel event handling, context menu, minimap, particle field, and the seeded board (`buildCanvas`, 7 zones). | DOM, Web APIs |
| **Oculus Engine (Script B)** | lines 2323–3196 | The identity of the product: deterministic procedural iris generation, the gaze registry and tracking loop, blink scheduling, the 4900 px macro iris, 42 ambient watchers, 5 further content zones, gaze cursor, boot iris. | *reaches into* Canvas Engine globals |
| **Hosting/CI layer** | `.github/workflows/static.yml` | Copies the repo to Pages. No transformation of any kind. | GitHub |

### 17.2 Primary control and data flows

Control is **entirely event-driven from the browser**, with three long-lived rAF loops as the only
autonomous actors (`animParticles`, `gazeLoop`→`ocularTick`, `drawExp`) plus five intervals. Data
flows in one direction per interaction — *input → world-space transform → mutate `state` and/or DOM
→ call the specific renderer(s) affected* — but there is no framework enforcing that ordering, so
correctness rests on discipline at each call site. The reverse flow (renderers reading positions
back out of the DOM via `getCardCenter` and `gazeLoop`) is what makes the DOM, not `state`, the
authoritative store for geometry.

### 17.3 The most important abstractions

1. **The world/viewport transform.** Three lines of arithmetic
   (`w = (client - rect - state.pan) / state.scale`) repeated at seven call sites. It is the load-bearing
   abstraction of the whole app and it is *not* factored into a function — see technical debt.
2. **`createCard(type, x, y, content)`.** The single constructor for all 15 card variants; type is a
   `data-attribute`, content is an HTML string. Extremely cheap to add a card variant, impossible to
   add card *behaviour* without special-casing.
3. **`iris(opt)`.** A pure, deterministic, seeded SVG-string generator. Given `{size, pal, seed,
   pupil, fibers, veins, drift}` it returns self-contained markup with namespaced gradient ids
   (`ocuN-i`, `ocuN-p`, `ocuN-s`, `ocuN-c`). Every eye in the product — card eyes, 42 background
   watchers, the cursor, the boot screen — comes out of this one function. This is the cleanest
   abstraction in the repository.
4. **The `eyes[]` gaze registry.** Decouples *how eyes are created* from *how they are animated*:
   `scanEyes(root)` finds any unregistered `svg.eye-svg`, marks it `data-reg=1`, measures its offset
   inside its owning card once, and hands it to a single shared loop. Idempotent by construction.
5. **`state.scale` as a UX signal.** Zoom is not merely a viewport property; `ocularTick` maps it to
   macro-pupil radius, eyelid height and the DILATION readout. Navigation *is* the narrative.

### 17.4 Coupling and dependency boundaries

* **Strongest coupling:** Script B → Script A via bare globals. Script B cannot be extracted,
  deferred, `type="module"`-ified, or unit-tested without breaking, because it assumes Script A has
  already executed in the same global lexical scope.
* **Second-strongest:** markup → globals via inline `onclick`. Any minifier that renames top-level
  functions, or any move to modules (which are scoped), breaks the toolbar silently.
* **Cleanest boundary:** `iris()` — pure input→string, zero DOM or state access.
* **Accidental boundary:** the DOM is used as an IPC channel between subsystems (`scanEyes` locates
  eyes by CSS selector; `getCardCenter` reads inline styles; `updateMinimap` calls `getElementById`
  per card per tick).

### 17.5 External integrations

Two, both unauthenticated GETs: **cdnjs** (D3 7.8.5, loaded, never called) and **Google Fonts**
(three families via `@import`). No analytics, no telemetry, no error reporting, no APIs.

### 17.6 Operational assumptions

* Desktop, mouse-driven, single user, single tab, modern evergreen browser. (`@media (max-width:
  768px)` hides labels and the search bar, but there is **no touch/pointer event handling at all** —
  the canvas is unusable on touch devices despite the responsive CSS.)
* Board content is authored **in source** (`buildCanvas`/`buildOculus`), not by users. Runtime
  authoring is a demonstration, not a workflow.
* Session-scoped by design: refresh is the reset button.
* Deployment is instantaneous and atomic; no migrations, no config, no secrets.

### 17.7 Likely scalability constraints

| Constraint | Mechanism | Ceiling **[inferred]** |
|---|---|---|
| Connector re-render on every drag frame | full SVG teardown + rebuild, `getElementById` ×2 per link | degrades noticeably in the low hundreds of links |
| Particle proximity graph | O(n²) — 120 particles = 7 140 checks/frame, hard-coded | fixed cost; the constant, not the growth, is the problem on low-end GPUs |
| Minimap refresh | full redraw + `getElementById` per card, 1 Hz plus every transform | linear in card count; fine at 62, wasteful at 1 000 |
| Gaze loop | viewport-culled at ±400 world px, half-rate — the best-optimised loop | scales well; leaks on deleted eyes |
| DOM card count | every card is a live DOM subtree with SVG children; no virtualisation or occlusion culling | thousands of cards will exhaust layout, not JS |
| Single-file delivery | 122 KB uncompressed HTML, no code splitting | fine today; every new zone grows the critical path |
| Concurrency | none — one user, no shared state | **N/A** |

### 17.8 Notable architectural strengths

* **Radical deployability.** One file, no build, no lockfile, no toolchain rot. It will still open in
  a browser in ten years. `path: '.'` → Pages is about as simple as a release pipeline can be.
* **Genuine separation of animation concerns.** Ambient motion is CSS keyframes; only *reactive*
  motion (gaze, dilation, particles) is on the JS thread.
* **Deterministic procedural content.** `rng(seed)` + `iris(opt)` means the board is byte-identical
  across loads and across machines — trivially reproducible for screenshots and bug reports.
* **Correct zoom-at-cursor maths**, with a clamped scale range and focal-point correction.
* **Sensible defensive guards** in exactly the places where the DOM might not be ready
  (`if (!el) return`, `?.`, `if (ec)`).
* **Above-average repository hygiene for a single-file toy:** CHANGELOG, CONTRIBUTING, SECURITY,
  CODE_OF_CONDUCT, SUPPORT, issue/PR templates, Dependabot, JSDoc typedefs on the core state.
* **Least-privilege CI** with explicit `permissions:` and OIDC deployment.

### 17.9 Technical debt and ambiguity

**Correctness**

1. `deleteCard()` does not prune `eyes[]` → dangling records animated forever.
2. `ctxAction('duplicate')` clones `innerHTML` including iris SVG but never calls `scanEyes`, so
   duplicated eyes are inert; it also duplicates SVG gradient **ids**, producing document-wide id
   collisions.
3. The marquee (`selection-box`) is drawn but **no hit-testing is ever performed** — dragging a
   selection rectangle selects nothing. `README.md` advertises this as a feature.
4. `conn-' + Date.now()` ids collide within the same millisecond.
5. `createCard`'s `extraClass` parameter is accepted and silently discarded.
6. Middle-click panning bypasses `state.tool`, leaving the cursor state inconsistent on release.
7. `filter id="glow-N"` defs are generated on every `renderConnectors()` call and referenced by
   nothing.

**Structure**

8. The viewport→world transform is duplicated at seven call sites instead of being one function.
9. Two sources of truth for geometry (`state.cards[].x/y` vs `style.left/top`), with the DOM winning.
10. Cross-script coupling through globals; nothing is testable in isolation.
11. `buildCanvas()` is a ~560-line literal-markup function; `buildOculus()` is ~460. Content and
    engine are interleaved, so adding content means editing the engine file.
12. No `try/catch`, no `window.onerror` — a single throw silently kills a rAF loop.

**Supply chain**

13. An unused, un-integrity-checked, render-blocking third-party script (`d3.min.js`).
14. `SECURITY.md` documents an SRI procedure and a CSP that are not applied to `index.html`.

**Documentation drift (found while writing this file)**

| Claim | Where | Reality |
|---|---|---|
| "D3.js force simulation for ambient particles" | README, old ARCHITECTURE | Hand-written integrator in `animParticles()`; D3 never called |
| "D3.js-rendered bezier paths" / "`d3.line()` cardinal interpolation" | README | Manual `createElementNS` + string-built cubic bezier |
| "Cards use `will-change: transform`" | README, old ARCHITECTURE | `will-change` appears once, on `.eye-svg .eye-globe/.pupil-grp`, never on `.card` |
| "Connector redraws debounced on pan/zoom end" | README, old ARCHITECTURE | Re-rendered on **every** drag `mousemove` |
| `state = { links: [], selected: [], pan: {x,y}, zoom: 1 }` | README | Actual keys are `connections`, `selectedCards` (a `Set`), `x`, `y`, `scale` |
| "Off-screen eyes skip render" | old ARCHITECTURE | True — the one performance claim that holds |
| Four card types | README | 15 distinct `data-type` values are emitted |
| "Keyboard shortcuts are planned for a future release" | README | Space / Escape / Delete / Backspace are already implemented |
| `addStickyNote(x, y)` takes coordinates | API.md | Takes no parameters; position is viewport-origin + random offset |
| SVG `feGaussianBlur` glow | old ARCHITECTURE | Filters defined but unreferenced; glow is a wide translucent stroke |

**Ambiguity / unknowns**

* Branch protection, required checks and the `github-pages` environment's reviewer rules are
  configured in GitHub settings, not in the repository — **[unknown]** from source alone.
* Whether the alternative hosts in README (Netlify, Cloudflare, Vercel, S3) are actually in use —
  **[unknown]**; no configuration for any of them is committed.
* `CHANGELOG.md` claims a `1.0.0` release dated `2024-XX-XX`; there are no git tags and no release —
  the version line is **[inferred, unverified]**.
* `#tooltip` and `#search-input` exist with no logic: unfinished features or intentional scaffolding
  — **[unknown]**.

### 17.10 Proposed next architectural moves (not present in the repository)

These are **[proposed]** only, listed so a new engineer knows what the shape of change would be:

1. Extract the viewport↔world transform into `toWorld()` / `toScreen()` helpers — removes seven
   duplications and makes the coordinate system testable.
2. Either delete the D3 `<script>` tag (it is unused) or vendor it locally with SRI. Deleting it
   removes a whole trust zone and speeds up first paint.
3. Make `state` the single source of geometry; have renderers read `state.cards`, and write to the
   DOM only in `applyTransform`-style sinks.
4. Prune `eyes[]` inside `deleteCard`, and re-run `scanEyes` on duplicated cards.
5. Batch `renderConnectors()` behind `requestAnimationFrame` — the one change with the largest
   perceived-performance payoff.
6. If persistence is ever wanted, the natural first step is serialising `{cards, connections, x, y,
   scale}` to `localStorage` or a JSON export; the entity model in §8 is already the schema.
```
