#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { compilePatterns } from './redact.js';
import { buildExport } from './redact.js';
import { createProxyServer } from './proxy.js';
import { startUiServer } from './server.js';
import { TraceStore } from './store.js';
import type { CliOptions } from './types.js';

class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export interface CliIo {
  out: (text: string) => void;
  err: (text: string) => void;
}

function readVersion(): string {
  try {
    const raw = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === 'string' ? parsed.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const VERSION = readVersion();

const HELP = `NoxaPlus TraceBox ${VERSION} — see every request your app makes.

Usage
  tracebox start --target <url> [options]
  tracebox export [options]
  tracebox --help
  tracebox --version

Start options
  --target <url>         Upstream base URL (required), e.g. http://localhost:3000
  --port <number>        Proxy port (default: 8787)
  --ui <number>          Dashboard port (default: 4040)
  --host <address>       Bind address for both servers (default: 127.0.0.1)
  --limit <number>       Exchanges kept in memory (default: 200)
  --body-limit <mb>      Largest request body accepted (default: 5)
  --capture-limit <kb>   Largest body stored per message (default: 256)
  --timeout <seconds>    Upstream timeout (default: 30)
  --save <path>          Write a redacted export when the process stops
  --quiet                Suppress request logs

Export options
  --url <url>            Dashboard URL (default: http://127.0.0.1:4040)
  --out <path>           Write the export to a file (default: stdout)
  --redact <regex>       Extra body redaction pattern (repeatable)

How it works
  Point your app at the proxy port instead of the upstream. TraceBox forwards
  each request, streams the response back, and keeps a bounded copy for the
  dashboard. Replay resends a captured request. Diff compares two exchanges.

  Exports always mask Authorization, Cookie, token, and API-key headers,
  sensitive query parameters, and token-shaped strings in bodies.

Examples
  tracebox start --target http://localhost:3000
  tracebox start --target https://api.example.com --port 8787 --ui 4040
  tracebox export --out trace.json
  tracebox export --redact "acct_[0-9]{6}" --out trace.json
`;

const DEFAULT_OPTIONS: CliOptions = {
  command: 'help',
  target: undefined,
  port: 8787,
  ui: 4040,
  host: '127.0.0.1',
  limit: 200,
  requestLimit: 5 * 1024 * 1024,
  captureLimit: 256 * 1024,
  timeoutMs: 30000,
  save: undefined,
  url: 'http://127.0.0.1:4040',
  out: undefined,
  redactPatterns: [],
  quiet: false
};

function valueFor(argv: string[], index: number, flag: string, inline: string | undefined): { value: string; next: number } {
  if (inline !== undefined) {
    if (inline.length === 0) throw new UsageError(`${flag} requires a value.`);
    return { value: inline, next: index };
  }
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) throw new UsageError(`${flag} requires a value.`);
  return { value, next: index + 1 };
}

function positiveNumber(value: string, flag: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new UsageError(`${flag} must be a number between ${min} and ${max}.`);
  }
  return parsed;
}

function parseTarget(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new UsageError(`--target must be an absolute URL, for example http://localhost:3000.`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UsageError('--target must start with http:// or https://.');
  }
  return parsed.toString();
}

export function parseArgs(argv: string[]): CliOptions {
  if (argv.includes('--help') || argv.includes('-h')) return { ...DEFAULT_OPTIONS, command: 'help' };
  if (argv.includes('--version') || argv.includes('-v')) return { ...DEFAULT_OPTIONS, command: 'version' };

  const args = [...argv];
  let command: CliOptions['command'] = 'help';
  const first = args[0];
  if (first !== undefined && !first.startsWith('-')) {
    if (first !== 'start' && first !== 'export') {
      throw new UsageError(`Unknown command "${first}". Try "tracebox --help".`);
    }
    command = first;
    args.shift();
  }

  const options: CliOptions = { ...DEFAULT_OPTIONS, command, redactPatterns: [] };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) break;
    const equals = arg.indexOf('=');
    const flag = equals === -1 ? arg : arg.slice(0, equals);
    const inline = equals === -1 ? undefined : arg.slice(equals + 1);

    switch (flag) {
      case '--target': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.target = parseTarget(value);
        index = next;
        break;
      }
      case '--port': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.port = Math.round(positiveNumber(value, flag, 1, 65535));
        index = next;
        break;
      }
      case '--ui': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.ui = Math.round(positiveNumber(value, flag, 1, 65535));
        index = next;
        break;
      }
      case '--host': {
        const { value, next } = valueFor(args, index, flag, inline);
        if (value.trim().length === 0) throw new UsageError('--host requires an address.');
        options.host = value;
        index = next;
        break;
      }
      case '--limit': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.limit = Math.round(positiveNumber(value, flag, 1, 10000));
        index = next;
        break;
      }
      case '--body-limit': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.requestLimit = Math.round(positiveNumber(value, flag, 0.1, 1024) * 1024 * 1024);
        index = next;
        break;
      }
      case '--capture-limit': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.captureLimit = Math.round(positiveNumber(value, flag, 1, 10240) * 1024);
        index = next;
        break;
      }
      case '--timeout': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.timeoutMs = Math.round(positiveNumber(value, flag, 0.1, 600) * 1000);
        index = next;
        break;
      }
      case '--save': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.save = value;
        index = next;
        break;
      }
      case '--url': {
        const { value, next } = valueFor(args, index, flag, inline);
        try {
          const parsed = new URL(value);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('bad protocol');
        } catch {
          throw new UsageError('--url must be an absolute http(s) URL.');
        }
        options.url = value.replace(/\/+$/, '');
        index = next;
        break;
      }
      case '--out': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.out = value;
        index = next;
        break;
      }
      case '--redact': {
        const { value, next } = valueFor(args, index, flag, inline);
        options.redactPatterns.push(value);
        index = next;
        break;
      }
      case '--quiet':
        options.quiet = true;
        break;
      default:
        throw new UsageError(`Unknown option "${flag}". Try "tracebox --help".`);
    }
  }

  if (command === 'start') {
    if (options.target === undefined) throw new UsageError('start requires --target <url>.');
    if (options.save !== undefined && options.save.length === 0) throw new UsageError('--save requires a path.');
  }

  if (command === 'export') {
    if (options.redactPatterns.length > 0) {
      try {
        compilePatterns(options.redactPatterns);
      } catch (error) {
        throw new UsageError(error instanceof Error ? error.message : 'Invalid redaction pattern.');
      }
    }
    if (options.out !== undefined && options.out.length === 0) throw new UsageError('--out requires a path.');
  }

  return options;
}

