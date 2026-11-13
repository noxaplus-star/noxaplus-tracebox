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
  .mark {
    width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; color: #041018;
    background: linear-gradient(145deg, #9ae8ff, var(--accent) 55%, #4ea8ff);
    box-shadow: 0 0 34px rgba(91, 214, 255, 0.3);
  }
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
      <div class="mark" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 17l5-5 3 3 7-8"></path><circle cx="3" cy="17" r="1.6" fill="currentColor" stroke="none"></circle>
          <circle cx="18" cy="7" r="1.6" fill="currentColor" stroke="none"></circle>
        </svg>
      </div>
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
