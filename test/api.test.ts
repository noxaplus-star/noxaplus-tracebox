import type http from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TraceStore } from '../src/store.js';
import { startUiServer } from '../src/server.js';
import { close, startUpstream, type ReceivedRequest } from './helpers.js';
import type { Exchange, StoreStats } from '../src/types.js';

interface Context {
  upstream: http.Server;
  ui: http.Server;
  uiUrl: string;
  store: TraceStore;
  target: URL;
  received: ReceivedRequest[];
}

let context: Context | undefined;

function seed(store: TraceStore, path = '/hello'): Exchange {
  return store.add({
    startedAt: '2026-11-13T10:00:00.000Z',
    durationMs: 18,
    request: {
      method: 'GET',
      path,
      headers: { authorization: 'Bearer abcdefghijklmnop', accept: 'application/json' },
      body: '',
      bodyBytes: 0,
      bodyTruncated: false
    },
    response: {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true,"token":"sk-live-abcdefghijklmnop"}',
      bodyBytes: 47,
      bodyTruncated: false
    }
  });
}

beforeEach(async () => {
  const upstream = await startUpstream();
  const target = new URL(upstream.url);
  const store = new TraceStore({ limit: 10, captureLimit: 1024 });
  const ui = await startUiServer({
    store,
    target,
    version: '1.0.0',
    host: '127.0.0.1',
    port: 0,
    captureLimit: 1024,
    timeoutMs: 2000,
    quiet: true
  });
  context = { upstream: upstream.server, ui: ui.server, uiUrl: ui.url, store, target, received: upstream.received };
});

afterEach(async () => {
  if (context === undefined) return;
  await close(context.ui);
  await close(context.upstream);
  context = undefined;
});

describe('dashboard API', () => {
  it('serves the dashboard page', async () => {
    if (context === undefined) throw new Error('missing context');
    const response = await fetch(`${context.uiUrl}/`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('NoxaPlus');
    expect(html).toContain('TraceBox');
    expect(html).toContain(context.target.toString());
  });

  it('reports health and the target', async () => {
    if (context === undefined) throw new Error('missing context');
    const response = await fetch(`${context.uiUrl}/api/health`);
    const payload = (await response.json()) as { status: string; version: string; target: string; stats: StoreStats };
    expect(payload.status).toBe('ok');
    expect(payload.version).toBe('1.0.0');
    expect(payload.target).toBe(context.target.toString());
    expect(payload.stats.retained).toBe(0);
  });

  it('lists, filters, and resolves exchanges', async () => {
    if (context === undefined) throw new Error('missing context');
    const exchange = seed(context.store, '/hello');
    seed(context.store, '/orders');

    const list = (await (await fetch(`${context.uiUrl}/api/exchanges?method=GET&search=hello`)).json()) as {
      exchanges: Array<{ id: string; path: string }>;
    };
    expect(list.exchanges).toHaveLength(1);
    expect(list.exchanges[0]?.path).toBe('/hello');

    const detail = await fetch(`${context.uiUrl}/api/exchanges/${exchange.id}`);
    expect(detail.status).toBe(200);
    const body = (await detail.json()) as Exchange;
    expect(body.response.body).toContain('"ok":true');

    const missing = await fetch(`${context.uiUrl}/api/exchanges/nope`);
    expect(missing.status).toBe(404);
  });

  it('diffs two exchanges and validates its inputs', async () => {
    if (context === undefined) throw new Error('missing context');
    const first = seed(context.store);
    const second = seed(context.store);
    const response = await fetch(`${context.uiUrl}/api/diff?before=${first.id}&after=${second.id}`);
    expect(response.status).toBe(200);
    const diff = (await response.json()) as { changed: boolean; status: { before: number } };
    expect(diff.changed).toBe(false);
    expect(diff.status.before).toBe(200);

    expect((await fetch(`${context.uiUrl}/api/diff?before=${first.id}`)).status).toBe(400);
    expect((await fetch(`${context.uiUrl}/api/diff?before=${first.id}&after=missing`)).status).toBe(404);
  });

  it('exports redacted JSON and accepts custom patterns', async () => {
    if (context === undefined) throw new Error('missing context');
    const exchange = seed(context.store);
    const response = await fetch(`${context.uiUrl}/api/export?redact=ok%5C%3Atrue`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('tracebox-');
    const raw = await response.text();
    expect(raw).not.toContain('sk-live-abcdefghijklmnop');
    const payload = JSON.parse(raw) as {
      tool: string;
      redacted: boolean;
      redactionCount: number;
      exchanges: Exchange[];
    };
    expect(payload.tool).toBe('tracebox');
    expect(payload.redacted).toBe(true);
    expect(payload.redactionCount).toBeGreaterThan(0);
    expect(payload.exchanges[0]?.request.headers.authorization).toBe('[redacted]');
    expect(payload.exchanges[0]?.response.body).not.toContain('abcde');
    expect(payload.exchanges[0]?.id).toBe(exchange.id);

    const invalid = await fetch(`${context.uiUrl}/api/export?redact=%28`);
    expect(invalid.status).toBe(400);
  });

  it('replays an exchange and records the new one', async () => {
    if (context === undefined) throw new Error('missing context');
    const source = seed(context.store);
    const response = await fetch(`${context.uiUrl}/api/exchanges/${source.id}/replay`, { method: 'POST' });
    expect(response.status).toBe(201);
    const payload = (await response.json()) as { exchange: { sequence: number; status: number } };
    expect(payload.exchange.sequence).toBe(2);
    expect(payload.exchange.status).toBe(200);
    expect(context.store.stats().captured).toBe(2);
    expect(context.received).toHaveLength(1);
  });

  it('clears the buffer', async () => {
    if (context === undefined) throw new Error('missing context');
    seed(context.store);
    const response = await fetch(`${context.uiUrl}/api/exchanges`, { method: 'DELETE' });
    expect(response.status).toBe(200);
    expect(context.store.stats().retained).toBe(0);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    if (context === undefined) throw new Error('missing context');
    const response = await fetch(`${context.uiUrl}/api/nope`);
    expect(response.status).toBe(404);
    const payload = (await response.json()) as { error: { message: string } };
    expect(payload.error.message).toContain('/api/nope');
  });
});
