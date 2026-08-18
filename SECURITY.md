# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Currently supported |
| < 1.0   | ❌ Not supported        |

## Reporting a Vulnerability

If you discover a security vulnerability in VOID//OCULUS, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Contact the maintainers directly via the repository's security advisories
3. Provide detailed information about the vulnerability:
   - Description of the issue
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond to security reports within 48 hours and will work with reporters to:
- Confirm the vulnerability
- Determine the severity
- Develop and release a fix
- Credit reporters (if desired)

## Security Considerations

### Client-Side Only

VOID//OCULUS is a purely client-side application with no server-side components:

- **No data transmission**: User content is never sent to external servers
- **No authentication**: No user accounts, no credentials, no sensitive data
- **No cookies**: The application does not use cookies
- **Local persistence only**: Board state is written to this origin's `localStorage`
  under the key `void-oculus/session`. It never leaves the browser, and
  `⟲ RESET` (or `localStorage.removeItem('void-oculus/session')`) erases it.

### Untrusted Input Boundary

Storage is user-writable, so anything read back from it is treated as untrusted
even though this application wrote it. Restored card markup is parsed inside an
inert `<template>` — nothing executes, fetches or renders during inspection —
and filtered by `sanitizeHTML()`:

- **Tag allowlist**: elements outside the permitted set are removed entirely,
  which excludes `script`, `iframe`, `object`, `embed`, `link` and `form`.
- **Attribute deny rules**: `on*` handlers, `src` / `srcdoc` / `formaction`,
  non-fragment `href` and `xlink:href`, and `style` values containing `url(`,
  `expression(` or `javascript:`.

**Review gate for contributors:** any new path that brings markup in from
outside the repository — import, paste, drag-and-drop, URL fragment, query
parameter — must route through `sanitizeHTML()` and must never assign an
untrusted string to `innerHTML`. The smoke suite (`tests/smoke.mjs`) asserts
each rule above, including that sanitisation itself executes nothing; extend it
alongside any change to the policy.

### External Dependencies

The application loads **no external scripts**. A CI job in `ci/verify.yml`
fails the build if a `<script src=…>` is ever added to `index.html`. (Activate
it with `git mv ci/verify.yml .github/workflows/verify.yml`.)

| Resource | Origin | Purpose |
|----------|--------|---------|
| Google Fonts | fonts.googleapis.com / fonts.gstatic.com | Typography (optional; the layout degrades gracefully) |

Vendoring the three webfonts removes the last third-party origin and makes the
artifact fully self-contained.

### Content Security Policy

For enhanced security, consider deploying with a Content Security Policy (CSP). A minimal CSP for this application:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'none';
```

### iframe Embedding

The application can be embedded in iframes. If embedding on third-party sites is undesirable, add this header on your hosting platform:

```
X-Frame-Options: SAMEORIGIN
```

---

<p align="center">
  <em>Security is a shared responsibility. Thank you for your diligence.</em>
</p>
