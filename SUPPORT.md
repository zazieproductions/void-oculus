# Support

## Getting Help

### Documentation

- **[README.md](./README.md)** — Project overview and quick start
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Technical architecture deep-dive
- **[CONFIGURATION.md](./CONFIGURATION.md)** — Customization guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Contribution guidelines

### Troubleshooting

#### Canvas doesn't render properly

1. Ensure you're using a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
2. Check that JavaScript is enabled
3. Check browser console for errors: `F12` or `Cmd+Option+I`

No internet connection is required — the application loads no external scripts.
Without a connection only the webfonts fail to resolve, and the layout falls
back to system typefaces.

#### Eyes not animating

1. Check whether your OS has "reduce motion" enabled — the interface honours it
   deliberately, stopping blinking, drift and the particle field while keeping
   pointer-driven gaze at reduced travel
2. Check that the browser isn't in battery-saver mode
3. Try refreshing the page

#### An old board keeps coming back

The session is restored from `localStorage` on every load. Use `⟲ RESET` in the
toolbar, or run `localStorage.removeItem('void-oculus/session')` in the console.

#### "SESSION NOT SAVED" appears

Storage is unavailable — usually private browsing, a zero quota, or a `file://`
policy. The board stays fully usable; changes just will not survive a reload.
Serving over `http://localhost` resolves it.

#### Can't connect cards

1. Ensure the LINK tool is selected in the toolbar
2. Click on the first card, then click on the second card
3. Check that both cards exist on the canvas

#### Performance issues

1. Reduce zoom level to decrease visible area
2. Remove unused cards from the canvas
3. Close other browser tabs
4. Try a different browser

## Community

### Discussions

For questions, ideas, and general discussion, use the [GitHub Discussions](https://github.com/zazieproductions/void-oculus/discussions) tab.

### Issues

Found a bug? Have a feature request? [Open an issue](https://github.com/zazieproductions/void-oculus/issues/new/choose).

### Social

- 🌟 Star this repo to show your support
- 🍴 Fork to create your own customized version
- 📢 Share with others who might find it useful

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute to this project.

## License

VOID//OCULUS is open-source software under the [MIT License](./LICENSE.md).

---

<p align="center">
  <em>Built with curiosity and caffeine.</em>
</p>
