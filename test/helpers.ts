import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Exchange } from '../src/types.js';

export async function listen(server: http.Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  return typeof address === 'object' && address !== null ? address.port : 0;
}

export async function close(server: http.Server): Promise<void> {
  await new Promise<void>(resolve => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
}

export interface ReceivedRequest {
  method: string;
  url: string;
  body: string;
  headers: IncomingMessage['headers'];
}

export async function startUpstream(): Promise<{ server: http.Server; url: string; received: ReceivedRequest[] }> {
  const received: ReceivedRequest[] = [];
  const server = http.createServer((request: IncomingMessage, response: ServerResponse) => {
    const chunks: Buffer[] = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      received.push({ method: request.method ?? 'GET', url: request.url ?? '/', body, headers: request.headers });
      const url = new URL(request.url ?? '/', 'http://upstream.local');
      response.setHeader('x-upstream', 'tracebox-test');

      if (url.pathname.endsWith('/hello')) {
        const payload = JSON.stringify({ ok: true, path: url.pathname, query: url.search });
        response.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) });
        response.end(payload);
        return;
      }
      if (url.pathname.endsWith('/echo')) {
        const payload = JSON.stringify({ method: request.method, body, received: true });
        response.writeHead(201, { 'content-type': 'application/json' });
        response.end(payload);
        return;
      }
      if (url.pathname.endsWith('/slow')) {
        setTimeout(() => {
          response.writeHead(200, { 'content-type': 'text/plain' });
          response.end('late');
        }, 400);
        return;
      }
      if (url.pathname.endsWith('/large')) {
        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('a'.repeat(5000));
        return;
      }
      if (url.pathname.endsWith('/fail')) {
        response.writeHead(500, { 'content-type': 'text/plain' });
        response.end('upstream exploded');
        return;
      }
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found');
    });
  });
  const port = await listen(server);
  return { server, url: `http://127.0.0.1:${port}`, received };
}

export interface ExchangeOverrides {
  id?: string;
  sequence?: number;
  method?: string;
  path?: string;
  requestHeaders?: Record<string, string | string[]>;
  requestBody?: string;
  requestTruncated?: boolean;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string | string[]>;
  responseBody?: string;
  responseTruncated?: boolean;
  durationMs?: number;
  error?: string;
  replayedFrom?: string;
}

let counter = 0;

export function makeExchange(overrides: ExchangeOverrides = {}): Exchange {
  counter += 1;
  const requestBody = overrides.requestBody ?? '';
  const responseBody = overrides.responseBody ?? '{"ok":true}';
  const exchange: Exchange = {
    id: overrides.id ?? `exchange-${counter}`,
    sequence: overrides.sequence ?? counter,
    startedAt: '2026-11-13T10:00:00.000Z',
    durationMs: overrides.durationMs ?? 12,
    request: {
      method: overrides.method ?? 'GET',
      path: overrides.path ?? '/users/42',
      headers: overrides.requestHeaders ?? { accept: 'application/json' },
      body: requestBody,
      bodyBytes: Buffer.byteLength(requestBody),
      bodyTruncated: overrides.requestTruncated ?? false
    },
    response: {
      status: overrides.status ?? 200,
      statusText: overrides.statusText ?? 'OK',
      headers: overrides.responseHeaders ?? { 'content-type': 'application/json' },
      body: responseBody,
      bodyBytes: Buffer.byteLength(responseBody),
      bodyTruncated: overrides.responseTruncated ?? false
    }
  };
  if (overrides.error !== undefined) exchange.response.error = overrides.error;
  if (overrides.replayedFrom !== undefined) exchange.replayedFrom = overrides.replayedFrom;
  return exchange;
}

export async function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Timed out waiting for condition.');
}
