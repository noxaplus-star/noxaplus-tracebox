import { toSummary } from './store.js';
import type { DiffLine, Exchange, ExchangeDiff, HeaderChange, HeaderDiff, HeaderMap, MessageDiff, PayloadDiff } from './types.js';

const MAX_DIFF_LINES = 1600;

function headerText(value: string | string[]): string {
  return Array.isArray(value) ? value.join(', ') : value;
}

export function diffHeaders(before: HeaderMap, after: HeaderMap): HeaderDiff {
  const added: HeaderChange[] = [];
  const removed: HeaderChange[] = [];
  const changed: HeaderChange[] = [];
  const beforeLower = new Map<string, { name: string; value: string }>();
  const afterLower = new Map<string, { name: string; value: string }>();

  for (const [name, value] of Object.entries(before)) beforeLower.set(name.toLowerCase(), { name, value: headerText(value) });
  for (const [name, value] of Object.entries(after)) afterLower.set(name.toLowerCase(), { name, value: headerText(value) });

  for (const [key, entry] of beforeLower) {
    if (!afterLower.has(key)) removed.push({ name: entry.name, before: entry.value });
  }
  for (const [key, entry] of afterLower) {
    const previous = beforeLower.get(key);
    if (previous === undefined) {
      added.push({ name: entry.name, after: entry.value });
    } else if (previous.value !== entry.value) {
      changed.push({ name: entry.name, before: previous.value, after: entry.value });
    }
  }

  const byName = (left: HeaderChange, right: HeaderChange): number => left.name.localeCompare(right.name);
  return { added: added.sort(byName), removed: removed.sort(byName), changed: changed.sort(byName) };
}

function fallbackDiff(before: string[], after: string[]): DiffLine[] {
  const lines: DiffLine[] = [];
  const length = Math.max(before.length, after.length);
  for (let index = 0; index < length; index += 1) {
    const left = before[index];
    const right = after[index];
    if (left !== undefined && right !== undefined && left === right) {
      lines.push({ type: 'context', text: left, beforeLine: index + 1, afterLine: index + 1 });
    } else {
      if (left !== undefined) lines.push({ type: 'remove', text: left, beforeLine: index + 1 });
      if (right !== undefined) lines.push({ type: 'add', text: right, afterLine: index + 1 });
    }
  }
  return lines;
}

export function diffLines(beforeText: string, afterText: string): { lines: DiffLine[]; truncated: boolean } {
  const before = beforeText.split('\n');
  const after = afterText.split('\n');

  if (before.length + after.length > MAX_DIFF_LINES) {
    return { lines: fallbackDiff(before, after), truncated: true };
  }

  const width = after.length + 1;
  const matrix = new Uint32Array((before.length + 1) * width);
  for (let left = before.length - 1; left >= 0; left -= 1) {
    for (let right = after.length - 1; right >= 0; right -= 1) {
      matrix[left * width + right] =
        before[left] === after[right]
          ? (matrix[(left + 1) * width + right + 1] ?? 0) + 1
          : Math.max(matrix[(left + 1) * width + right] ?? 0, matrix[left * width + right + 1] ?? 0);
    }
  }

  const lines: DiffLine[] = [];
  let left = 0;
  let right = 0;
  while (left < before.length && right < after.length) {
    if (before[left] === after[right]) {
      lines.push({ type: 'context', text: before[left] ?? '', beforeLine: left + 1, afterLine: right + 1 });
      left += 1;
      right += 1;
    } else if ((matrix[(left + 1) * width + right] ?? 0) >= (matrix[left * width + right + 1] ?? 0)) {
      lines.push({ type: 'remove', text: before[left] ?? '', beforeLine: left + 1 });
      left += 1;
    } else {
      lines.push({ type: 'add', text: after[right] ?? '', afterLine: right + 1 });
      right += 1;
    }
  }
  while (left < before.length) {
    lines.push({ type: 'remove', text: before[left] ?? '', beforeLine: left + 1 });
    left += 1;
  }
  while (right < after.length) {
    lines.push({ type: 'add', text: after[right] ?? '', afterLine: right + 1 });
    right += 1;
  }

  return { lines, truncated: false };
}

function diffPayload(before: string, after: string): PayloadDiff {
  const { lines, truncated } = diffLines(before, after);
  return {
    beforeBytes: Buffer.byteLength(before),
    afterBytes: Buffer.byteLength(after),
    changed: before !== after,
    lines,
    truncated
  };
}

function diffMessage(beforeHeaders: HeaderMap, afterHeaders: HeaderMap, beforeBody: string, afterBody: string): MessageDiff {
  return {
    headers: diffHeaders(beforeHeaders, afterHeaders),
    body: diffPayload(beforeBody, afterBody)
  };
}

function headersChanged(diff: HeaderDiff): boolean {
  return diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;
}

export function diffExchanges(before: Exchange, after: Exchange): ExchangeDiff {
  const request = diffMessage(before.request.headers, after.request.headers, before.request.body, after.request.body);
  const response = diffMessage(before.response.headers, after.response.headers, before.response.body, after.response.body);
  const status = {
    before: before.response.status,
    after: after.response.status,
    changed: before.response.status !== after.response.status
  };
  return {
    before: toSummary(before),
    after: toSummary(after),
    status,
    durationMs: {
      before: before.durationMs,
      after: after.durationMs,
      delta: after.durationMs - before.durationMs
    },
    request,
    response,
    changed:
      status.changed ||
      headersChanged(request.headers) ||
      headersChanged(response.headers) ||
      request.body.changed ||
      response.body.changed
  };
}
