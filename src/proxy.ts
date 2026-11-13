import http, { type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from 'node:http';
import https from 'node:https';
import { STATUS_CODES } from 'node:http';
import type {
  CapturedRequest,
  CapturedResponse,
  CaptureOptions,
  Exchange,
  ExchangeInput,
  HeaderMap,
  ProxyOptions,
  ReplayOptions
} from './types.js';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host'
]);

export function toHeaderMap(headers: IncomingHttpHeaders): HeaderMap {
  const result: HeaderMap = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    result[name] = value;
  }
  return result;
}

export function forwardPath(target: URL, requestUrl: string | undefined): string {
  const raw = requestUrl ?? '/';
  if (/^https?:\/\//i.test(raw)) {
    const parsed = new URL(raw);
    return `${parsed.pathname}${parsed.search}`;
  }
  const base = target.pathname.replace(/\/+$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}

export function upstreamHeaders(request: IncomingMessage, target: URL): HeaderMap {
  const headers: HeaderMap = {};
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined || HOP_BY_HOP.has(name.toLowerCase())) continue;
    headers[name] = value;
  }
  headers.host = target.host;
  const forwardedFor = request.headers['x-forwarded-for'];
  const client = request.socket.remoteAddress ?? 'unknown';
  headers['x-forwarded-for'] = forwardedFor === undefined ? client : `${String(forwardedFor)}, ${client}`;
  headers['x-forwarded-proto'] = 'http';
  headers['x-forwarded-host'] = request.headers.host ?? '';
  headers['x-tracebox'] = '1';
  return headers;
}

interface BodyResult {
  ok: boolean;
  buffer: Buffer;
  totalBytes: number;
}

function readBody(request: IncomingMessage, limit: number): Promise<BodyResult> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let tooLarge = false;

    const cleanup = (): void => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
      request.off('aborted', onAborted);
    };

    const onData = (chunk: Buffer): void => {
      total += chunk.length;
      if (total > limit) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = (): void => {
      cleanup();
      resolve({ ok: !tooLarge, buffer: Buffer.concat(chunks), totalBytes: total });
    };
    const onError = (error: Error): void => {
      cleanup();
      reject(error);
    };
    const onAborted = (): void => {
      cleanup();
      reject(new Error('Client aborted the request.'));
    };

    request.on('data', onData);
    request.on('end', onEnd);
    request.on('error', onError);
    request.on('aborted', onAborted);
  });
}

function captureBody(chunks: Buffer[], capturedBytes: number, totalBytes: number): { body: string; truncated: boolean } {
  return {
    body: Buffer.concat(chunks).toString('utf8'),
    truncated: totalBytes > capturedBytes
  };
}

function bufferChunk(chunks: Buffer[], chunk: Buffer, capturedBytes: number, limit: number): number {
  if (capturedBytes >= limit) return capturedBytes;
  const room = limit - capturedBytes;
  if (chunk.length <= room) {
    chunks.push(chunk);
    return capturedBytes + chunk.length;
  }
  chunks.push(chunk.subarray(0, room));
  return limit;
}

function requestOptions(target: URL, method: string, path: string, headers: HeaderMap): http.RequestOptions {
  return {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port === '' ? undefined : Number(target.port),
    method,
    path,
    headers
  };
}

function transportFor(target: URL): typeof http | typeof https {
  return target.protocol === 'https:' ? https : http;
}

function errorResponse(message: string, status: number): CapturedResponse {
  return {
    status,
    statusText: STATUS_CODES[status] ?? 'Error',
    headers: { 'content-type': 'text/plain; charset=utf-8' },
    body: message,
    bodyBytes: Buffer.byteLength(message),
    bodyTruncated: false,
    error: message
  };
}

export function createProxyServer(options: ProxyOptions): http.Server {
  const { target, store, captureLimit, requestLimit, timeoutMs } = options;

  return http.createServer((request, response) => {
    const startedAt = new Date().toISOString();
    const started = performance.now();

    readBody(request, requestLimit)
      .then(body => {
        if (!body.ok) {
          const message = `Request body exceeded the ${formatBytes(requestLimit)} limit.`;
          const captured = errorResponse(message, 413);
          store.add({
            startedAt,
            durationMs: Math.round(performance.now() - started),
            request: {
              method: request.method ?? 'GET',
              path: forwardPath(target, request.url),
              headers: toHeaderMap(request.headers),
              body: body.buffer.toString('utf8'),
              bodyBytes: body.totalBytes,
              bodyTruncated: body.totalBytes > body.buffer.length
            },
            response: captured
          });
          sendPlain(response, 413, message);
          return;
        }

        forwardStreaming(request, response, body, {
          target,
          store,
          captureLimit,
          requestLimit,
          timeoutMs,
          started,
          startedAt
        });
      })
      .catch(error => {
        if (!response.headersSent) sendPlain(response, 400, error instanceof Error ? error.message : 'Could not read request.');
      });
  });
}

interface ForwardContext extends CaptureOptions {
  store: ProxyOptions['store'];
  started: number;
  startedAt: string;
}

