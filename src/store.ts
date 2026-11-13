import { randomUUID } from 'node:crypto';
import type {
  Exchange,
  ExchangeInput,
  ExchangeListFilter,
  ExchangeSummary,
  StoreEvent,
  StoreListener,
  StoreStats,
  TraceStoreOptions
} from './types.js';

function byteSize(exchange: Exchange): number {
  return exchange.request.bodyBytes + exchange.response.bodyBytes;
}

export function toSummary(exchange: Exchange): ExchangeSummary {
  const summary: ExchangeSummary = {
    id: exchange.id,
    sequence: exchange.sequence,
    startedAt: exchange.startedAt,
    durationMs: exchange.durationMs,
    method: exchange.request.method,
    path: exchange.request.path,
    status: exchange.response.status,
    requestBytes: exchange.request.bodyBytes,
    responseBytes: exchange.response.bodyBytes
  };
  if (exchange.replayedFrom !== undefined) summary.replayedFrom = exchange.replayedFrom;
  if (exchange.response.error !== undefined) summary.error = exchange.response.error;
  return summary;
}

export class TraceStore {
  private readonly entries: Exchange[] = [];
  private readonly listeners = new Set<StoreListener>();
  private nextSequence = 1;
  private captured = 0;
  private evicted = 0;
  private errors = 0;
  private bytes = 0;

  constructor(private readonly options: TraceStoreOptions) {
    if (!Number.isInteger(options.limit) || options.limit < 1) {
      throw new Error('Store limit must be a positive integer.');
    }
  }

  get limit(): number {
    return this.options.limit;
  }

  get captureLimit(): number {
    return this.options.captureLimit;
  }

  add(input: ExchangeInput): Exchange {
    const exchange: Exchange = {
      id: randomUUID(),
      sequence: this.nextSequence,
      startedAt: input.startedAt,
      durationMs: input.durationMs,
      request: input.request,
      response: input.response
    };
    if (input.replayedFrom !== undefined) exchange.replayedFrom = input.replayedFrom;

    this.nextSequence += 1;
    this.captured += 1;
    if (responseIsError(exchange)) this.errors += 1;
    this.bytes += byteSize(exchange);
    this.entries.push(exchange);

    while (this.entries.length > this.options.limit) {
      const removed = this.entries.shift();
      if (removed !== undefined) {
        this.evicted += 1;
        this.bytes -= byteSize(removed);
      }
    }

    this.emit({ type: 'exchange', exchange: toSummary(exchange) });
    return exchange;
  }

  get(id: string): Exchange | undefined {
    return this.entries.find(entry => entry.id === id);
  }

  getAt(index: number): Exchange | undefined {
    return this.entries[index];
  }

  list(filter: ExchangeListFilter = {}): ExchangeSummary[] {
    const search = filter.search?.trim().toLowerCase();
    const matches: ExchangeSummary[] = [];
    for (let index = this.entries.length - 1; index >= 0; index -= 1) {
      const exchange = this.entries[index];
      if (exchange === undefined) continue;
      if (filter.method !== undefined && exchange.request.method.toUpperCase() !== filter.method.toUpperCase()) continue;
      if (filter.status !== undefined && !statusMatches(exchange, filter.status)) continue;
      if (search !== undefined && search.length > 0) {
        const haystack = `${exchange.request.method} ${exchange.request.path}`.toLowerCase();
        if (!haystack.includes(search)) continue;
      }
      matches.push(toSummary(exchange));
      if (filter.limit !== undefined && matches.length >= filter.limit) break;
    }
    return matches;
  }

  all(): Exchange[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries.length = 0;
    this.bytes = 0;
    this.emit({ type: 'cleared' });
  }

  stats(): StoreStats {
    return {
      retained: this.entries.length,
      captured: this.captured,
      evicted: this.evicted,
      errors: this.errors,
      bytes: this.bytes
    };
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: StoreEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

function responseIsError(exchange: Exchange): boolean {
  return exchange.response.error !== undefined || exchange.response.status >= 500;
}

function statusMatches(exchange: Exchange, filter: NonNullable<ExchangeListFilter['status']>): boolean {
  if (filter === 'error') return responseIsError(exchange);
  const status = exchange.response.status;
  switch (filter) {
    case '2xx':
      return status >= 200 && status < 300;
    case '3xx':
      return status >= 300 && status < 400;
    case '4xx':
      return status >= 400 && status < 500;
    case '5xx':
      return status >= 500 && status < 600;
    default:
      return false;
  }
}
