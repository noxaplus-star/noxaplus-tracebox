const emblemLight = 'data:image/png;base64,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';
const faviconTile = 'data:image/png;base64,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';

export function renderDashboard(version: string, target: string): string {
  const safeTarget = target.replace(/[&<>"']/g, character => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NoxaPlus TraceBox</title>
<link rel="icon" type="image/png" href="${faviconTile}">
<style>
  :root {
    --bg: #070b11; --bg-2: #0a1018; --panel: #0d141d; --panel-2: #0b1119;
    --line: #1b2836; --line-soft: #16212d; --text: #e3edf8; --muted: #8397ae;
    --faint: #566a82; --accent: #5bd6ff; --accent-2: #a78bfa;
    --good: #6ee7a8; --warn: #fbbf24; --bad: #fb7185; --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    --sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --radius: 14px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    background:
      radial-gradient(900px 500px at 80% -8%, rgba(91, 214, 255, 0.09), transparent 65%),
      radial-gradient(700px 420px at 2% 12%, rgba(167, 139, 250, 0.07), transparent 60%),
      var(--bg);
    color: var(--text); font-family: var(--sans); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none; opacity: 0.35;
    background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 34px 34px; mask-image: linear-gradient(180deg, #000, transparent 70%);
  }
  button, input, select { font: inherit; }
  button { cursor: pointer; }
  .shell { position: relative; max-width: 1440px; margin: 0 auto; padding: 26px 30px 24px; }

  header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
  .brand { display: flex; align-items: center; gap: 13px; }
  .emblem { height: 44px; width: auto; display: block; flex: none; }
  .brand h1 { margin: 0; font-size: 21px; letter-spacing: -0.03em; font-weight: 700; }
  .brand span { display: block; margin-top: 1px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--faint); }
  .header-meta { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .target {
    display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 420px;
    font-family: var(--mono); font-size: 11.5px; color: var(--muted);
    border: 1px solid var(--line); background: rgba(13, 20, 29, 0.8); border-radius: 999px; padding: 8px 13px;
  }
  .target span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--good); box-shadow: 0 0 0 0 rgba(110, 231, 168, 0.5); animation: ping 2s infinite; flex: none; }
  @keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(110, 231, 168, 0.4); } 70% { box-shadow: 0 0 0 7px rgba(110, 231, 168, 0); } 100% { box-shadow: 0 0 0 0 rgba(110, 231, 168, 0); } }
  .version { font-family: var(--mono); font-size: 11px; color: var(--faint); border: 1px solid var(--line); padding: 8px 11px; border-radius: 999px; }

  .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
  .stat {
    position: relative; overflow: hidden; padding: 12px 15px 11px; border: 1px solid var(--line);
    border-radius: 12px; background: linear-gradient(180deg, rgba(16, 24, 34, 0.9), rgba(10, 16, 24, 0.9));
  }
  .stat::after { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--accent); opacity: 0.7; }
  .stat.err::after { background: var(--bad); }
  .stat.lat::after { background: var(--warn); }
  .stat.buf::after { background: var(--accent-2); }
  .stat b { display: block; font-family: var(--mono); font-size: 19px; letter-spacing: -0.04em; font-weight: 600; line-height: 1.1; }
  .stat span { display: block; margin-top: 4px; font-size: 9.5px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--faint); }

  .board { display: grid; grid-template-columns: 372px minmax(0, 1fr); gap: 16px; align-items: stretch; }
  .panel {
    background: linear-gradient(180deg, rgba(14, 21, 31, 0.97), rgba(10, 15, 23, 0.97));
    border: 1px solid var(--line); border-radius: var(--radius); box-shadow: 0 30px 70px -50px #000;
    min-width: 0;
  }
  .list-panel { display: flex; flex-direction: column; height: calc(100vh - 226px); min-height: 520px; overflow: hidden; }
  .detail-panel { height: calc(100vh - 226px); min-height: 520px; overflow: hidden; display: flex; flex-direction: column; }
  .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 15px 11px; border-bottom: 1px solid var(--line-soft); }
  .panel-head h2 { margin: 0; font-size: 11px; letter-spacing: 0.17em; text-transform: uppercase; color: var(--muted); font-weight: 650; }
  .head-right { display: flex; align-items: center; gap: 8px; }
  .live { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 10px; color: var(--good); text-transform: uppercase; letter-spacing: 0.12em; }
  .live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .live.offline { color: var(--faint); }
  .count { font-family: var(--mono); font-size: 11px; color: var(--faint); }

  .toolbar { display: grid; grid-template-columns: minmax(0, 1fr) 94px auto; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--line-soft); }
  .toolbar input, .toolbar select {
    background: var(--panel-2); color: var(--text); border: 1px solid var(--line); border-radius: 8px;
    padding: 7px 9px; font-size: 11.5px; outline: none; min-width: 0;
  }
  .toolbar input:focus, .toolbar select:focus { border-color: #2f5b70; }
  .toolbar input::placeholder { color: var(--faint); }
  .toolbar .icon-btn {
    border: 1px solid var(--line); background: var(--panel-2); color: var(--muted); border-radius: 8px;
    padding: 7px 9px; font-size: 11px; font-weight: 600; white-space: nowrap;
  }
  .toolbar .icon-btn:hover { color: var(--text); border-color: #2c4356; }

  .exchange-list { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #223244 transparent; }
  .row {
    display: grid; grid-template-columns: 58px minmax(0, 1fr) 40px; gap: 9px; align-items: center;
    width: 100%; text-align: left; background: transparent; border: 0; border-bottom: 1px solid var(--line-soft);
    padding: 10px 13px; color: inherit; transition: background .14s ease;
  }
  .row:hover { background: rgba(91, 214, 255, 0.045); }
  .row.active { background: rgba(91, 214, 255, 0.09); box-shadow: inset 2px 0 0 var(--accent); }
  .method {
    font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-align: center;
    padding: 4px 0; border-radius: 5px; border: 1px solid currentColor; opacity: 0.95;
  }
  .m-get { color: var(--accent); } .m-post { color: var(--good); } .m-put { color: var(--warn); }
  .m-patch { color: var(--accent-2); } .m-delete { color: var(--bad); } .m-other { color: var(--muted); }
  .row-main { min-width: 0; }
  .row-path { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--mono); font-size: 11.5px; color: #c9d8e8; }
  .row-meta { display: block; margin-top: 3px; font-family: var(--mono); font-size: 9.5px; color: var(--faint); }
  .row-meta em { font-style: normal; color: var(--accent-2); }
  .code { font-family: var(--mono); font-size: 11px; font-weight: 600; text-align: right; color: var(--good); }
  .code.warn { color: var(--warn); } .code.bad { color: var(--bad); } .code.blue { color: var(--accent); }
  .empty-list { padding: 54px 26px; text-align: center; color: var(--faint); font-size: 12px; line-height: 1.65; }
  .empty-list b { display: block; color: var(--muted); font-size: 13px; margin-bottom: 5px; }

  .empty-detail { flex: 1; display: grid; place-items: center; padding: 40px; text-align: center; }
  .empty-detail .glyph { width: 56px; height: 56px; border-radius: 17px; border: 1px dashed #2a4054; display: grid; place-items: center; margin: 0 auto 13px; color: var(--accent); }
  .empty-detail h3 { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: #b9cadb; }
  .empty-detail p { margin: 0 auto; max-width: 330px; font-size: 12px; color: var(--faint); line-height: 1.65; }
  .empty-detail code { font-family: var(--mono); color: var(--accent); font-size: 11.5px; }

  .detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 13px 16px 11px; border-bottom: 1px solid var(--line-soft); }
  .detail-title { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .detail-title .path { font-family: var(--mono); font-size: 13px; color: #d6e4f2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .detail-title .seq { font-family: var(--mono); font-size: 10px; color: var(--faint); }
  .detail-actions { display: flex; flex-wrap: wrap; gap: 6px; flex: none; }
  .btn {
    border: 1px solid var(--line); background: var(--panel-2); color: var(--muted); border-radius: 8px;
    padding: 6px 10px; font-size: 11px; font-weight: 600; transition: .15s ease;
  }
  .btn:hover:not(:disabled) { color: var(--text); border-color: #2d4559; background: #111a25; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn.primary { background: var(--accent); border-color: var(--accent); color: #041018; }
  .btn.primary:hover { filter: brightness(1.07); color: #041018; }
  .detail-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 9px 16px; border-bottom: 1px solid var(--line-soft); font-family: var(--mono); font-size: 10.5px; color: var(--faint); }
  .detail-meta b { color: var(--muted); font-weight: 600; }
  .pill { border-radius: 999px; padding: 2px 8px; border: 1px solid var(--line); background: #0b1118; }
  .pill.replay { color: var(--accent-2); border-color: #3b2d61; }
  .pill.base { color: var(--warn); border-color: #4a3a18; }

  .tabs { display: flex; gap: 2px; padding: 8px 12px 0; border-bottom: 1px solid var(--line-soft); }
  .tabs button {
    background: transparent; border: 0; border-bottom: 2px solid transparent; color: var(--faint);
    padding: 8px 11px 9px; font-size: 11.5px; font-weight: 600;
  }
  .tabs button.active { color: var(--accent); border-bottom-color: var(--accent); }
  .detail-scroll { flex: 1; overflow-y: auto; padding: 14px 16px 20px; scrollbar-width: thin; scrollbar-color: #223244 transparent; }

  .message-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 10.5px; color: var(--faint); letter-spacing: 0.1em; text-transform: uppercase; }
  .message-head .spacer { flex: 1; }
  .message-head .muted { font-family: var(--mono); letter-spacing: 0; text-transform: none; }
  .mini { border: 1px solid var(--line); background: transparent; color: var(--muted); border-radius: 6px; padding: 2px 7px; font-size: 10px; }
  .mini:hover { color: var(--text); }
  .body {
    margin: 0 0 14px; padding: 12px 13px; border: 1px solid var(--line-soft); border-radius: 10px; background: #080d14;
    font-family: var(--mono); font-size: 11.5px; line-height: 1.62; color: #c7d9e8; white-space: pre-wrap; word-break: break-word;
    max-height: 340px; overflow: auto;
  }
  .body .faint { color: var(--faint); }
  .flag { color: var(--warn); border: 1px solid #4a3a18; border-radius: 999px; padding: 1px 6px; font-size: 9px; margin-left: 5px; }
  .headers { border: 1px solid var(--line-soft); border-radius: 10px; background: #0a1018; overflow: hidden; }
  .headers summary { padding: 9px 12px; cursor: pointer; font-size: 11px; color: var(--muted); user-select: none; }
  .headers summary span { color: var(--faint); font-family: var(--mono); margin-left: 4px; }
  .headers table { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 10.5px; }
  .headers td { padding: 5px 12px; border-top: 1px solid var(--line-soft); vertical-align: top; word-break: break-word; }
  .headers td:first-child { color: var(--faint); width: 34%; white-space: nowrap; }
  .headers td:last-child { color: #a9bccd; }

  .diff-banner { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--line-soft); }
  .diff-banner .verdict { font-size: 12.5px; font-weight: 600; }
  .diff-banner .same { color: var(--muted); }
  .diff-banner .changed { color: var(--warn); }
  .diff-meta { display: flex; flex-wrap: wrap; gap: 14px; padding: 9px 16px; border-bottom: 1px solid var(--line-soft); font-family: var(--mono); font-size: 10.5px; color: var(--faint); }
  .diff-section { margin-bottom: 18px; }
  .diff-section h3 { margin: 0 0 8px; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); font-weight: 650; }
  .diff-pre { margin: 0; border: 1px solid var(--line-soft); border-radius: 10px; background: #080d14; overflow: auto; max-height: 310px; }
  .diff-line { display: flex; font-family: var(--mono); font-size: 11px; line-height: 1.6; min-width: max-content; }
  .diff-line .ln { width: 34px; text-align: right; padding-right: 8px; color: #3c4f64; user-select: none; flex: none; }
  .diff-line .sign { width: 15px; text-align: center; flex: none; }
  .diff-line .txt { padding-right: 14px; white-space: pre; }
  .diff-line.add { background: rgba(110, 231, 168, 0.07); color: #baf3d3; }
  .diff-line.add .sign { color: var(--good); }
  .diff-line.remove { background: rgba(251, 113, 133, 0.07); color: #f7bcc5; }
  .diff-line.remove .sign { color: var(--bad); }
  .diff-line.context { color: #74889e; }
  .diff-note { font-size: 11.5px; color: var(--faint); padding: 8px 0; }
  .header-changes { display: grid; gap: 4px; font-family: var(--mono); font-size: 10.5px; }
  .header-changes div { padding: 4px 9px; border-radius: 6px; background: #080d14; border: 1px solid var(--line-soft); color: #93a7bc; word-break: break-word; }
  .header-changes .plus { color: var(--good); }
  .header-changes .minus { color: var(--bad); }
  .header-changes .tilde { color: var(--warn); }

  .toast {
    position: fixed; right: 22px; bottom: 20px; transform: translateY(14px); opacity: 0; pointer-events: none;
    background: #101a26; border: 1px solid #284257; color: #d5e6f6; padding: 10px 14px; border-radius: 10px;
    font-size: 12px; box-shadow: 0 20px 50px -20px #000; transition: .2s ease; z-index: 20;
  }
  .toast.show { opacity: 1; transform: none; }

  footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 16px; color: var(--faint); font-size: 10.5px; }
  footer a { color: var(--muted); text-decoration: none; }
  footer a:hover { color: var(--accent); }
  footer .privacy { font-family: var(--mono); }

  @media (max-width: 1040px) {
    .board { grid-template-columns: 1fr; }
    .list-panel, .detail-panel { height: auto; min-height: 0; }
    .list-panel { max-height: 440px; }
    .detail-panel { min-height: 520px; }
    .header-meta .target { max-width: 280px; }
  }
  @media (max-width: 720px) {
    .shell { padding: 18px 14px 20px; }
    header { flex-wrap: wrap; }
    .stats { grid-template-columns: 1fr 1fr; }
    .version { display: none; }
    .detail-actions { width: 100%; }
    footer { flex-direction: column; align-items: flex-start; }
  }
</style>
</head>
<body>
<div class="shell">
  <header>
    <div class="brand">
      <img class="emblem" src="${emblemLight}" alt="NoxaPlus"/>
      <div>
        <h1>TraceBox</h1>
        <span>by NoxaPlus</span>
      </div>
    </div>
    <div class="header-meta">
      <div class="target" title="${safeTarget}">
        <span class="pulse"></span>
        <span>${safeTarget}</span>
      </div>
      <span class="version">v${version}</span>
    </div>
  </header>

  <section class="stats" aria-label="Session statistics">
    <div class="stat"><b id="stat-captured">0</b><span>captured</span></div>
    <div class="stat err"><b id="stat-errors">0</b><span>errors</span></div>
    <div class="stat lat"><b id="stat-latency">—</b><span>avg latency</span></div>
    <div class="stat buf"><b id="stat-buffer">0 B</b><span>buffer</span></div>
  </section>

  <main class="board">
    <section class="panel list-panel">
      <div class="panel-head">
        <h2>Traffic</h2>
        <div class="head-right">
          <span class="live offline" id="live">connecting</span>
          <span class="count" id="count">0</span>
        </div>
      </div>
      <div class="toolbar">
        <input id="search" type="search" placeholder="Filter by path or method" autocomplete="off">
        <select id="status" aria-label="Filter by status">
          <option value="">All</option>
          <option value="2xx">2xx</option>
          <option value="4xx">4xx</option>
          <option value="5xx">5xx</option>
          <option value="error">Errors</option>
        </select>
        <button class="icon-btn" id="export" title="Download a redacted JSON export">Export</button>
      </div>
      <div class="exchange-list" id="list">
        <div class="empty-list"><b>Nothing captured yet</b>Point your app at this proxy and make a request.</div>
      </div>
    </section>

    <section class="panel detail-panel" id="detail">
      <div class="empty-detail">
        <div>
          <div class="glyph">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <path d="M4 6h16M4 12h10M4 18h7"></path>
            </svg>
          </div>
          <h3>Pick a request</h3>
          <p>Every exchange is captured with headers, bodies, status, and timing. Select one to inspect it, replay it, or diff it against another.</p>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <span class="privacy">Local only · no cloud · exports mask auth headers and token-shaped values</span>
    <span><a href="https://github.com/noxaplus-star/noxaplus-tracebox">GitHub</a> · MIT · © 2026 NoxaPlus</span>
  </footer>
</div>
<div class="toast" id="toast"></div>
<script>
(function () {
  'use strict';
  var state = { items: [], selectedId: null, detail: null, base: null, tab: 'request', diff: null, search: '', status: '' };
  var reloadTimer = null;
  var toastTimer = null;

  function el(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i = 0; i < keys.length; i += 1) {
      if (keys[i].toLowerCase() === name) {
        var value = headers[keys[i]];
        return Array.isArray(value) ? value.join(', ') : String(value);
      }
    }
    return '';
  }
  function prettyBody(body, headers) {
    if (!body) return '';
    var type = header(headers, 'content-type');
    if (/json/i.test(type) || /^\s*[\[{]/.test(body)) {
      try { return JSON.stringify(JSON.parse(body), null, 2); } catch (error) { return body; }
    }
    return body;
  }
  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  function formatTime(iso) {
    var date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  function methodClass(method) {
    switch (method) {
      case 'GET': return 'm-get';
      case 'POST': return 'm-post';
      case 'PUT': return 'm-put';
      case 'PATCH': return 'm-patch';
      case 'DELETE': return 'm-delete';
      default: return 'm-other';
    }
  }
  function statusClass(code, error) {
    if (error || code >= 500) return 'bad';
    if (code >= 400) return 'warn';
    if (code >= 300) return 'blue';
    return '';
  }
  function statusLabel(item) { return item.error ? 'ERR' : String(item.status); }
  function toast(message) {
    var node = el('toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove('show'); }, 2600);
  }
  function setLive(online) {
    var node = el('live');
    node.textContent = online ? 'live' : 'offline';
    node.classList.toggle('offline', !online);
  }

  function filteredItems() {
    var search = state.search.toLowerCase();
    var status = state.status;
    return state.items.filter(function (item) {
      if (search && (item.method + ' ' + item.path).toLowerCase().indexOf(search) === -1) return false;
      if (!status) return true;
      if (status === 'error') return Boolean(item.error) || item.status >= 500;
      var bucket = Number(status.charAt(0)) * 100;
      return item.status >= bucket && item.status < bucket + 100;
    });
  }

  function renderList() {
    var list = el('list');
    var items = filteredItems();
    el('count').textContent = String(state.items.length) + (items.length !== state.items.length ? ' / ' + items.length : '');
    if (items.length === 0) {
      list.innerHTML = '<div class="empty-list"><b>' + (state.items.length === 0 ? 'Nothing captured yet' : 'No matches') + '</b>' +
        (state.items.length === 0 ? 'Point your app at this proxy and make a request.' : 'Clear the filter to see the rest of the buffer.') + '</div>';
      return;
    }
    list.innerHTML = items.map(function (item) {
      return '<button type="button" class="row' + (item.id === state.selectedId ? ' active' : '') + '" data-id="' + esc(item.id) + '">' +
        '<span class="method ' + methodClass(item.method) + '">' + esc(item.method) + '</span>' +
        '<span class="row-main"><span class="row-path">' + esc(item.path) + '</span>' +
        '<span class="row-meta">' + formatTime(item.startedAt) + ' · ' + item.durationMs + ' ms · ' + formatBytes(item.responseBytes) +
        (item.replayedFrom ? ' · <em>replay</em>' : '') + '</span></span>' +
        '<span class="code ' + statusClass(item.status, item.error) + '">' + statusLabel(item) + '</span>' +
        '</button>';
    }).join('');
  }

  function renderStats(stats) {
    el('stat-captured').textContent = String(stats.captured);
    el('stat-errors').textContent = String(stats.errors);
    el('stat-buffer').textContent = formatBytes(stats.bytes);
    var total = 0;
    var count = 0;
    state.items.forEach(function (item) { total += item.durationMs; count += 1; });
    el('stat-latency').textContent = count === 0 ? '—' : Math.round(total / count) + ' ms';
  }

  function headersTable(headers) {
    var keys = Object.keys(headers || {}).sort();
    if (keys.length === 0) return '<div class="diff-note">No headers captured.</div>';
    return '<details class="headers"><summary>Headers <span>' + keys.length + '</span></summary><table><tbody>' +
      keys.map(function (name) {
        var value = headers[name];
        return '<tr><td>' + esc(name) + '</td><td>' + esc(Array.isArray(value) ? value.join(', ') : value) + '</td></tr>';
      }).join('') + '</tbody></table></details>';
  }

  function messageHtml(message, which) {
    var headers = message.headers || {};
    var pretty = prettyBody(message.body, headers);
    var truncated = message.bodyTruncated ? '<span class="flag">truncated</span>' : '';
    return '<div class="message-head"><span>' + (which === 'request' ? 'Request' : 'Response') + ' body</span>' +
      '<span class="spacer"></span><span class="muted">' + formatBytes(message.bodyBytes) + truncated + '</span>' +
      '<button type="button" class="mini" data-copy="' + which + '">Copy</button></div>' +
      '<pre class="body">' + (pretty ? esc(pretty) : '<span class="faint">(empty body)</span>') + '</pre>' + headersTable(headers);
  }

  function renderDetail() {
    var detail = state.detail;
    if (!detail) return;
    if (state.diff) { renderDiff(state.diff); return; }
    var panel = el('detail');
    var pinned = state.base && state.base.id === detail.id;
    var baseLabel = state.base ? 'Diff with #' + state.base.sequence : 'Diff with base';
    var actionButtons = '<div class="detail-actions">' +
      '<button type="button" class="btn primary" data-action="replay">Replay</button>' +
      '<button type="button" class="btn" data-action="pin">' + (pinned ? 'Unpin base' : 'Pin as base') + '</button>' +
      '<button type="button" class="btn" data-action="diff"' + (state.base && !pinned ? '' : ' disabled') + '>' + esc(baseLabel) + '</button>' +
      '</div>';
    var pills = (detail.replayedFrom ? '<span class="pill replay">replayed</span>' : '') + (pinned ? '<span class="pill base">base for diff</span>' : '');
    panel.innerHTML = '<div class="detail-head">' +
      '<div class="detail-title"><span class="method ' + methodClass(detail.request.method) + '">' + esc(detail.request.method) + '</span>' +
      '<span class="path">' + esc(detail.request.path) + '</span><span class="seq">#' + detail.sequence + '</span></div>' + actionButtons + '</div>' +
      '<div class="detail-meta"><b>' + detail.response.status + ' ' + esc(detail.response.statusText) + '</b><span>' + detail.durationMs + ' ms</span>' +
      '<span>' + formatTime(detail.startedAt) + '</span><span>req ' + formatBytes(detail.request.bodyBytes) + '</span>' +
      '<span>res ' + formatBytes(detail.response.bodyBytes) + '</span>' + pills + '</div>' +
      '<div class="tabs"><button type="button" data-tab="request" class="' + (state.tab === 'request' ? 'active' : '') + '">Request</button>' +
      '<button type="button" data-tab="response" class="' + (state.tab === 'response' ? 'active' : '') + '">Response</button></div>' +
      '<div class="detail-scroll" id="detail-scroll">' + messageHtml(detail[state.tab], state.tab) + '</div>';
  }

  function renderDiff(diff) {
    var panel = el('detail');
    var verdict = diff.changed
      ? '<span class="verdict changed">Changed between #' + diff.before.sequence + ' and #' + diff.after.sequence + '</span>'
      : '<span class="verdict same">Identical responses</span>';
    var duration = diff.durationMs.delta;
    var durationText = (duration > 0 ? '+' : '') + duration + ' ms';
    panel.innerHTML = '<div class="detail-head"><div class="detail-title">' + verdict + '</div>' +
      '<div class="detail-actions"><button type="button" class="btn" data-action="close-diff">Back to exchange</button></div></div>' +
      '<div class="diff-meta"><span>status ' + diff.status.before + ' → ' + diff.status.after + '</span>' +
      '<span>latency ' + durationText + '</span><span>request ' + (diff.request.body.changed ? 'changed' : 'same') + '</span>' +
      '<span>response ' + (diff.response.body.changed ? 'changed' : 'same') + '</span></div>' +
      '<div class="detail-scroll">' +
      diffSection('Request headers', diff.request.headers) +
      diffSection('Request body', diff.request.body) +
      diffSection('Response headers', diff.response.headers) +
      diffSection('Response body', diff.response.body) +
      '</div>';
  }

  function diffSection(title, part) {
    var html = '<section class="diff-section"><h3>' + esc(title) + '</h3>';
    if (part.lines) {
      if (!part.changed) html += '<div class="diff-note">No changes.</div>';
      else {
        if (part.truncated) html += '<div class="diff-note">Large payload: diff is paired by line index.</div>';
        html += '<pre class="diff-pre">' + part.lines.map(function (line) {
          var marker = line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' ';
          var number = line.type === 'add' ? (line.afterLine || '') : (line.beforeLine || '');
          return '<div class="diff-line ' + line.type + '"><span class="ln">' + number + '</span><span class="sign">' + marker + '</span><span class="txt">' + esc(line.text) + '</span></div>';
        }).join('') + '</pre>';
      }
    } else {
      var rows = [];
      part.added.forEach(function (change) { rows.push('<div><span class="plus">+ ' + esc(change.name) + ': </span>' + esc(change.after) + '</div>'); });
      part.removed.forEach(function (change) { rows.push('<div><span class="minus">− ' + esc(change.name) + ': </span>' + esc(change.before) + '</div>'); });
      part.changed.forEach(function (change) { rows.push('<div><span class="tilde">~ ' + esc(change.name) + ': </span>' + esc(change.before) + ' → ' + esc(change.after) + '</div>'); });
      html += rows.length === 0 ? '<div class="diff-note">No header changes.</div>' : '<div class="header-changes">' + rows.join('') + '</div>';
    }
    return html + '</section>';
  }

  function emptyDetail() {
    el('detail').innerHTML = '<div class="empty-detail"><div><div class="glyph">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h7"></path></svg>' +
      '</div><h3>Pick a request</h3><p>Every exchange is captured with headers, bodies, status, and timing. Select one to inspect it, replay it, or diff it against another.</p></div></div>';
  }

  async function select(id) {
    state.selectedId = id;
    state.tab = 'request';
    state.diff = null;
    Array.prototype.forEach.call(document.querySelectorAll('.row'), function (row) {
      row.classList.toggle('active', row.getAttribute('data-id') === id);
    });
    var response = await fetch('/api/exchanges/' + encodeURIComponent(id));
    if (!response.ok) { toast('That exchange is no longer in the buffer.'); return; }
    state.detail = await response.json();
    renderDetail();
  }

  async function reload() {
    var response = await fetch('/api/exchanges');
    if (!response.ok) return;
    var data = await response.json();
    state.items = data.exchanges;
    renderList();
    renderStats(data.stats);
    if (!state.selectedId && state.items.length > 0) select(state.items[0].id);
  }

  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(function () { reload(); }, 120);
  }

  async function replay() {
    if (!state.detail) return;
    var response = await fetch('/api/exchanges/' + encodeURIComponent(state.detail.id) + '/replay', { method: 'POST' });
    var payload = await response.json().catch(function () { return {}; });
    if (!response.ok) { toast(payload.error ? payload.error.message : 'Replay failed.'); return; }
    var summary = payload.exchange;
    await reload();
    await select(summary.id);
    toast('Replayed as #' + summary.sequence + ' · ' + summary.status + ' · ' + summary.durationMs + ' ms');
  }

  async function showDiff() {
    if (!state.base || !state.detail) return;
    var response = await fetch('/api/diff?before=' + encodeURIComponent(state.base.id) + '&after=' + encodeURIComponent(state.detail.id));
    var payload = await response.json();
    if (!response.ok) { toast(payload.error ? payload.error.message : 'Could not diff these exchanges.'); return; }
    state.diff = payload;
    renderDiff(payload);
  }

  document.getElementById('detail').addEventListener('click', function (event) {
    var action = event.target.closest('[data-action]');
    if (action) {
      var name = action.getAttribute('data-action');
      if (name === 'replay') replay();
      if (name === 'pin') {
        if (!state.detail) return;
        state.base = state.base && state.base.id === state.detail.id ? null : state.detail;
        renderDetail();
        toast(state.base ? 'Base pinned: #' + state.base.sequence : 'Base cleared.');
      }
      if (name === 'diff') showDiff();
      if (name === 'close-diff') { state.diff = null; renderDetail(); }
      return;
    }
    var tab = event.target.closest('[data-tab]');
    if (tab) {
      state.tab = tab.getAttribute('data-tab');
      state.diff = null;
      renderDetail();
      return;
    }
    var copy = event.target.closest('[data-copy]');
    if (copy && state.detail) {
      var which = copy.getAttribute('data-copy');
      var text = state.detail[which].body || '';
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Body copied.'); });
      return;
    }
  });

  document.getElementById('list').addEventListener('click', function (event) {
    var row = event.target.closest('.row');
    if (row) select(row.getAttribute('data-id'));
  });

  el('search').addEventListener('input', function (event) { state.search = event.target.value; renderList(); });
  el('status').addEventListener('change', function (event) { state.status = event.target.value; renderList(); });
  el('export').addEventListener('click', function () {
    window.location.href = '/api/export';
    toast('Export started. Auth headers and token-shaped values are masked.');
  });

  if (window.EventSource) {
    var source = new EventSource('/api/events');
    source.onopen = function () { setLive(true); };
    source.onerror = function () { setLive(false); };
    source.addEventListener('exchange', function () { setLive(true); scheduleReload(); });
    source.addEventListener('cleared', function () {
      state.items = [];
      state.detail = null;
      state.selectedId = null;
      state.base = null;
      state.diff = null;
      renderList();
      renderStats({ captured: 0, errors: 0, bytes: 0 });
      emptyDetail();
    });
  }

  reload();
})();
</script>
</body>
</html>`;
}
