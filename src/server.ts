import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { diffExchanges } from './diff.js';
import { renderDashboard } from './dashboard.js';
import { replayRequest } from './proxy.js';
import { buildExport } from './redact.js';
import { toSummary } from './store.js';
import type { ExchangeListFilter, UiServerOptions } from './types.js';

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  response.end(body);
}

function sendError(response: ServerResponse, status: number, message: string): void {
  sendJson(response, status, { error: { message } });
}

function sanitizeTarget(target: URL): string {
  const copy = new URL(target.toString());
  copy.username = '';
  copy.password = '';
  return copy.toString();
}

function parseStatus(value: string | null): ExchangeListFilter['status'] | undefined {
  if (value === null || value === '') return undefined;
  if (value === '2xx' || value === '3xx' || value === '4xx' || value === '5xx' || value === 'error') return value;
  return undefined;
}

export function createUiServer(options: UiServerOptions): http.Server {
  const { store, target, version, quiet } = options;

  return http.createServer((request, response) => {
    const startedAt = performance.now();
    const method = request.method ?? 'GET';
    const url = new URL(request.url ?? '/', 'http://tracebox.local');
    const pathname = url.pathname;

    response.on('finish', () => {
      if (quiet !== true) console.log(`${method} ${pathname} ${response.statusCode} ${Math.round(performance.now() - startedAt)}ms`);
    });

    try {
      if (method === 'GET' && pathname === '/') {
        const html = renderDashboard(version, sanitizeTarget(target));
        response.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': Buffer.byteLength(html),
          'cache-control': 'no-store'
        });
        response.end(html);
        return;
      }

      if (method === 'GET' && pathname === '/api/health') {
        sendJson(response, 200, {
          status: 'ok',
          tool: 'tracebox',
          version,
          target: sanitizeTarget(target),
          stats: store.stats()
        });
        return;
      }

      if (method === 'GET' && pathname === '/api/exchanges') {
        const filter: ExchangeListFilter = {};
        const requestMethod = url.searchParams.get('method');
        if (requestMethod !== null && requestMethod !== '') filter.method = requestMethod;
        const status = parseStatus(url.searchParams.get('status'));
        if (status !== undefined) filter.status = status;
        const search = url.searchParams.get('search');
        if (search !== null && search !== '') filter.search = search;
        const limit = Number(url.searchParams.get('limit') ?? '');
        if (Number.isInteger(limit) && limit > 0) filter.limit = limit;
        sendJson(response, 200, { exchanges: store.list(filter), stats: store.stats() });
        return;
      }

      if (method === 'GET' && pathname === '/api/events') {
        streamEvents(request, response, store);
        return;
      }

      if (method === 'GET' && pathname === '/api/export') {
        const patterns = url.searchParams.getAll('redact');
        try {
          const payload = buildExport(store.all(), store.stats(), {
            version,
            target,
            redactPatterns: patterns
          });
          const body = `${JSON.stringify(payload, null, 2)}\n`;
          const stamp = new Date().toISOString().replace(/[:.]/g, '-');
          response.writeHead(200, {
            'content-type': 'application/json; charset=utf-8',
            'content-length': Buffer.byteLength(body),
            'content-disposition': `attachment; filename="tracebox-${stamp}.json"`,
            'cache-control': 'no-store'
          });
          response.end(body);
        } catch (error) {
          sendError(response, 400, error instanceof Error ? error.message : 'Could not build the export.');
        }
        return;
      }

      if (method === 'GET' && pathname === '/api/diff') {
        const before = url.searchParams.get('before');
        const after = url.searchParams.get('after');
        if (before === null || after === null) {
          sendError(response, 400, 'Both "before" and "after" exchange IDs are required.');
          return;
        }
        const left = store.get(before);
        const right = store.get(after);
        if (left === undefined || right === undefined) {
          sendError(response, 404, 'One or both exchanges are no longer in the buffer.');
          return;
        }
        sendJson(response, 200, diffExchanges(left, right));
        return;
      }

      const detailMatch = /^\/api\/exchanges\/([^/]+)$/.exec(pathname);
      if (method === 'GET' && detailMatch !== null) {
        const exchange = store.get(decodeURIComponent(detailMatch[1] ?? ''));
        if (exchange === undefined) {
          sendError(response, 404, 'That exchange is no longer in the buffer.');
          return;
        }
        sendJson(response, 200, exchange);
        return;
      }

      const replayMatch = /^\/api\/exchanges\/([^/]+)\/replay$/.exec(pathname);
      if (method === 'POST' && replayMatch !== null) {
        const exchange = store.get(decodeURIComponent(replayMatch[1] ?? ''));
        if (exchange === undefined) {
          sendError(response, 404, 'That exchange is no longer in the buffer.');
          return;
        }
        replayRequest(
          {
            target,
            captureLimit: options.captureLimit,
            requestLimit: 5 * 1024 * 1024,
            timeoutMs: options.timeoutMs
          },
          exchange
        )
          .then(input => {
            const replay = store.add(input);
            sendJson(response, 201, { exchange: toSummary(replay) });
          })
          .catch(error => {
            sendError(response, 502, error instanceof Error ? error.message : 'Replay failed.');
          });
        return;
      }

      if (method === 'DELETE' && pathname === '/api/exchanges') {
        store.clear();
        sendJson(response, 200, { cleared: true });
        return;
      }

      sendError(response, 404, `No route for ${method} ${pathname}.`);
    } catch (error) {
      sendError(response, 500, error instanceof Error ? error.message : 'Unexpected error.');
    }
  });
}

function streamEvents(request: IncomingMessage, response: ServerResponse, store: UiServerOptions['store']): void {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
  response.write('retry: 2000\n\n');

  const unsubscribe = store.subscribe(event => {
    response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  });
  const heartbeat = setInterval(() => {
    response.write(': ping\n\n');
  }, 15000);
  heartbeat.unref();

  const stop = (): void => {
    clearInterval(heartbeat);
    unsubscribe();
    response.end();
  };
  request.on('close', stop);
}

export async function startUiServer(options: UiServerOptions): Promise<{ server: http.Server; url: string }> {
  const server = createUiServer(options);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : options.port;
  const host = options.host === '0.0.0.0' ? '127.0.0.1' : options.host;
  return { server, url: `http://${host}:${port}` };
}
