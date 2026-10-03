/** Loopback sample-data server for browser qualification. Never a deployment backend. */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = resolve(process.argv[2] || join(root, 'artifacts/development-world/development-preview'));
const port = Number(process.env.WORLD_FIXTURE_PORT || 43947), clients = new Set(); let scenario = 'ready', posts = 0;
const session = { version: 1, namespace: 'fixture-new-development', workspace: 'fixture-workspace', scopeKey: 'fixture-browser-scope', csrfToken: 'fixture-csrf', voiceAvailable: false };
const snapshot = { version: 1, scope: 'o-development-v1', namespace: session.namespace, workspace: session.workspace, originalStateAdopted: false,
  revision: 1, admission: 'open', executionMode: 'tools-disabled-text-qualification', enabled: true, lastHeartbeat: Date.now(),
  workers: [{ id: 'fixture-developer', role: 'developer', ready: true, observedAt: Date.now() }, { id: 'fixture-reviewer', role: 'reviewer', ready: true, observedAt: Date.now() }], tasks: [] };
const send = () => { for (const res of clients) res.write(`event: state\nid: ${snapshot.revision}\ndata: ${JSON.stringify(snapshot)}\n\n`); };
const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1').pathname;
  if (path.startsWith('/world')) {
    const file = path === '/world' || path === '/world/' ? 'index.html' : path.slice(7);
    if (!['index.html', 'assets/app.js', 'assets/app.css', 'avatar-audio-capture.js'].includes(file)) return json(res, 404, {});
    let bytes = readFileSync(join(assetRoot, file));
    if (file === 'index.html') bytes = Buffer.from(bytes.toString().replace('</body>', '<div style="position:fixed;bottom:8px;left:12px;z-index:20;font:9px system-ui;color:#b7c7b7;pointer-events:none">Sample data · local fixture</div></body>'));
    res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)], 'Cache-Control': 'no-store' }); return res.end(bytes);
  }
  if (path === '/fixture/scenario' && req.method === 'POST') {
    let text = ''; for await (const chunk of req) text += chunk;
    scenario = JSON.parse(text).scenario; snapshot.lastHeartbeat = Date.now();
    if (scenario === 'heartbeat') snapshot.workers[0].ready = false;
    if (scenario === 'expired') { for (const client of clients) client.end(); clients.clear(); }
    else send(); return json(res, 200, { posts, scenario });
  }
  if (path === '/fixture/count') return json(res, 200, { posts });
  if (scenario === 'expired') return json(res, 401, { error: 'fixture_session_expired' });
  if (path === '/api/avatar/session') return json(res, 200, session);
  if (path === '/api/development/status') return json(res, 200, snapshot);
  if (path === '/api/development/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' }); clients.add(res); send();
    const timer = setInterval(() => res.write(': fixture heartbeat\n\n'), 10000); req.on('close', () => { clients.delete(res); clearInterval(timer); }); return;
  }
  if (path === '/api/development/tasks' && req.method === 'POST') {
    if (req.headers['x-o-csrf'] !== session.csrfToken) return json(res, 403, {});
    let text = ''; for await (const chunk of req) text += chunk; const body = JSON.parse(text); posts++;
    const previous = snapshot.tasks.find(t => t.client_key === body.clientRequestId);
    if (previous) return json(res, previous.goal === body.goal ? 200 : 409, { id: previous.id, duplicate: true });
    const id = randomUUID(), runId = randomUUID();
    snapshot.tasks.unshift({ id, client_key: body.clientRequestId, goal: body.goal, state: 'accepted', created_at: Date.now(), runs: [
      { id: runId, role: 'developer', worker_id: 'fixture-developer', state: 'succeeded', code: null, entered_at: Date.now(), observed_at: Date.now(),
        output: 'Fixture output only. No model, files or commands were executed.', evidenceSha256: 'a'.repeat(64), httpPostEntered: true, attempt: 1 }] });
    snapshot.revision++; send();
    if (scenario === 'unknown') { res.writeHead(201, { 'Content-Type': 'application/json' }); res.end('{'); return; }
    return json(res, 201, { id, duplicate: false });
  }
  return json(res, 404, { error: 'fixture_route_only' });
}).listen(port, '127.0.0.1', () => console.log(`Sample-data world: http://127.0.0.1:${port}/world`));
