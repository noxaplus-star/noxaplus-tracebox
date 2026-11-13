# Changelog

All notable changes to NoxaPlus TraceBox are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-13

First release.

### Added

- **Capture proxy** — forwards HTTP requests to one upstream and streams responses back unchanged while keeping a bounded copy of request and response headers, bodies, byte counts, and timings.
- **Live dashboard** — self-contained page at `http://127.0.0.1:4040` with traffic list, method/status filters, full-text search, request/response inspector, and SSE updates.
- **Replay** — resend a captured request from the dashboard or API; the result is stored as a new exchange linked to its source. Truncated bodies are refused instead of sent half-complete.
- **Diff** — compare two exchanges across status, latency, headers, and bodies. Line diff uses LCS with a large-input fallback; header comparison is case-insensitive.
- **Redacted export** — single-file JSON snapshot that masks auth/cookie/token/API-key headers, sensitive query parameters, and token-shaped strings in bodies. Extra patterns via `--redact`.
- **Ring buffer** — configurable exchange limit with oldest-first eviction, buffer stats, and eviction events on the SSE stream.
- **CLI** — `tracebox start`, `tracebox export`, `--version`, `--help`, with validation for ports, URLs, durations, and redaction patterns. `--save` writes a redacted snapshot on shutdown.
- **Safety rails** — request size limit (`413`), upstream timeout (`504`), unreachable upstream (`502`), hop-by-hop header stripping, and loopback-only binding by default.
- **Test suite** — 51 tests against real ephemeral HTTP servers covering store, proxy, redaction, diff, API, and CLI behavior.

[1.0.0]: https://github.com/noxaplus-star/noxaplus-tracebox/releases/tag/v1.0.0
