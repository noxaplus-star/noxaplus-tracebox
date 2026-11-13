import { describe, expect, it } from 'vitest';
import { diffExchanges, diffHeaders, diffLines } from '../src/diff.js';
import { makeExchange } from './helpers.js';

describe('diffHeaders', () => {
  it('reports added, removed, and changed headers', () => {
    const diff = diffHeaders(
      { 'content-type': 'application/json', 'x-cache': 'hit', 'x-old': 'yes' },
      { 'content-type': 'text/plain', 'x-cache': 'hit', 'x-new': 'yes' }
    );
    expect(diff.changed).toEqual([{ name: 'content-type', before: 'application/json', after: 'text/plain' }]);
    expect(diff.removed).toEqual([{ name: 'x-old', before: 'yes' }]);
    expect(diff.added).toEqual([{ name: 'x-new', after: 'yes' }]);
  });

  it('compares header names case-insensitively and joins array values', () => {
    const diff = diffHeaders({ 'Set-Cookie': ['a=1', 'b=2'] }, { 'set-cookie': 'a=1, b=2' });
    expect(diff.changed).toHaveLength(0);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });
});

describe('diffLines', () => {
  it('marks identical lines as context', () => {
    const diff = diffLines('a\nb', 'a\nb');
    expect(diff.lines.every(line => line.type === 'context')).toBe(true);
    expect(diff.truncated).toBe(false);
  });

  it('reports a changed line as remove plus add', () => {
    const diff = diffLines('a\nold\nc', 'a\nnew\nc');
    expect(diff.lines.map(line => line.type)).toEqual(['context', 'remove', 'add', 'context']);
    expect(diff.lines[1]?.text).toBe('old');
    expect(diff.lines[2]?.text).toBe('new');
  });

  it('falls back to index pairing for very large payloads', () => {
    const before = Array.from({ length: 900 }, (_, index) => `line ${index}`).join('\n');
    const after = Array.from({ length: 900 }, (_, index) => `other ${index}`).join('\n');
    const diff = diffLines(before, after);
    expect(diff.truncated).toBe(true);
    expect(diff.lines).toHaveLength(1800);
  });
});

describe('diffExchanges', () => {
  it('summarizes status and body changes', () => {
    const before = makeExchange({ status: 200, responseBody: '{"state":"pending"}' });
    const after = makeExchange({ status: 500, responseBody: '{"state":"failed"}', durationMs: 80 });
    const diff = diffExchanges(before, after);
    expect(diff.status).toEqual({ before: 200, after: 500, changed: true });
    expect(diff.durationMs.delta).toBe(68);
    expect(diff.response.body.changed).toBe(true);
    expect(diff.changed).toBe(true);
  });

  it('reports no change for identical exchanges', () => {
    const exchange = makeExchange();
    const diff = diffExchanges(exchange, exchange);
    expect(diff.changed).toBe(false);
    expect(diff.response.body.lines.every(line => line.type === 'context')).toBe(true);
  });
});
