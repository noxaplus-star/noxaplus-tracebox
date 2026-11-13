import type { TraceStore } from './store.js';

export type HeaderMap = Record<string, string | string[]>;

export interface CapturedRequest {
  method: string;
  path: string;
  headers: HeaderMap;
  body: string;
  bodyBytes: number;
  bodyTruncated: boolean;
}

export interface CapturedResponse {
  status: number;
  statusText: string;
  headers: HeaderMap;
  body: string;
  bodyBytes: number;
  bodyTruncated: boolean;
  error?: string;
}

export interface Exchange {
  id: string;
  sequence: number;
  startedAt: string;
  durationMs: number;
  request: CapturedRequest;
  response: CapturedResponse;
  replayedFrom?: string;
}

export interface ExchangeSummary {
  id: string;
  sequence: number;
  startedAt: string;
  durationMs: number;
  method: string;
  path: string;
  status: number;
  requestBytes: number;
  responseBytes: number;
  replayedFrom?: string;
  error?: string;
}

export interface StoreStats {
  retained: number;
  captured: number;
  evicted: number;
  errors: number;
  bytes: number;
}

export type StoreEvent =
  | { type: 'exchange'; exchange: ExchangeSummary }
  | { type: 'cleared' }
  | { type: 'removed'; id: string };

export type StoreListener = (event: StoreEvent) => void;

export interface TraceStoreOptions {
  limit: number;
  captureLimit: number;
}

export interface ExchangeInput {
  startedAt: string;
  durationMs: number;
  request: CapturedRequest;
  response: CapturedResponse;
  replayedFrom?: string;
}

export interface ProxyOptions {
  target: URL;
  store: TraceStore;
  captureLimit: number;
  requestLimit: number;
  timeoutMs: number;
}

export interface CaptureOptions {
  target: URL;
  captureLimit: number;
  requestLimit: number;
  timeoutMs: number;
}

export interface UiServerOptions {
  store: TraceStore;
  target: URL;
  version: string;
  host: string;
  port: number;
  captureLimit: number;
  timeoutMs: number;
  quiet?: boolean;
}

export interface ReplayOptions {
  target: URL;
  captureLimit: number;
  requestLimit: number;
  timeoutMs: number;
}

export interface ExchangeListFilter {
  method?: string;
  status?: '2xx' | '3xx' | '4xx' | '5xx' | 'error';
  search?: string;
  limit?: number;
}

export interface HeaderChange {
  name: string;
  before?: string;
  after?: string;
}

export interface HeaderDiff {
  added: HeaderChange[];
  removed: HeaderChange[];
  changed: HeaderChange[];
}

export type DiffLineType = 'context' | 'add' | 'remove';

export interface DiffLine {
  type: DiffLineType;
  text: string;
  beforeLine?: number;
  afterLine?: number;
}

export interface PayloadDiff {
  beforeBytes: number;
  afterBytes: number;
  changed: boolean;
  lines: DiffLine[];
  truncated: boolean;
}

export interface MessageDiff {
  headers: HeaderDiff;
  body: PayloadDiff;
}

export interface ExchangeDiff {
  before: ExchangeSummary;
  after: ExchangeSummary;
  status: { before: number; after: number; changed: boolean };
  durationMs: { before: number; after: number; delta: number };
  request: MessageDiff;
  response: MessageDiff;
  changed: boolean;
}

export interface ExportOptions {
  version: string;
  target: URL;
  redactPatterns: string[];
  now?: Date;
}

export interface TraceExport {
  tool: string;
  name: string;
  version: string;
  exportedAt: string;
  target: string;
  redacted: true;
  redactionCount: number;
  note: string;
  stats: StoreStats;
  exchanges: Exchange[];
}

export interface CliOptions {
  command: 'start' | 'export' | 'help' | 'version';
  target: string | undefined;
  port: number;
  ui: number;
  host: string;
  limit: number;
  requestLimit: number;
  captureLimit: number;
  timeoutMs: number;
  save: string | undefined;
  url: string;
  out: string | undefined;
  redactPatterns: string[];
  quiet: boolean;
}