function listen(server: http.Server, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function addressOf(server: http.Server, fallbackPort: number, host: string): string {
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : fallbackPort;
  return `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
}

function close(server: http.Server): Promise<void> {
  return new Promise(resolve => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
}

async function start(options: CliOptions, io: CliIo): Promise<number> {
  if (options.target === undefined) throw new UsageError('start requires --target <url>.');
  const target = new URL(options.target);
  const store = new TraceStore({ limit: options.limit, captureLimit: options.captureLimit });
  const proxy = createProxyServer({
    target,
    store,
    captureLimit: options.captureLimit,
    requestLimit: options.requestLimit,
    timeoutMs: options.timeoutMs
  });

  const ui = await startUiServer({
    store,
    target,
    version: VERSION,
    host: options.host,
    port: options.ui,
    captureLimit: options.captureLimit,
    timeoutMs: options.timeoutMs,
    quiet: options.quiet
  });

  try {
    await listen(proxy, options.port, options.host);
  } catch (error) {
    await close(ui.server);
    throw error;
  }

  const proxyUrl = addressOf(proxy, options.port, options.host);
  if (!options.quiet) {
    io.out(`NoxaPlus TraceBox ${VERSION}\n`);
    io.out(`Proxy      ${proxyUrl}  ->  ${target.toString()}\n`);
    io.out(`Dashboard  ${ui.url}\n`);
    io.out(`Keeping ${options.limit} exchanges · bodies ≤ ${Math.round(options.captureLimit / 1024)} KB · timeout ${Math.round(options.timeoutMs / 1000)}s\n`);
    io.out('Capturing. Press Ctrl+C to stop.\n');
  }

  await new Promise<void>(resolve => {
    const stop = (): void => {
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
      resolve();
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  });

  await Promise.all([close(proxy), close(ui.server)]);

  if (options.save !== undefined) {
    try {
      const payload = buildExport(store.all(), store.stats(), {
        version: VERSION,
        target,
        redactPatterns: []
      });
      await writeFile(options.save, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
      if (!options.quiet) io.out(`Saved a redacted export to ${options.save}\n`);
    } catch (error) {
      io.err(`Could not write ${options.save}: ${error instanceof Error ? error.message : 'unknown error'}\n`);
    }
  }

  return 0;
}

async function exportSession(options: CliOptions, io: CliIo): Promise<number> {
  const query = options.redactPatterns.map(pattern => `redact=${encodeURIComponent(pattern)}`).join('&');
  const url = `${options.url}/api/export${query.length > 0 ? `?${query}` : ''}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    io.err(`Could not reach TraceBox at ${options.url}. Is the dashboard running?\n`);
    return 2;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    io.err(`${payload?.error?.message ?? `Export failed with HTTP ${response.status}.`}\n`);
    return 2;
  }

  const body = await response.text();
  if (options.out !== undefined) {
    await writeFile(options.out, body, 'utf8');
    if (!options.quiet) {
      let count = 0;
      try {
        count = (JSON.parse(body) as { exchanges?: unknown[] }).exchanges?.length ?? 0;
      } catch {
        count = 0;
      }
      io.out(`Exported ${count} ${count === 1 ? 'exchange' : 'exchanges'} to ${options.out}\n`);
    }
  } else {
    io.out(body);
  }
  return 0;
}

export async function runCli(argv: string[], io: CliIo): Promise<number> {
  let options: CliOptions;
  try {
    options = parseArgs(argv);
  } catch (error) {
    if (error instanceof UsageError) {
      io.err(`${error.message}\n`);
      return 2;
    }
    throw error;
  }

  if (options.command === 'help') {
    io.out(HELP);
    return 0;
  }
  if (options.command === 'version') {
    io.out(`${VERSION}\n`);
    return 0;
  }

  try {
    if (options.command === 'start') return await start(options, io);
    if (options.command === 'export') return await exportSession(options, io);
    return 0;
  } catch (error) {
    if (error instanceof UsageError) {
      io.err(`${error.message}\n`);
      return 2;
    }
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    io.err(`${message}\n`);
    return 2;
  }
}

async function main(): Promise<void> {
  const code = await runCli(process.argv.slice(2), {
    out: text => process.stdout.write(text),
    err: text => process.stderr.write(text)
  });
  process.exitCode = code;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 2;
  });
}
