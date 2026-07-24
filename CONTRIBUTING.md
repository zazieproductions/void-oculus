# Contributing to VOID//OCULUS

Thank you for your interest in contributing to VOID//OCULUS. This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and constructive environment for all contributors and users.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:

1. **Search existing issues** to avoid duplicates
2. **Test with the latest version** to ensure the issue persists
3. **Provide environment details**: browser name, version, and OS

A good bug report includes:
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots or screen recordings if applicable
- Browser console errors (if any)

### Suggesting Features

Feature requests are welcome. Please:

1. Search existing issues to see if the feature is already requested
2. Describe the problem your feature would solve
3. Provide use cases and examples
4. Consider backwards compatibility

### Pull Requests

1. **Fork the repository** and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Test thoroughly** across supported browsers:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

4. **Commit with clear messages**:
   ```bash
   git commit -m 'Add: feature description'
   ```

5. **Push to your fork** and submit a Pull Request

## Coding Standards

### Architecture

- Maintain the **single-file architecture** — all HTML, CSS, and JavaScript remain in `index.html` for easy distribution
- Use **semantic HTML5** elements where appropriate
- Follow **CSS custom properties** (variables) for theming
- Avoid external dependencies beyond D3.js and Google Fonts

### JavaScript

- Use **ES2020+ features** (const/let, arrow functions, template literals, optional chaining)
- Add **JSDoc comments** for all public functions
- Use **meaningful variable names** — avoid single letters except for loop counters
- **Comment complex logic** — if you had to think about it, document it

Example:
```javascript
/**
 * Calculates the center point of a card in canvas coordinates.
 * @param {string} id - Card element ID
 * @returns {{x: number, y: number}|null} Center coordinates or null if not found
 */
function getCardCenter(id) {
  // ...
}
```

### CSS

- Use the **existing CSS variable system** for colors
- Keep styles **scoped to their components** when possible
- Use **BEM-like naming** (`.card`, `.card--selected`, `.card__header`)

### Performance

- Avoid layout thrashing — batch DOM reads and writes
- Use `transform` and `opacity` for animations (GPU compositing)
- Debounce frequent events (scroll, resize, mousemove)

## Browser Support

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 90+ | ✅ Fully tested |
| Firefox | 88+ | ✅ Fully tested |
| Safari | 14+ | ✅ Fully tested |
| Edge | 90+ | ✅ Fully tested |
| Internet Explorer | — | ❌ Not supported |

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/zazieproductions/void-oculus.git
   ```

2. Open `index.html` directly in your browser, or serve locally:
   ```bash
   python3 -m http.server 8000
   ```

3. Make your changes and test

## Release Process

1. All changes are documented in `CHANGELOG.md`
2. Version bumps follow [Semantic Versioning](https://semver.org/)
3. Releases are automatically deployed via GitHub Actions to GitHub Pages

## Questions?

For questions about contributing, please open a discussion in the repository or contact the maintainers.

---

<p align="center">
  <em>All contributions are appreciated. Together, we build the canvas.</em>
</p>
