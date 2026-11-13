import { describe, expect, it } from 'vitest';
import { buildExport, compilePatterns, redactExchange } from '../src/redact.js';
import { makeExchange } from './helpers.js';

describe('header redaction', () => {
  it('masks auth, cookie, and api-key headers in requests and responses', () => {
    const exchange = makeExchange({
      requestHeaders: {
        authorization: 'Bearer sk-live-abcdefghijklmnop',
        cookie: 'session=abc123',
        'x-api-key': 'key-123',
        accept: 'application/json'
      },
      responseHeaders: {
        'set-cookie': 'session=next; HttpOnly',
        'content-type': 'application/json'
      }
    });
    const result = redactExchange(exchange, []);
    expect(result.exchange.request.headers.authorization).toBe('[redacted]');
    expect(result.exchange.request.headers.cookie).toBe('[redacted]');
    expect(result.exchange.request.headers['x-api-key']).toBe('[redacted]');
    expect(result.exchange.request.headers.accept).toBe('application/json');
    expect(result.exchange.response.headers['set-cookie']).toBe('[redacted]');
    expect(result.exchange.response.headers['content-type']).toBe('application/json');
    expect(result.count).toBeGreaterThanOrEqual(4);
  });

  it('does not mutate the captured exchange', () => {
    const exchange = makeExchange({ requestHeaders: { authorization: 'Bearer secret-token' } });
    redactExchange(exchange, []);
    expect(exchange.request.headers.authorization).toBe('Bearer secret-token');
  });
});

describe('path redaction', () => {
  it('masks sensitive query parameters and leaves the rest', () => {
    const exchange = makeExchange({ path: '/login?user=may&token=abc123&api_key=xyz&page=2' });
    const result = redactExchange(exchange, []);
    expect(result.exchange.request.path).toContain('user=may');
    expect(result.exchange.request.path).toContain('page=2');
    expect(result.exchange.request.path).toContain('token=%5Bredacted%5D');
    expect(result.exchange.request.path).toContain('api_key=%5Bredacted%5D');
    expect(result.exchange.request.path).not.toContain('abc123');
  });

  it('leaves a path without a query alone', () => {
    const exchange = makeExchange({ path: '/users/42' });
    expect(redactExchange(exchange, []).exchange.request.path).toBe('/users/42');
  });
});

describe('body redaction', () => {
  it('masks bearer tokens, provider keys, and JWTs', () => {
    const exchange = makeExchange({
      requestBody: 'Authorization: Bearer abcdefghijk\nkey=sk-live-abcdefghijklmnop\naws=AKIAIOSFODNN7EXAMPLQ',
      responseBody: '{"token":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiJ9.signaturepart"}'
    });
    const result = redactExchange(exchange, []);
    expect(result.exchange.request.body).not.toContain('abcdefghijk');
    expect(result.exchange.request.body).not.toContain('sk-live-abcdefghijklmnop');
    expect(result.exchange.request.body).not.toContain('AKIAIOSFODNN7EXAMPLQ');
    expect(result.exchange.response.body).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(result.exchange.response.body).toContain('"token":"[redacted]"');
  });

  it('masks password fields in JSON', () => {
    const exchange = makeExchange({ requestBody: '{"user":"may","password":"hunter2","plan":"pro"}' });
    const result = redactExchange(exchange, []);
    expect(result.exchange.request.body).toContain('"password":"[redacted]"');
    expect(result.exchange.request.body).toContain('"plan":"pro"');
  });

  it('applies custom patterns', () => {
    const exchange = makeExchange({ responseBody: 'account acct_123456 is active' });
    const result = redactExchange(exchange, compilePatterns(['acct_[0-9]{6}']));
    expect(result.exchange.response.body).toBe('account [redacted] is active');
  });

  it('rejects an invalid custom pattern', () => {
    expect(() => compilePatterns(['('])).toThrow(/Invalid redaction pattern/);
  });
});

describe('buildExport', () => {
  it('produces a marked, redacted export with a clean target', () => {
    const exchange = makeExchange({
      requestHeaders: { authorization: 'Bearer abcdefghijkl' }
    });
    const payload = buildExport([exchange], { retained: 1, captured: 1, evicted: 0, errors: 0, bytes: 10 }, {
      version: '1.0.0',
      target: new URL('http://user:pass@localhost:3000/api'),
      redactPatterns: [],
      now: new Date('2026-11-13T12:00:00.000Z')
    });
    expect(payload.tool).toBe('tracebox');
    expect(payload.redacted).toBe(true);
    expect(payload.exportedAt).toBe('2026-11-13T12:00:00.000Z');
    expect(payload.target).toBe('http://localhost:3000/api');
    expect(payload.redactionCount).toBeGreaterThan(0);
    expect(payload.exchanges[0]?.request.headers.authorization).toBe('[redacted]');
    expect(payload.note).toContain('masked');
  });
});
