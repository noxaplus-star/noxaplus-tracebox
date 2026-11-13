import { describe, expect, it } from 'vitest';
import { TraceStore, toSummary } from '../src/store.js';
import type { StoreEvent } from '../src/types.js';

function input(path: string, method = 'GET', status = 200) {
  return {
    startedAt: '2026-11-13T10:00:00.000Z',
    durationMs: 10,
    request: {
      method,
      path,
      headers: {},
      body: '',
      bodyBytes: 0,
      bodyTruncated: false
    },
    response: {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {},
      body: '{"ok":true}',
      bodyBytes: 11,
      bodyTruncated: false
    }
  };
}

describe('TraceStore', () => {
  it('assigns increasing sequences and unique ids', () => {
    const store = new TraceStore({ limit: 10, captureLimit: 1024 });
    const first = store.add(input('/one'));
    const second = store.add(input('/two'));
    expect(first.sequence).toBe(1);
    expect(second.sequence).toBe(2);
    expect(first.id).not.toBe(second.id);
    expect(store.stats().captured).toBe(2);
  });

  it('evicts the oldest exchange when the buffer is full', () => {
    const store = new TraceStore({ limit: 2, captureLimit: 1024 });
    store.add(input('/one'));
    store.add(input('/two'));
    store.add(input('/three'));
    expect(store.list().map(item => item.path)).toEqual(['/three', '/two']);
    expect(store.stats()).toMatchObject({ retained: 2, captured: 3, evicted: 1 });
  });

  it('keeps the byte count for retained exchanges only', () => {
    const store = new TraceStore({ limit: 1, captureLimit: 1024 });
    store.add(input('/one'));
    store.add(input('/two'));
    expect(store.stats().bytes).toBe(11);
  });

  it('returns newest first and filters by method, status, and search', () => {
    const store = new TraceStore({ limit: 10, captureLimit: 1024 });
    store.add(input('/users', 'GET', 200));
    store.add(input('/orders', 'POST', 201));
    store.add(input('/missing', 'GET', 404));
    store.add(input('/boom', 'GET', 500));

    expect(store.list().map(item => item.path)).toEqual(['/boom', '/missing', '/orders', '/users']);
    expect(store.list({ method: 'post' }).map(item => item.path)).toEqual(['/orders']);
    expect(store.list({ status: '4xx' }).map(item => item.path)).toEqual(['/missing']);
    expect(store.list({ status: 'error' }).map(item => item.path)).toEqual(['/boom']);
    expect(store.list({ search: 'user' }).map(item => item.path)).toEqual(['/users']);
    expect(store.list({ limit: 2 })).toHaveLength(2);
  });

  it('looks up an exchange by id and summarizes errors', () => {
    const store = new TraceStore({ limit: 10, captureLimit: 1024 });
    const exchange = store.add(input('/boom', 'GET', 500));
    expect(store.get(exchange.id)?.request.path).toBe('/boom');
    expect(store.get('missing')).toBeUndefined();
    const summary = toSummary(exchange);
    expect(summary.status).toBe(500);
    expect(store.stats().errors).toBe(1);
  });

  it('emits events for adds and clears', () => {
    const store = new TraceStore({ limit: 10, captureLimit: 1024 });
    const events: StoreEvent[] = [];
    const unsubscribe = store.subscribe(event => events.push(event));
    store.add(input('/one'));
    store.clear();
    unsubscribe();
    store.add(input('/two'));

    expect(events).toHaveLength(2);
    expect(events[0]?.type).toBe('exchange');
    expect(events[1]?.type).toBe('cleared');
    expect(store.stats().captured).toBe(2);
    expect(store.stats().retained).toBe(1);
  });

  it('rejects an invalid limit', () => {
    expect(() => new TraceStore({ limit: 0, captureLimit: 1024 })).toThrow();
  });
});
