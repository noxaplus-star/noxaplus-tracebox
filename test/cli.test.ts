import http from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseArgs, runCli, VERSION } from '../src/cli.js';
import { close, listen } from './helpers.js';

let server: http.Server | undefined;
let directory: string | undefined;

afterEach(async () => {
  if (server !== undefined) {
    await close(server);
    server = undefined;
  }
  if (directory !== undefined) {
    await rm(directory, { recursive: true, force: true });
    directory = undefined;
  }
});

function io() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out: (text: string) => out.push(text),
    err: (text: string) => err.push(text),
    output: () => out.join(''),
    errors: () => err.join('')
  };
}

async function stubDashboard(body: unknown): Promise<string> {
  server = http.createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  });
  const port = await listen(server);
  return `http://127.0.0.1:${port}`;
}

describe('parseArgs', () => {
  it('defaults to help', () => {
    expect(parseArgs([]).command).toBe('help');
    expect(parseArgs(['--help']).command).toBe('help');
    expect(parseArgs(['--version']).command).toBe('version');
  });

  it('parses a full start command', () => {
    const options = parseArgs([
      'start',
      '--target',
      'http://localhost:3000',
      '--port',
      '9000',
      '--ui=9001',
      '--host',
      '0.0.0.0',
      '--limit',
      '50',
      '--body-limit',
      '2',
      '--capture-limit',
      '128',
      '--timeout',
      '5',
      '--save',
      'trace.json',
      '--quiet'
    ]);
    expect(options).toMatchObject({
      command: 'start',
      target: 'http://localhost:3000/',
      port: 9000,
      ui: 9001,
      host: '0.0.0.0',
      limit: 50,
      requestLimit: 2 * 1024 * 1024,
      captureLimit: 128 * 1024,
      timeoutMs: 5000,
      save: 'trace.json',
      quiet: true
    });
  });

  it('collects repeatable redaction patterns and strips a trailing slash from the URL', () => {
    const options = parseArgs(['export', '--url', 'http://127.0.0.1:4040/', '--redact', 'acct_[0-9]+', '--redact=key_[a-z]+', '--out', 'trace.json']);
    expect(options.url).toBe('http://127.0.0.1:4040');
    expect(options.redactPatterns).toEqual(['acct_[0-9]+', 'key_[a-z]+']);
    expect(options.out).toBe('trace.json');
  });

  it('rejects a missing target, bad ports, and unknown options', () => {
    expect(() => parseArgs(['start'])).toThrow(/requires --target/);
    expect(() => parseArgs(['start', '--target', 'http://localhost:3000', '--port', 'nope'])).toThrow(/--port/);
    expect(() => parseArgs(['start', '--target', 'ftp://localhost'])).toThrow(/http/);
    expect(() => parseArgs(['nope'])).toThrow(/Unknown command/);
    expect(() => parseArgs(['start', '--target', 'http://localhost:3000', '--wat'])).toThrow(/Unknown option/);
    expect(() => parseArgs(['export', '--redact', '('])).toThrow(/Invalid redaction pattern/);
  });
});

describe('runCli', () => {
  it('prints help and version', async () => {
    const helpIo = io();
    expect(await runCli(['--help'], helpIo)).toBe(0);
    expect(helpIo.output()).toContain('NoxaPlus TraceBox');
    expect(helpIo.output()).toContain('tracebox start --target');

    const versionIo = io();
    expect(await runCli(['--version'], versionIo)).toBe(0);
    expect(versionIo.output().trim()).toBe(VERSION);
  });

  it('returns 2 for usage errors', async () => {
    const output = io();
    expect(await runCli(['start'], output)).toBe(2);
    expect(output.errors()).toContain('--target');

    const unknown = io();
    expect(await runCli(['start', '--target', 'http://localhost:3000', '--wat'], unknown)).toBe(2);
    expect(unknown.errors()).toContain('Unknown option');
  });

  it('streams an export to stdout', async () => {
    const url = await stubDashboard({ tool: 'tracebox', exchanges: [{ id: 'a' }, { id: 'b' }] });
    const output = io();
    expect(await runCli(['export', '--url', url], output)).toBe(0);
    const parsed = JSON.parse(output.output()) as { tool: string };
    expect(parsed.tool).toBe('tracebox');
  });

  it('writes an export to a file and reports the count', async () => {
    const url = await stubDashboard({ tool: 'tracebox', exchanges: [{ id: 'a' }, { id: 'b' }] });
    directory = await mkdtemp(join(tmpdir(), 'tracebox-cli-'));
    const out = join(directory, 'trace.json');
    const output = io();
    expect(await runCli(['export', '--url', url, '--out', out], output)).toBe(0);
    expect(output.output()).toContain('Exported 2 exchanges');
    const raw = await readFile(out, 'utf8');
    expect(JSON.parse(raw)).toMatchObject({ tool: 'tracebox' });
  });

  it('returns 2 when the dashboard is unreachable', async () => {
    const output = io();
    const code = await runCli(['export', '--url', 'http://127.0.0.1:1'], output);
    expect(code).toBe(2);
    expect(output.errors()).toContain('Could not reach TraceBox');
  });
});
