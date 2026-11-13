import type http from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createProxyServer, forwardPath, replayRequest } from '../src/proxy.js';
import { TraceStore } from '../src/store.js';
import { close, listen, startUpstream, waitFor, type ReceivedRequest } from './helpers.js';

interface Context {
  upstream: http.Server;
  proxy: http.Server;
  store: TraceStore;
  proxyUrl: string;
  received: ReceivedRequest[];
}

let context: Context | undefined;

async function setup(options: { requestLimit?: number; captureLimit?: number; timeoutMs?: number; basePath?: string } = {}): Promise<Context> {
  const upstream = await startUpstream();
  const store = new TraceStore({ limit: 20, captureLimit: options.captureLimit ?? 1024 });
  const target = new URL(`${upstream.url}${options.basePath ?? ''}`);
  const proxy = createProxyServer({
    target,
    store,
    captureLimit: options.captureLimit ?? 1024,
    requestLimit: options.requestLimit ?? 1024 * 1024,
    timeoutMs: options.timeoutMs ?? 2000
  });
  const port = await listen(proxy);
  return { upstream, proxy, store, proxyUrl: `http://127.0.0.1:${port}`, received: upstream.received };
}

beforeEach(async () => {
  context = await setup();
});

afterEach(async () => {
  if (context === undefined) return;
  await close(context.proxy);
  await close(context.upstream.server);
  context = undefined;
});

describe('proxy capture', () => {
  it('forwards a GET request and captures the response', async () => {
    if (context === undefined) throw new Error('missing context');
    const response = await fetch(`${context.proxyUrl}/hello?x=1`, { headers: { accept: 'application/json' } });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; path: string; query: string };
    expect(body).toMatchObject({ ok: true, path: '/hello', query: '?x=1' });

    await waitFor(() => context?.store.stats().captured === 1);
    const exchange = context.store.all()[0];
    expect(exchange?.request.method).toBe('GET');
    expect(exchange?.request.path).toBe('/hello?x=1');
    expect(exchange?.response.status).toBe(200);
    expect(exchange?.response.headers['x-upstream']).toBe('tracebox-test');
    expect(exchange?.response.body).toContain('"ok":true');
    expect(exchange?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('joins a base path on the target', async () => {
    if (context === undefined) throw new Error('missing context');
    await close(context.proxy);
    await close(context.upstream.server);
    context = await setup({ basePath: '/api' });
    const response = await fetch(`${context.proxyUrl}/hello`);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { path: string };
    expect(payload.path).toBe('/api/hello');
    await waitFor(() => context?.store.stats().captured === 1);
    expect(context.store.all()[0]?.request.path).toBe('/api/hello');
  });

  it('captures and forwards a POST body', async () => {
    if (context === undefined) throw new Error('missing context');
    const response = await fetch(`${context.proxyUrl}/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'name=may&plan=pro'
    });
    expect(response.status).toBe(201);
    await waitFor(() => context?.store.stats().captured === 1);
    expect(context.received[0]?.body).toBe('name=may&plan=pro');
    expect(context.received[0]?.method).toBe('POST');
    expect(context.store.all()[0]?.request.body).toBe('name=may&plan=pro');
  });

  it('passes through a 500 and counts it as an error', async () => {
    if (context === undefined) throw new Error('missing context');
    const response = await fetch(`${context.proxyUrl}/fail`);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('upstream exploded');
    await waitFor(() => context?.store.stats().captured === 1);
    expect(context.store.stats().errors).toBe(1);
  });

  it('returns 502 when the upstream is unreachable', async () => {
    if (context === undefined) throw new Error('missing context');
    await close(context.proxy);
    await close(context.upstream.server);
    context = await setup();
    await close(context.upstream.server);
    const response = await fetch(`${context.proxyUrl}/hello`);
    expect(response.status).toBe(502);
    expect((await response.text()).length).toBeGreaterThan(0);
    await waitFor(() => context?.store.stats().captured === 1);
    expect(context.store.stats().errors).toBe(1);
    expect(context.store.all()[0]?.response.error).toBeDefined();
  });

  it('rejects an oversized request body without calling upstream', async () => {
    if (context === undefined) throw new Error('missing context');
    await close(context.proxy);
    await close(context.upstream.server);
    context = await setup({ requestLimit: 32 });
    const response = await fetch(`${context.proxyUrl}/echo`, {
      method: 'POST',
      body: 'x'.repeat(200)
    });
    expect(response.status).toBe(413);
    expect(context.received).toHaveLength(0);
    await waitFor(() => context?.store.stats().captured === 1);
    expect(context.store.all()[0]?.response.status).toBe(413);
  });

  it('streams the full response but stores only the capture limit', async () => {
    if (context === undefined) throw new Error('missing context');
    await close(context.proxy);
    await close(context.upstream.server);
    context = await setup({ captureLimit: 64 });
    const response = await fetch(`${context.proxyUrl}/large`);
    const text = await response.text();
    expect(text).toHaveLength(5000);
    await waitFor(() => context?.store.stats().captured === 1);
    const exchange = context.store.all()[0];
    expect(exchange?.response.bodyBytes).toBe(5000);
    expect(exchange?.response.body).toHaveLength(64);
    expect(exchange?.response.bodyTruncated).toBe(true);
  });

  it('returns 504 when the upstream times out', async () => {
    if (context === undefined) throw new Error('missing context');
    await close(context.proxy);
    await close(context.upstream.server);
    context = await setup({ timeoutMs: 60 });
    const response = await fetch(`${context.proxyUrl}/slow`);
    expect(response.status).toBe(504);
    await waitFor(() => context?.store.stats().captured === 1);
    expect(context.store.stats().errors).toBe(1);
  });
});

describe('replay', () => {
  it('resends a captured request and records its origin', async () => {
    if (context === undefined) throw new Error('missing context');
    await fetch(`${context.proxyUrl}/hello`);
    await waitFor(() => context?.store.stats().captured === 1);
    const source = context.store.all()[0];
    if (source === undefined) throw new Error('missing exchange');

    const replay = await replayRequest(
      {
        target: new URL(context.upstream.url),
        captureLimit: 1024,
        requestLimit: 1024,
        timeoutMs: 2000
      },
      source
    );
    expect(replay.response.status).toBe(200);
    expect(replay.replayedFrom).toBe(source.id);
    const stored = context.store.add(replay);
    expect(stored.sequence).toBe(2);
  });

  it('refuses to replay a truncated request body', async () => {
    if (context === undefined) throw new Error('missing context');
    await fetch(`${context.proxyUrl}/hello`);
    await waitFor(() => context?.store.stats().captured === 1);
    const source = context.store.all()[0];
    if (source === undefined) throw new Error('missing exchange');
    source.request.bodyTruncated = true;
    await expect(
      replayRequest(
        { target: new URL(context.upstream.url), captureLimit: 1024, requestLimit: 1024, timeoutMs: 2000 },
        source
      )
    ).rejects.toThrow(/truncated/);
  });
});

describe('forwardPath', () => {
  it('keeps the query string and joins the base path', () => {
    expect(forwardPath(new URL('http://localhost:3000/api/'), '/users?page=2')).toBe('/api/users?page=2');
    expect(forwardPath(new URL('http://localhost:3000/api'), 'users')).toBe('/api/users');
    expect(forwardPath(new URL('http://localhost:3000'), 'http://elsewhere.test/a?b=1')).toBe('/a?b=1');
  });
});
