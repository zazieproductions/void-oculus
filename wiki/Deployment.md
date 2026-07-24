# Deployment

VOID//OCULUS is a pure static site: deployment means serving `index.html` (plus the two PNG assets, optionally) from any web server. This page covers the reference GitHub Pages pipeline and alternatives.

**Key operational fact:** the canonical instance auto-deploys **on every push to `main`** — treat `main` as production ([ADR-008](Design-Decisions#adr-008-github-pages-via-actions-as-the-reference-deployment)).

---

## Reference Pipeline: GitHub Pages

### Flow

```mermaid
flowchart LR
    A[Push / merge to main] --> B[GitHub Actions\nstatic.yml]
    B --> C[actions/checkout@v4]
    C --> D[actions/configure-pages@v5]
    D --> E[upload-pages-artifact@v3\npath: repo root]
    E --> F[actions/deploy-pages@v5]
    F --> G[https://zazieproductions.github.io/void-oculus/]
```

### Workflow anatomy (`.github/workflows/static.yml`)

| Aspect | Value | Rationale |
|---|---|---|
| Triggers | `push` to `main`, `workflow_dispatch` | Continuous deploy + manual re-run |
| Permissions | `contents: read`, `pages: write`, `id-token: write` | Least privilege; OIDC-based Pages deploy (no PAT) |
| Concurrency | group `pages`, `cancel-in-progress: false` | Serializes deploys; in-flight production deploys complete |
| Artifact | Entire repository root | Single-file app; no build output to select |
| Environment | `github-pages` with deployment URL output | Deploy history and environment protection hooks |

### First-time setup on a fork

1. Push the repository to your GitHub account.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main` (or run the workflow manually from the Actions tab).
4. Your instance appears at `https://<user>.github.io/void-oculus/`.

### Verifying a deploy

- Actions tab → latest "Deploy static content to Pages" run is green.
- The `github-pages` environment shows the deployment URL.
- Load the URL with a hard refresh (`Ctrl/Cmd+Shift+R`); confirm the boot animation and a clean console.

### Rollback

Pages serves the last successful deployment. To roll back:

```bash
git revert <bad-commit-sha>
git push origin main        # triggers a fresh deploy of the reverted state
```

Reverting (rather than force-pushing) preserves history and keeps the deploy audit trail intact.

## Alternative Static Hosts

The app is host-agnostic — no server config, no rewrites, no headers required to *function*:

| Platform | Method | Build command |
|---|---|---|
| **Netlify** | Drag-and-drop the folder, or connect the repo | none |
| **Cloudflare Pages** | Connect repo | none (output dir: `/`) |
| **Vercel** | Import repo, framework preset **Other** | none |
| **AWS S3 (+ CloudFront)** | Upload files; enable static website hosting | n/a |
| **Any nginx/Apache** | Copy files to the docroot | n/a |

### Recommended headers for production forks

Functionality needs nothing, but hardening is cheap (details in [Security](Security)):

```
Content-Security-Policy: (see Security page for the tested policy)
X-Frame-Options: SAMEORIGIN          # if you don't want third-party embedding
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Cache-Control: public, max-age=300   # short TTL; the app is one mutable file
```

Keep `index.html` on a short cache TTL (or use ETags): it is the entire app, and a stale cached copy means users run an old version indefinitely.

## Offline / Air-gapped Deployment

Vendor D3.js and fonts locally per [Configuration → Offline Deployment](Configuration#offline-deployment), then deploy the folder to the internal host. No other changes required.

## Deployment Checklist

- [ ] Workflow run green; deployment URL responds
- [ ] Hard-refresh load: boot animation plays, zero console errors
- [ ] D3 loaded (`typeof d3 !== 'undefined'` in console)
- [ ] Fonts rendering (Orbitron in the toolbar logo is the obvious tell)
- [ ] [Smoke checklist](Testing#smoke-checklist) passes on the live URL
- [ ] If headers were added: CSP violations absent from the console

---

**See also:** [Security](Security) · [Testing](Testing) · [Development Workflow § Release Process](Development-Workflow#release-process)
