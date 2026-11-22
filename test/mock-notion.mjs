// A small stand-in for the parts of the Notion API (version 2026-03-11) that
// the domain index uses: retrieve a data source, query a data source, and
// GET /users/me. For tests and offline demos only.
//
//   node test/mock-notion.mjs [--port 8787]      prints the base URL to use as DOMAIN_NOTION_API_BASE
//
// Test helpers (not part of Notion's API):
//   POST /__edit   {"db":"glossary","title":"Refund","set":{"Status":"Agreed"}}  edit or add a row
//   POST /__delay  {"ms":5000}                                                  slow every response
//   GET  /__log                                                                 requests seen so far

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DATA_SOURCE_IDS, ROWS, SCHEMAS } from './fixtures/online-orders.mjs';

export const MOCK_TOKEN = 'mock-token';
const COLORS = ['blue', 'green', 'purple', 'orange', 'pink', 'brown', 'red', 'yellow', 'gray'];
// Real property IDs are short, URL-encoded strings such as "%3AuK%5B".
const encodeId = (i, name) => encodeURIComponent(`${i}:${name.slice(0, 3)}[`);

function buildSchema(db) {
  const def = SCHEMAS[db];
  const properties = {};
  for (const [i, [name, type, extra]] of def.properties.entries()) {
    const p = { id: type === 'title' ? 'title' : encodeId(i, name), name, type, description: null };
    if (type === 'select' || type === 'multi_select' || type === 'status') {
      p[type] = { options: extra.map((o, i) => ({ id: `${i}`, name: o, color: COLORS[i % COLORS.length] })) };
    } else if (type === 'unique_id') p.unique_id = { prefix: extra };
    else p[type] = {};
    properties[name] = p;
  }
  return { object: 'data_source', id: DATA_SOURCE_IDS[db], title: [{ type: 'text', plain_text: def.title }], properties };
}

function value(type, v, extra, uid) {
  const text = (s) => [{ type: 'text', plain_text: s, text: { content: s } }];
  switch (type) {
    case 'title':
      return { title: text(v || '') };
    case 'rich_text':
      return { rich_text: v ? text(v) : [] };
    case 'select':
      return { select: v ? { name: v } : null };
    case 'status':
      return { status: v ? { name: v } : null };
    case 'multi_select':
      return { multi_select: (v || []).map((name) => ({ name })) };
    case 'unique_id':
      return { unique_id: { prefix: extra, number: uid } };
    default:
      return { [type]: null };
  }
}

export function createMock({ token = MOCK_TOKEN } = {}) {
  const state = { delayMs: 0, log: [], pages: {}, schemas: {}, counters: {} };
  let clock = Date.parse('2026-11-20T09:00:00.000Z');
  const tick = () => {
    clock += 60000;
    return new Date(clock).toISOString();
  };
  const addRow = (db, fields) => {
    state.counters[db] = (state.counters[db] || 0) + 1;
    const page = { object: 'page', id: randomUUID(), uid: state.counters[db], fields: { ...fields }, last_edited_time: tick(), in_trash: false };
    state.pages[db].push(page);
    return page;
  };
  for (const db of Object.keys(SCHEMAS)) {
    state.schemas[db] = buildSchema(db);
    state.pages[db] = [];
    for (const row of ROWS[db]) addRow(db, row);
  }
  // The full index runs "now"; rows were last edited before it.
  clock = Date.now() - 10 * 60000;

  const toPage = (db, page, only) => {
    const properties = {};
    for (const [name, type, extra] of SCHEMAS[db].properties) {
      const p = state.schemas[db].properties[name];
      if (only && !only.has(p.id)) continue;
      properties[name] = { id: p.id, type, ...value(type, page.fields[name], extra, page.uid) };
    }
    return { object: 'page', id: page.id, last_edited_time: page.last_edited_time, in_trash: false, properties };
  };

  const matches = (db, page, filter) => {
    if (!filter) return true;
    if (filter.or) return filter.or.some((f) => matches(db, page, f));
    if (filter.and) return filter.and.every((f) => matches(db, page, f));
    if (filter.timestamp === 'last_edited_time') {
      return Date.parse(page.last_edited_time) >= Date.parse(filter.last_edited_time.on_or_after);
    }
    const v = page.fields[filter.property];
    if (filter.status) return v === filter.status.equals;
    if (filter.select) return v === filter.select.equals;
    if (filter.multi_select) return (v || []).includes(filter.multi_select.contains);
    throw new Error(`mock can't filter ${JSON.stringify(filter)}`);
  };

  const dbFor = (id) => Object.keys(DATA_SOURCE_IDS).find((db) => DATA_SOURCE_IDS[db].replace(/-/g, '') === id.replace(/-/g, ''));

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
    });
    req.on('end', () => {
      const url = new URL(req.url, 'http://mock');
      const json = body ? JSON.parse(body) : null;
      const send = (status, obj) =>
        setTimeout(() => {
          if (res.destroyed) return;
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(obj));
        }, state.delayMs);
      if (url.pathname === '/__edit') {
        const db = json.db;
        let page = state.pages[db].find((p) => Object.values(p.fields)[0] === json.title);
        if (!page) page = addRow(db, { [SCHEMAS[db].properties[0][0]]: json.title });
        Object.assign(page.fields, json.set || {});
        page.last_edited_time = new Date().toISOString();
        return send(200, { ok: true });
      }
      if (url.pathname === '/__delay') {
        state.delayMs = json.ms;
        return send(200, { ok: true });
      }
      if (url.pathname === '/__log') return send(200, state.log);
      state.log.push({ method: req.method, path: url.pathname, query: url.search, body: json, version: req.headers['notion-version'] });
      if (req.headers.authorization !== `Bearer ${token}`) {
        return send(401, { object: 'error', status: 401, code: 'unauthorized', message: 'API token is invalid.' });
      }
      if (req.method === 'GET' && url.pathname === '/v1/users/me') {
        return send(200, { object: 'user', id: randomUUID(), type: 'bot', name: 'Domain index (mock)' });
      }
      const m = url.pathname.match(/^\/v1\/data_sources\/([^/]+)(\/query)?$/);
      const db = m && dbFor(m[1]);
      if (!db) return send(404, { object: 'error', status: 404, code: 'object_not_found', message: 'Could not find data source.' });
      if (req.method === 'GET' && !m[2]) return send(200, state.schemas[db]);
      if (req.method === 'POST' && m[2]) {
        const only = url.searchParams.getAll('filter_properties');
        const all = state.pages[db].filter((p) => matches(db, p, json?.filter));
        const size = Math.min(json?.page_size || 100, Number(process.env.MOCK_PAGE_SIZE) || 100);
        const start = Number(json?.start_cursor || 0);
        const slice = all.slice(start, start + size);
        const more = start + size < all.length;
        return send(200, {
          object: 'list',
          results: slice.map((p) => toPage(db, p, only.length ? new Set(only.map(decodeURIComponent).map(encodeURIComponent)) : null)),
          has_more: more,
          next_cursor: more ? String(start + size) : null,
        });
      }
      return send(400, { object: 'error', status: 400, code: 'invalid_request', message: 'Unsupported.' });
    });
  });

  return {
    server,
    state,
    listen(port = 0) {
      return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}/v1`)));
    },
    close() {
      return new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      });
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--port');
  const mock = createMock();
  mock.listen(i > 0 ? Number(process.argv[i + 1]) : 8787).then((base) => {
    process.stdout.write(`Mock Notion API at ${base} (token "${MOCK_TOKEN}")\n`);
  });
}