function forwardStreaming(
  request: IncomingMessage,
  response: ServerResponse,
  body: BodyResult,
  context: ForwardContext
): void {
  const { target, store, captureLimit, timeoutMs, started, startedAt } = context;
  const path = forwardPath(target, request.url);
  const headers = upstreamHeaders(request, target);
  const method = request.method ?? 'GET';

  let settled = false;
  let timedOut = false;

  const requestBodyChunks: Buffer[] = [];
  const requestCaptured = bufferChunk(requestBodyChunks, body.buffer, 0, captureLimit);
  const capturedRequest: CapturedRequest = {
    method,
    path,
    headers: toHeaderMap(request.headers),
    body: captureBody(requestBodyChunks, requestCaptured, body.buffer.length).body,
    bodyBytes: body.buffer.length,
    bodyTruncated: body.buffer.length > requestCaptured
  };

  const upstream = transportFor(target).request(
    requestOptions(target, method, path, headers),
    upstreamResponse => {
      const status = upstreamResponse.statusCode ?? 502;
      const responseHeaders: HeaderMap = {};
      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (value === undefined || HOP_BY_HOP.has(name.toLowerCase())) continue;
        responseHeaders[name] = value;
      }

      if (!response.headersSent) response.writeHead(status, responseHeaders);

      const chunks: Buffer[] = [];
      let capturedBytes = 0;
      let totalBytes = 0;

      upstreamResponse.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        capturedBytes = bufferChunk(chunks, chunk, capturedBytes, captureLimit);
        if (!response.writableEnded) response.write(chunk);
      });

      upstreamResponse.on('end', () => {
        if (!response.writableEnded) response.end();
        const capturedResponse: CapturedResponse = {
          status,
          statusText: upstreamResponse.statusMessage ?? STATUS_CODES[status] ?? '',
          headers: responseHeaders,
          body: Buffer.concat(chunks).toString('utf8'),
          bodyBytes: totalBytes,
          bodyTruncated: totalBytes > capturedBytes
        };
        finish();
        store.add({
          startedAt,
          durationMs: Math.round(performance.now() - started),
          request: capturedRequest,
          response: capturedResponse
        });
      });

      upstreamResponse.on('error', error => {
        if (!response.writableEnded) response.end();
        fail(502, error.message);
      });
    }
  );

  const fail = (status: number, message: string): void => {
    if (settled) return;
    settled = true;
    if (!response.headersSent) {
      sendPlain(response, status, message);
    } else if (!response.writableEnded) {
      response.end();
    }
    store.add({
      startedAt,
      durationMs: Math.round(performance.now() - started),
      request: capturedRequest,
      response: errorResponse(message, timedOut ? 504 : status)
    });
  };

  const finish = (): void => {
    settled = true;
  };

  upstream.setTimeout(timeoutMs, () => {
    timedOut = true;
    upstream.destroy(new Error(`Upstream timed out after ${timeoutMs} ms.`));
  });

  upstream.on('error', error => {
    fail(timedOut ? 504 : 502, timedOut ? `Upstream timed out after ${timeoutMs} ms.` : error.message);
  });

  response.on('close', () => {
    if (!settled) upstream.destroy();
  });

  upstream.end(body.buffer);
}

function sendPlain(response: ServerResponse, status: number, message: string): void {
  if (response.writableEnded) return;
  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(`${message}\n`);
}

export async function replayRequest(options: ReplayOptions, source: Exchange): Promise<ExchangeInput> {
  if (source.request.bodyTruncated) {
    throw new Error('This request body was truncated during capture, so replay would send incomplete data.');
  }

  const { target, captureLimit, timeoutMs } = options;
  const headers = { ...source.request.headers };
  headers.host = target.host;
  for (const name of Object.keys(headers)) {
    if (HOP_BY_HOP.has(name.toLowerCase())) delete headers[name];
  }

  const startedAt = new Date().toISOString();
  const started = performance.now();
  const body = Buffer.from(source.request.body, 'utf8');

  return new Promise<ExchangeInput>((resolve, reject) => {
    let settled = false;
    let timedOut = false;
    const upstream = transportFor(target).request(
      requestOptions(target, source.request.method, source.request.path, headers),
      upstreamResponse => {
        const chunks: Buffer[] = [];
        let capturedBytes = 0;
        let totalBytes = 0;
        upstreamResponse.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          capturedBytes = bufferChunk(chunks, chunk, capturedBytes, captureLimit);
        });
        upstreamResponse.on('end', () => {
          settled = true;
          const status = upstreamResponse.statusCode ?? 502;
          const responseHeaders: HeaderMap = {};
          for (const [name, value] of Object.entries(upstreamResponse.headers)) {
            if (value === undefined || HOP_BY_HOP.has(name.toLowerCase())) continue;
            responseHeaders[name] = value;
          }
          const response: CapturedResponse = {
            status,
            statusText: upstreamResponse.statusMessage ?? STATUS_CODES[status] ?? '',
            headers: responseHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
            bodyBytes: totalBytes,
            bodyTruncated: totalBytes > capturedBytes
          };
          resolve({
            startedAt,
            durationMs: Math.round(performance.now() - started),
            request: source.request,
            response,
            replayedFrom: source.id
          });
        });
        upstreamResponse.on('error', reject);
      }
    );

    upstream.setTimeout(timeoutMs, () => {
      timedOut = true;
      upstream.destroy(new Error(`Upstream timed out after ${timeoutMs} ms.`));
    });

    upstream.on('error', error => {
      if (settled) return;
      settled = true;
      reject(timedOut ? new Error(`Upstream timed out after ${timeoutMs} ms.`) : error);
    });

    upstream.end(body);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
