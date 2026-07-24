# Security

Security posture, threat model, and hardening guidance for VOID//OCULUS. The canonical vulnerability-reporting policy lives in the repository's [`SECURITY.md`](https://github.com/zazieproductions/void-oculus/blob/main/SECURITY.md); this page explains the reasoning and the deployment hardening options.

---

## Threat Model

VOID//OCULUS is a **purely client-side, stateless** application. That eliminates entire vulnerability classes and leaves a small, well-defined surface.

| Property | Consequence |
|---|---|
| No server, no API | No server-side injection, no auth bypass, no data-at-rest exposure |
| No persistence (no cookies, no localStorage, no IndexedDB) | Nothing to steal after tab close; no tracking surface ([ADR-005](Design-Decisions#adr-005-no-persistence-layer)) |
| No outbound requests after load | No exfiltration channel in the application code (`connect-src 'none'` is enforceable) |
| No accounts | No credentials, no PII |

### Remaining attack surface

| Vector | Risk | Mitigation |
|---|---|---|
| **CDN supply chain** (D3.js from cdnjs) | A compromised CDN could serve malicious JS with full page privileges | Version-pinned URL; add [SRI](#subresource-integrity-sri) or [self-host](Configuration#offline-deployment) for production |
| **Google Fonts** | Low — CSS/font payloads, plus a privacy consideration (requests expose visitor IPs to Google) | Self-host fonts for privacy-sensitive deployments |
| **`innerHTML` card content** | Script/markup injection **if a fork feeds untrusted strings** into `createCard()` | See [XSS considerations](#xss-considerations) |
| **Clickjacking / hostile embedding** | The app is embeddable by default | `X-Frame-Options` / `frame-ancestors` if undesired |
| **Deploy pipeline** | Malicious workflow change ⇒ malicious production deploy | Least-privilege workflow permissions; PR review on `main`; Dependabot on action versions |

## XSS Considerations

`createCard(type, x, y, content)` assigns `content` via `innerHTML`, and card bodies are authored as HTML strings throughout the codebase. In the **stock application this is safe**: all content is static, author-controlled markup, and there is no user-supplied string input reaching `innerHTML` (the search field has no handler; in-place editing isn't implemented yet).

**Rules for forks and future features:**

1. Any feature that puts *user-typed text* into a card (in-place editing, import) **must** escape it or use `textContent` for text regions — never interpolate raw input into `innerHTML`.
2. Canvas import (a roadmap item) must treat imported JSON as hostile: whitelist card types, sanitize content, and validate coordinates.
3. When in doubt, build DOM nodes with `document.createElement` + `textContent`.

## Hardening a Production Deployment

### Content Security Policy

A minimal CSP compatible with the stock app (inline `<style>`/`<script>` are inherent to the single-file design, hence `'unsafe-inline'`):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'none';
  frame-ancestors 'self';
```

Self-hosting D3 and fonts ([Configuration § Offline Deployment](Configuration#offline-deployment)) lets you drop the third-party hosts entirely. Note that GitHub Pages does not support custom headers — use a `<meta http-equiv="Content-Security-Policy">` tag there, or front Pages with Cloudflare to inject headers.

### Subresource Integrity (SRI)

Pin the D3 payload cryptographically:

```bash
curl -sO https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js
openssl dgst -sha384 -binary d3.min.js | openssl base64 -A
```

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"
        integrity="sha384-<HASH_FROM_ABOVE>"
        crossorigin="anonymous"></script>
```

With SRI, a tampered CDN payload fails closed (D3 features degrade; no foreign code executes).

### Other headers

```
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: SAMEORIGIN     # only if you want to forbid third-party embedding
```

### CI/CD hygiene

- Workflow permissions are already least-privilege (`contents: read`; `pages: write` + `id-token: write` only for the deploy job).
- GitHub Actions are pinned to major versions and updated weekly by Dependabot — review those PRs; they are part of your supply chain.
- Since **every merge to `main` deploys**, treat PR review as a production change gate ([Development Workflow](Development-Workflow#branching-model)).

## Reporting a Vulnerability

**Do not open a public issue for security problems.** Use [GitHub Security Advisories](https://github.com/zazieproductions/void-oculus/security/advisories) for the repository. Include a description, reproduction steps, impact assessment, and a suggested fix if you have one. Maintainers aim to acknowledge within **48 hours**; reporters are credited on request. Full policy: [`SECURITY.md`](https://github.com/zazieproductions/void-oculus/blob/main/SECURITY.md).

| Version | Supported |
|---|---|
| 1.x | ✅ |
| < 1.0 | ❌ |

---

**See also:** [Deployment](Deployment) · [Configuration](Configuration) · [Design Decisions](Design-Decisions)
