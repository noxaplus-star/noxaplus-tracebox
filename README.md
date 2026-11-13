# NoxaPlus TraceBox

**Your app swears it sent the header. The API swears it never arrived. TraceBox is the version of events that both of them have to agree on.**

A local capture proxy for HTTP traffic: point your app at it, watch every request and response in a live dashboard, replay the failed one, diff a working call against a broken one, and export a redacted file you can actually paste into a bug report.

No cloud. No account. No certificate to install.

[![CI](https://github.com/noxaplus-star/noxaplus-tracebox/actions/workflows/ci.yml/badge.svg)](https://github.com/noxaplus-star/noxaplus-tracebox/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-2be3c0.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-2be3c0.svg)](package.json)

![NoxaPlus TraceBox dashboard showing captured traffic and a response inspector](docs/board.png)

## The bug usually lives in the gap

You have logs on your side and status codes on theirs. What you don't have is the exact bytes that crossed the wire: the header your HTTP client quietly dropped, the JSON field that lost its quote, the `Accept-Encoding` that made the response unreadable, the 650 ms that came from somewhere.

Debuggers show you one side. Dashboard vendors show you a bill. TraceBox sits in the middle, keeps a bounded copy of the truth, and gets out of the way:

- **Streaming pass-through.** The client receives the upstream bytes as they arrive. Capture is a side effect, not a toll booth.
- **One dashboard, no setup.** Open `http://127.0.0.1:4040`. Traffic appears as it happens over SSE.
- **Replay without a terminal tab.** Resend a captured request and compare the fresh result with the original.
- **Diff that speaks HTTP.** Status, latency, headers, and bodies — line by line, with real line numbers.
- **Exports safe enough to share.** Auth headers, cookies, tokens, API keys, and token-shaped strings are masked before anything is written.

## Quick start

```bash
git clone https://github.com/noxaplus-star/noxaplus-tracebox.git
cd noxaplus-tracebox
npm install && npm run build

# terminal 1 — any upstream will do; a demo one ships with the repo
node examples/demo-server.mjs

# terminal 2 — start capturing
node dist/cli.js start --target http://127.0.0.1:3100
```

Now send traffic **through the proxy** (port `8787`) instead of straight to the API:

```bash
curl -s http://127.0.0.1:8787/api/users/42
curl -s -X POST http://127.0.0.1:8787/api/checkout \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer sk-demo-secret-value' \
  -d '{"tier":"pro","coupon":"LAUNCH"}'
```

Open **http://127.0.0.1:4040** and both calls are already there. Point a real app at the proxy by changing its base URL — `http://localhost:8787` instead of `http://localhost:3000` — and nothing else.

Install globally if you prefer:

```bash
npm install -g github:noxaplus-star/noxaplus-tracebox
tracebox start --target http://localhost:3000
```

## What ends up in the dashboard

Every exchange keeps the method, path, status, duration, request and response headers, the first 256 KB of each body, byte counts, and whether anything was truncated. Useful things you can do with it:

| Action | What it answers |
| --- | --- |
| Select an exchange | What exactly did we send, and what exactly came back? |
| **Replay** | Is this still broken, or was it a one-off? |
| **Pin** + **Diff** | What changed between the call that worked and the one that didn't? |
| **Export** | Can I hand this to someone without leaking a token? |
| Filter by method, status class, or text | Where is the noisy one? |

![Diff between two captured checkout requests](docs/diff.png)

The diff above compares two `POST /api/checkout` calls: same status, same endpoint, a two-millisecond latency difference, and bodies that diverge on exactly the line that mattered. That is the whole point — not more data, but the line that changed.

## How capture works

```
app ──► TraceBox proxy :8787 ──► upstream API
              │
              └── bounded copy ──► ring buffer ──► dashboard / API / export
                                        ▲
                                   replay / diff
```

- The proxy forwards the request, then pipes the upstream response back chunk by chunk. Capture is capped independently (`--capture-limit`), so a 4 GB download does not become a 4 GB memory leak.
- Request bodies are buffered up to `--body-limit` before forwarding; larger ones get a `413` instead of silently losing bytes.
- Responses are captured as received, byte for byte. If the upstream compresses, the stored body is still compressed — that is the honest record; the dashboard shows the raw text.
- The buffer holds `--limit` exchanges (default 200, oldest evicted first). Restart TraceBox and it is empty again. That is a feature.
- No TLS interception, no root certificate, no DNS games. TraceBox speaks plain HTTP to your app and to the upstream URL you give it. Put it in front of `https://` upstreams and it will connect over TLS — it just won't decrypt traffic from apps that already talk HTTPS end-to-end.

## Commands

```bash
tracebox start --target <url> [options]    # run proxy + dashboard
tracebox export [options]                  # write a redacted JSON export
tracebox --version
```

### `start`

| Flag | Default | Meaning |
| --- | --- | --- |
| `--target <url>` | — (required) | Upstream base URL |
| `--port <number>` | `8787` | Proxy port your app connects to |
| `--ui <number>` | `4040` | Dashboard and API port |
| `--host <address>` | `127.0.0.1` | Bind address for both servers |
| `--limit <number>` | `200` | Exchanges kept in memory |
| `--body-limit <mb>` | `5` | Largest accepted request body |
| `--capture-limit <kb>` | `256` | Largest body stored per message |
| `--timeout <seconds>` | `30` | Upstream timeout |
| `--save <path>` | — | Write a redacted export on shutdown |
| `--quiet` | off | Suppress per-request logs |

The dashboard binds to loopback by default. If you pass `--host 0.0.0.0`, you are publishing unredacted traffic to your network; don't do that on a coffee-shop Wi-Fi.

### `export`

| Flag | Default | Meaning |
| --- | --- | --- |
| `--url <url>` | `http://127.0.0.1:4040` | Dashboard to pull from |
| `--out <path>` | stdout | Where to write the JSON |
| `--redact <regex>` | — | Extra body pattern to mask (repeatable) |

```bash
tracebox export --out trace.json
tracebox export --redact 'acct_[0-9]{6}' --out trace.json
```

## Exports, and what "redacted" actually means

The export is a single JSON file with tool/version metadata, the upstream target (credentials stripped), buffer stats, and every exchange. Before writing, TraceBox masks:

- **Headers** whose names match `auth`, `token`, `secret`, `api[-_]key`, `cookie`, `session`, `password`, or `credential` — request and response.
- **Query parameters** like `access_token`, `api_key`, `signature`, `password`, and friends.
- **Token-shaped strings in bodies**: `Bearer …`, `Basic …`, `sk-…`, GitHub `ghp_`/`github_pat_`, AWS `AKIA`/`ASIA`, Google `AIza`, JWTs, Slack `xox…`, plus JSON fields named `password`, `token`, `api_key`, and similar.
- **Anything you supply** with `--redact`.

The export carries `"redacted": true` and a count of what was masked. But read the note in the file: this is a safety net for the obvious cases, not a guarantee that your customer's email address, internal hostname, or weird proprietary key format was caught. **Look at the file before you share it.** TraceBox will not pretend to know your domain's secrets.

## Dashboard API

The UI is a static page over a small JSON API. Everything the dashboard does, a script can do.

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Version, target, buffer stats |
| `GET /api/exchanges?method=&status=&search=&limit=` | Newest-first summaries |
| `GET /api/exchanges/:id` | Full exchange |
| `POST /api/exchanges/:id/replay` | Resend the captured request |
| `GET /api/diff?before=<id>&after=<id>` | Structured diff |
| `GET /api/export?redact=<regex>` | Download a redacted export |
| `DELETE /api/exchanges` | Clear the buffer |
| `GET /api/events` | SSE stream of new and evicted exchanges |

`status` accepts `2xx`, `3xx`, `4xx`, `5xx`, or `error` (a thrown request or a 5xx response).

## Replay, honestly

Replay sends the captured method, path, and body to the configured target and records the result as a new exchange marked `replayedFrom`. It is deliberately conservative:

- Truncated request bodies are refused rather than sent half-complete.
- Headers go through the same hop-by-hop filtering as live traffic.
- It does not resurrect cookies or sessions; if the original auth token expired, the replay will too.

That last point is the feature. Replay is for "is this endpoint still broken?", not for forging a session.

## Privacy

Traffic stays on your machine. TraceBox makes no outbound calls except to the upstream you configured. There is no telemetry, no account, no upload, and no "anonymous usage statistics" paragraph hiding in the fine print. The buffer is in memory and dies with the process.

## Limits worth knowing

- **Single upstream per process.** Run two TraceBox instances for two APIs.
- **Request bodies are buffered, response bodies are not.** Capture of responses is capped after the fact, so a response larger than `--capture-limit` is streamed to the client in full but stored truncated (and flagged as such).
- **Compressed responses are stored compressed.** The record is faithful; readability is your decoder's job.
- **WebSockets and HTTP/2 upgrades are not captured.** The proxy is built on Node's HTTP/1.1 server and passes those connections through only as ordinary requests, if at all.
- **In-memory only.** No persistence between runs. Use `--save` or `export` when you need a record.
- **One process, one port pair.** `--port` and `--ui` must not collide with anything already running.

## Development

```bash
npm install
npm run typecheck
npm test          # 51 tests: store, proxy, redaction, diff, API, CLI
npm run build
```

The test suite starts real HTTP servers on ephemeral ports and drives them through the proxy and API — no mocks pretending the network is cooperative.

## License

MIT © 2026 **NoxaPlus**. See [LICENSE](LICENSE).

Built because "it works on my machine" is not a status code.
