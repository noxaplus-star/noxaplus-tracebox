import type { Exchange, ExportOptions, HeaderMap, StoreStats, TraceExport } from './types.js';

const SENSITIVE_HEADER = /auth|token|secret|api[-_]?key|cookie|session|password|credential/i;

const BODY_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, replacement: 'Bearer [redacted]' },
  { pattern: /\bBasic\s+[A-Za-z0-9+/=]{8,}/gi, replacement: 'Basic [redacted]' },
  { pattern: /\bsk-[A-Za-z0-9_-]{16,}\b/g, replacement: '[redacted]' },
  { pattern: /\b(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{20,}\b/g, replacement: '[redacted]' },
  { pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, replacement: '[redacted]' },
  { pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g, replacement: '[redacted]' },
  { pattern: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g, replacement: '[redacted]' },
  { pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, replacement: '[redacted]' },
  { pattern: /"((?:password|passwd|pwd|secret|client_secret|token|access_token|refresh_token|api_key|apiKey|authorization))"\s*:\s*"[^"]*"/gi, replacement: '"$1":"[redacted]"' },
  { pattern: /(^|[?&\s])((?:password|passwd|pwd|secret|token|access_token|refresh_token|api_key|apikey|client_secret)=)[^&\s]+/gi, replacement: '$1$2[redacted]' }
];

const SENSITIVE_QUERY = /^(?:access_?token|refresh_?token|id_?token|api_?key|apikey|key|token|secret|client_?secret|password|passwd|pwd|auth|authorization|signature|sig|credential)$/i;

function countMatches(value: string, pattern: RegExp): number {
  const matches = value.match(pattern);
  return matches === null ? 0 : matches.length;
}

function redactHeaders(headers: HeaderMap): { headers: HeaderMap; count: number } {
  const result: HeaderMap = {};
  let count = 0;
  for (const [name, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER.test(name)) {
      result[name] = '[redacted]';
      count += 1;
    } else {
      result[name] = value;
    }
  }
  return { headers: result, count };
}

function redactPath(path: string): { path: string; count: number } {
  const separator = path.indexOf('?');
  if (separator === -1) return { path, count: 0 };
  const base = path.slice(0, separator);
  const query = path.slice(separator + 1);
  const params = new URLSearchParams(query);
  let count = 0;
  for (const key of [...params.keys()]) {
    if (SENSITIVE_QUERY.test(key)) {
      const values = params.getAll(key).length;
      params.delete(key);
      params.append(key, '[redacted]');
      count += Math.max(1, values);
    }
  }
  const paramsText = params.toString();
  return { path: paramsText.length === 0 ? base : `${base}?${paramsText}`, count };
}

function redactBody(body: string, custom: RegExp[]): { body: string; count: number } {
  let result = body;
  let count = 0;
  for (const rule of BODY_RULES) {
    count += countMatches(result, rule.pattern);
    result = result.replace(rule.pattern, rule.replacement);
  }
  for (const pattern of custom) {
    count += countMatches(result, pattern);
    result = result.replace(pattern, '[redacted]');
  }
  return { body: result, count };
}

export function compilePatterns(patterns: string[]): RegExp[] {
  return patterns.map(pattern => {
    try {
      return new RegExp(pattern, 'g');
    } catch {
      throw new Error(`Invalid redaction pattern: ${pattern}`);
    }
  });
}

export function redactExchange(exchange: Exchange, custom: RegExp[]): { exchange: Exchange; count: number } {
  const requestHeaders = redactHeaders(exchange.request.headers);
  const responseHeaders = redactHeaders(exchange.response.headers);
  const path = redactPath(exchange.request.path);
  const requestBody = redactBody(exchange.request.body, custom);
  const responseBody = redactBody(exchange.response.body, custom);

  const clean: Exchange = {
    ...exchange,
    request: {
      ...exchange.request,
      path: path.path,
      headers: requestHeaders.headers,
      body: requestBody.body
    },
    response: {
      ...exchange.response,
      headers: responseHeaders.headers,
      body: responseBody.body
    }
  };

  return {
    exchange: clean,
    count: requestHeaders.count + responseHeaders.count + path.count + requestBody.count + responseBody.count
  };
}

function cleanTarget(target: URL): string {
  const copy = new URL(target.toString());
  copy.username = '';
  copy.password = '';
  return copy.toString();
}

export function buildExport(exchanges: Exchange[], stats: StoreStats, options: ExportOptions): TraceExport {
  const custom = compilePatterns(options.redactPatterns);
  let redactionCount = 0;
  const redacted = exchanges.map(exchange => {
    const result = redactExchange(exchange, custom);
    redactionCount += result.count;
    return result.exchange;
  });

  return {
    tool: 'tracebox',
    name: 'NoxaPlus TraceBox',
    version: options.version,
    exportedAt: (options.now ?? new Date()).toISOString(),
    target: cleanTarget(options.target),
    redacted: true,
    redactionCount,
    note: 'Authorization, cookie, token, and API-key headers are masked, along with token-shaped strings in paths and bodies. Review the file before sharing it.',
    stats,
    exchanges: redacted
  };
}
