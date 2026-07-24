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
- **No authentication**: No user accounts or sensitive data storage
- **No cookies**: The application does not use cookies
- **No local storage persistence**: Refreshes clear all data

### External Dependencies

The application loads external resources from trusted CDNs:

| Resource | CDN | Purpose |
|----------|-----|---------|
| D3.js 7.8.5 | cdnjs.cloudflare.com | Visualization library |
| Google Fonts | fonts.googleapis.com | Typography |

Subresource Integrity (SRI) is recommended for production deployments. To enable SRI:

1. Download the D3.js file locally
2. Calculate the SHA-384 hash: `openssl dgst -sha384 -binary d3.min.js | openssl base64 -A`
3. Add the integrity attribute to the script tag:
   ```html
   <script src="d3.min.js" integrity="sha384-HASH_FROM_ABOVE" crossorigin="anonymous"></script>
   ```

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
