#!/usr/bin/env node
// A tiny upstream API for trying TraceBox. No dependencies.
//   node examples/demo-server.mjs
//   tracebox start --target http://127.0.0.1:3100

import http from 'node:http';

const PORT = Number(process.env.PORT ?? 3100);

const routes = {
  'GET /hello': () => ({ status: 200, body: { message: 'hello from the demo api', at: new Date().toISOString() } }),
  'GET /api/users/42': () => ({
    status: 200,
    body: { id: 42, name: 'Ada Lovelace', plan: 'pro', seats: 3 }
  }),
  'GET /api/users/99': () => ({ status: 404, body: { error: 'user not found' } }),
  'GET /api/slow': () => ({ status: 200, body: { message: 'that took a while' }, delay: 650 }),
  'GET /api/fail': () => ({ status: 500, body: { error: 'upstream exploded', code: 'E_BOOM' } })
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`);
  const key = `${request.method ?? 'GET'} ${url.pathname}`;

  const chunks = [];
  request.on('data', chunk => chunks.push(chunk));
  request.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    let result;

    if (request.method === 'POST' && url.pathname === '/api/checkout') {
      let payload = {};
      try {
        payload = JSON.parse(raw === '' ? '{}' : raw);
      } catch {
        result = { status: 400, body: { error: 'invalid json' } };
      }
      if (result === undefined) {
        const tier = payload.tier === 'pro' ? 'pro' : 'standard';
        const total = tier === 'pro' ? 39 : 42;
        result = { status: 200, body: { orderId: `ord_${Date.now()}`, tier, total, currency: 'USD' } };
      }
    } else if (request.method === 'POST' && url.pathname === '/echo') {
      result = {
        status: 200,
        body: { method: request.method, headers: request.headers, body: raw }
      };
    } else {
      const route = routes[key];
      result = route === undefined ? { status: 404, body: { error: `no route for ${key}` } } : route();
    }

    const send = () => {
      const body = `${JSON.stringify(result.body, null, 2)}\n`;
      response.writeHead(result.status, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': Buffer.byteLength(body),
        'x-demo-server': 'tracebox'
      });
      response.end(body);
    };

    if (typeof result.delay === 'number') {
      setTimeout(send, result.delay);
    } else {
      send();
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Demo API on http://127.0.0.1:${PORT}`);
  console.log('Try: curl -s http://127.0.0.1:3100/api/users/42');
});
