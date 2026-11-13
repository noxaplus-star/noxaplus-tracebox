# Contributing to NoxaPlus TraceBox

Thanks for taking the time to make TraceBox more useful. This is a small, focused tool, and the best contributions keep it that way.

## Getting set up

```bash
git clone https://github.com/noxaplus-star/noxaplus-tracebox.git
cd noxaplus-tracebox
npm install
npm run typecheck
npm test
npm run build
```

Node 22 or newer. There are no runtime dependencies; please think twice before adding one.

## What a good change looks like

- **It solves a real capture or debugging problem.** "It might be nice" is not enough. Open an issue first for anything larger than a bug fix.
- **It stays local.** TraceBox should never phone home or require a cloud account.
- **It stays bounded.** New buffering must respect the configured limits; unbounded growth is a bug, not a feature.
- **It is honest about redaction.** Do not describe a pattern as catching "all secrets". Document what it does and what it doesn't.
- **It comes with a test** that starts a real server instead of mocking `http`.

## Tests

```bash
npm test               # full suite
npm run test:watch     # during development
```

Tests use real ephemeral HTTP servers and ports (`port: 0`). Do not hardcode ports, do not depend on network access, and clean up servers you start.

## Code style

- TypeScript in NodeNext ESM mode, strict flags on. `npm run typecheck` must pass.
- No runtime dependencies unless there is a strong reason.
- Comments only where the why is non-obvious.
- Keep the dashboard self-contained: no CDN, no external fonts, no build step for the UI.

## Commits and pull requests

- Write commit messages that explain **why**, not just what.
- One logical change per pull request.
- Describe how you verified the change — a test name, a manual command, or a screenshot for UI work.
- Do not bump the version or edit `CHANGELOG.md`; that happens at release time.

## Reporting bugs

Use the issue templates. A useful bug report includes the TraceBox and Node versions, the upstream type, whether the issue is reproducible through the proxy or only in the dashboard, and what the export shows.

## Code of conduct

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
