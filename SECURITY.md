# Security Policy

## Reporting a vulnerability

Please report security issues privately through GitHub's [private vulnerability reporting](https://github.com/noxaplus-star/noxaplus-tracebox/security/advisories/new) instead of opening a public issue.

Include, if you can:

- A description of the issue and its impact.
- Steps or a minimal reproducer.
- The TraceBox version (`tracebox --version`) and Node version.
- Whether the dashboard was bound to loopback or exposed on a network.

You can expect an acknowledgement within a few days. Once a fix is ready, the advisory and a patched release will be published together.

## What TraceBox can hold

TraceBox stores raw HTTP traffic in memory, including credentials and personal data that pass through the proxy. That is the point, and it is also the risk. Keep these in mind:

- The dashboard and its API are **unauthenticated**. Bind to `127.0.0.1` (the default). Do not expose `--host 0.0.0.0` on an untrusted network.
- The buffer is plaintext in process memory and dies with the process. There is no disk persistence except exports you write yourself.
- Exports are redacted, but redaction targets known token shapes and sensitive names. Review the file before sharing it.
- Anyone who can reach the dashboard can read captured traffic, replay requests, and clear the buffer.

## Scope

In scope: request smuggling or header injection through the proxy, escape from the configured upstream origin, command execution through CLI arguments, redaction bypasses that leak well-known credential formats, and denial of service through malformed input in the dashboard API.

Out of scope: traffic you chose to expose by binding the dashboard publicly, secrets present in captured traffic that no documented rule claims to mask, and issues that require an already-compromised machine.
