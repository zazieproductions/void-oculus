# VOID//OCULUS Wiki

> **The canvas is an eye.** — An experimental, zero-build, browser-native infinite canvas and visual knowledge system with a reactive ocular interface.

**Live instance:** <https://zazieproductions.github.io/void-oculus/> · **Repository:** <https://github.com/zazieproductions/void-oculus> · **License:** MIT

---

## Start Here

| If you are… | Read in this order |
|---|---|
| **Evaluating the project** | [Project Overview](Project-Overview) → [Architecture](Architecture) |
| **A new user** | [Getting Started](Getting-Started) → [Troubleshooting](Troubleshooting) |
| **A new contributor** | [Getting Started](Getting-Started) → [Development Workflow](Development-Workflow) → [Conventions](Conventions) → [Contributing](Contributing) |
| **An experienced engineer diving deep** | [Architecture](Architecture) → [Design Decisions](Design-Decisions) → [API Reference](API-Reference) |
| **Operating a deployment** | [Deployment](Deployment) → [Security](Security) → [Configuration](Configuration) |

## Page Index

### Understand
- **[Project Overview](Project-Overview)** — What VOID//OCULUS is, scope, non-goals, feature matrix, roadmap
- **[Architecture](Architecture)** — Rendering layers, state model, coordinate systems, event flow, performance model
- **[Design Decisions](Design-Decisions)** — ADR-style record of why the system is built the way it is
- **[Glossary](Glossary)** — Precise definitions of project terminology

### Build & Run
- **[Getting Started](Getting-Started)** — Prerequisites, setup, first launch, controls
- **[Configuration](Configuration)** — Theming, canvas geometry, ocular engine tuning, offline mode
- **[Development Workflow](Development-Workflow)** — Branching, editing the single-file app, review, release
- **[Conventions](Conventions)** — Code style, naming, commit format, documentation standards

### Reference
- **[API Reference](API-Reference)** — Every public JavaScript function, with signatures and examples
- **[Deployment](Deployment)** — GitHub Pages pipeline and alternative static hosts
- **[Testing](Testing)** — Manual test matrix, smoke checklist, browser coverage, future automation

### Operate & Contribute
- **[Troubleshooting](Troubleshooting)** — Symptom → cause → fix tables, known limitations
- **[Security](Security)** — Threat model, CSP, SRI, vulnerability reporting
- **[Contributing](Contributing)** — How to report bugs, propose features, and submit pull requests

## Project at a Glance

| Property | Value |
|---|---|
| Application type | Single-file static SPA (`index.html`, ~3,200 lines: CSS + HTML + JS) |
| Build system | **None** — deliberately zero-build ([ADR-001](Design-Decisions#adr-001-single-file-zero-build-architecture)) |
| Runtime dependencies | D3.js 7.8.5 (CDN), Google Fonts (JetBrains Mono, Space Grotesk, Orbitron) |
| Persistence | None — state is in-memory per session ([ADR-005](Design-Decisions#adr-005-no-persistence-layer)) |
| Hosting | GitHub Pages via GitHub Actions (`.github/workflows/static.yml`) |
| Browser floor | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (no IE) |
| Language level | ES2020+, no transpilation |

## Documentation Map

The repository ships Markdown docs at its root; this wiki is the **navigable, task-oriented superset** of those documents. When they diverge, the repository files are canonical for legal/process matters (LICENSE, CODE_OF_CONDUCT, SECURITY policy) and the wiki is canonical for explanatory content.

| Repository file | Corresponding wiki page |
|---|---|
| `README.md` | [Project Overview](Project-Overview), [Getting Started](Getting-Started) |
| `ARCHITECTURE.md` | [Architecture](Architecture) |
| `API.md` | [API Reference](API-Reference) |
| `CONFIGURATION.md` | [Configuration](Configuration) |
| `CONTRIBUTING.md` | [Contributing](Contributing), [Conventions](Conventions) |
| `SECURITY.md` | [Security](Security) |
| `SUPPORT.md` | [Troubleshooting](Troubleshooting) |

## Maintaining This Wiki

- One concept per page; link rather than repeat. Duplicate content drifts.
- Every claim about behavior must be verifiable in `index.html` — cite the function name (e.g. `zoom()`, `renderConnectors()`).
- Keep the [Glossary](Glossary) authoritative for terminology; new terms are added there first.
- Update the wiki in the same review cycle as the change that invalidates it (see [Development Workflow](Development-Workflow#definition-of-done)).
