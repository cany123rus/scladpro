import http from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = process.env.WAREHOUSE_OFFLINE_DATA_DIR
  ? path.resolve(process.env.WAREHOUSE_OFFLINE_DATA_DIR)
  : path.join(rootDir, 'warehouse-offline-data');
const dbPath = path.join(dataDir, 'warehouse-offline.json');
const staticDir = process.env.WAREHOUSE_OFFLINE_STATIC_DIR
  ? path.resolve(process.env.WAREHOUSE_OFFLINE_STATIC_DIR)
  : path.join(rootDir, 'dist');
const port = Number(process.env.WAREHOUSE_OFFLINE_PORT || 8787);
const host = process.env.WAREHOUSE_OFFLINE_HOST || '0.0.0.0';
// Optional shared secret. If set, every /api/* request must send a matching
// `x-warehouse-token` header. Leave unset to keep the previous open behaviour.
const authToken = String(process.env.WAREHOUSE_OFFLINE_TOKEN || '').trim();
const HONEST_SIGN_SEEN_CAP = Number(process.env.WAREHOUSE_OFFLINE_HS_CAP || 50000);

const staticMimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const emptyDb = () => ({
  version: 1,
  updatedAt: null,
  snapshot: null,
  fboScans: {
    pending: [],
    synced: [],
    conflicts: [],
  },
});

const ensureDb = async () => {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    await writeJson(dbPath, emptyDb());
  }
};

const readJson = async () => {
  await ensureDb();
  try {
    const raw = await readFile(dbPath, 'utf8');
    return { ...emptyDb(), ...(JSON.parse(raw || '{}') || {}) };
  } catch {
    return emptyDb();
  }
};

const writeJson = async (targetPath, value) => {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const tmpPath = targetPath + '.' + process.pid + '.' + Date.now() + '.tmp';
  await writeFile(tmpPath, JSON.stringify(value, null, 2), 'utf8');
  await rename(tmpPath, targetPath);
};

const saveDb = async (db) => {
  await writeJson(dbPath, db);
};

const send = (res, status, body) => {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-warehouse-token, Access-Control-Request-Private-Network',
    'Access-Control-Allow-Private-Network': 'true',
    'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Request-Private-Network',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : null;
};

const createId = () => 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

const sendStatic = async (res, filePath) => {
  const body = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': staticMimeTypes[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
  });
  res.end(body);
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      send(res, 204);
      return;
    }

    const url = new URL(req.url || '/', 'http://' + (req.headers.host || 'localhost'));

    // Token gate for all API endpoints (no-op when WAREHOUSE_OFFLINE_TOKEN unset).
    if (authToken && url.pathname.startsWith('/api/')) {
      const provided = String(req.headers['x-warehouse-token'] || '').trim();
      if (provided !== authToken) {
        send(res, 401, { error: 'Неверный токен доступа к локальному серверу' });
        return;
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/warehouse-offline/health') {
      const db = await readJson();
      const snapshot = db.snapshot || {};
      send(res, 200, {
        ok: true,
        mode: 'warehouse-offline',
        version: db.version || 1,
        updatedAt: db.updatedAt || null,
        wbProducts: Array.isArray(snapshot.wbProducts) ? snapshot.wbProducts.length : 0,
        fboSupplies: Array.isArray(snapshot.fboSupplies) ? snapshot.fboSupplies.length : 0,
        fboBoxes: Array.isArray(snapshot.fboBoxes) ? snapshot.fboBoxes.length : 0,
        suppliers: Array.isArray(snapshot.suppliers) ? snapshot.suppliers.length : 0,
        pendingScans: db.fboScans?.pending?.length || 0,
        syncedScans: db.fboScans?.synced?.length || 0,
        conflicts: db.fboScans?.conflicts?.length || 0,
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/warehouse-offline/snapshot') {
      const db = await readJson();
      send(res, 200, db.snapshot || null);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/warehouse-offline/snapshot') {
      const incoming = await readBody(req);
      const db = await readJson();
      const baseVersion = incoming && Object.prototype.hasOwnProperty.call(incoming, '__baseVersion')
        ? Number(incoming.__baseVersion)
        : null;
      // Optimistic concurrency: reject stale writes so a tab with an old base
      // cannot clobber a snapshot another tab/device already updated.
      if (baseVersion != null && Number.isFinite(baseVersion) && baseVersion !== (db.version || 1)) {
        send(res, 409, { error: 'Снапшот был обновлён другим клиентом. Обновите offline-базу заново.', version: db.version || 1 });
        return;
      }
      const snapshot = { ...(incoming || {}) };
      delete snapshot.__baseVersion;
      // Cap the honestSignSeen list so the snapshot file cannot grow without bound.
      if (Array.isArray(snapshot.honestSignSeen) && snapshot.honestSignSeen.length > HONEST_SIGN_SEEN_CAP) {
        snapshot.honestSignSeen = snapshot.honestSignSeen.slice(-HONEST_SIGN_SEEN_CAP);
      }
      const updatedAt = new Date().toISOString();
      db.updatedAt = updatedAt;
      db.version = (db.version || 1) + 1;
      db.snapshot = {
        ...snapshot,
        createdAt: snapshot.createdAt || updatedAt,
      };
      await saveDb(db);
      send(res, 200, { ok: true, updatedAt, version: db.version });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/warehouse-offline/fbo-scans') {
      const db = await readJson();
      send(res, 200, {
        pending: db.fboScans?.pending || [],
        synced: db.fboScans?.synced || [],
        conflicts: db.fboScans?.conflicts || [],
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/warehouse-offline/fbo-scans') {
      const scan = await readBody(req);
      const db = await readJson();
      const id = scan?.id || createId();
      const row = {
        ...(scan || {}),
        id,
        status: 'local_pending',
        createdAt: scan?.createdAt || new Date().toISOString(),
      };
      db.fboScans = db.fboScans || { pending: [], synced: [], conflicts: [] };
      db.fboScans.pending = [row, ...(db.fboScans.pending || [])];
      await saveDb(db);
      send(res, 200, { ok: true, id });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/warehouse-offline/fbo-scans/mark-synced') {
      const body = await readBody(req);
      const ids = new Set((Array.isArray(body?.ids) ? body.ids : []).map((id) => String(id || '').trim()).filter(Boolean));
      const db = await readJson();
      db.fboScans = db.fboScans || { pending: [], synced: [], conflicts: [] };
      const pending = db.fboScans.pending || [];
      const moved = [];
      db.fboScans.pending = pending.filter((row) => {
        if (!ids.has(String(row?.id || ''))) return true;
        moved.push({ ...row, status: 'synced', syncedAt: new Date().toISOString() });
        return false;
      });
      db.fboScans.synced = [...moved, ...(db.fboScans.synced || [])].slice(0, 5000);
      await saveDb(db);
      send(res, 200, { ok: true, synced: moved.length });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/warehouse-offline/fbo-scans/move-conflicts') {
      const body = await readBody(req);
      const rows = Array.isArray(body?.rows) ? body.rows : [];
      const errById = new Map(rows.map((r) => [String(r?.id || '').trim(), String(r?.error || 'Конфликт синхронизации')]).filter(([id]) => id));
      const db = await readJson();
      db.fboScans = db.fboScans || { pending: [], synced: [], conflicts: [] };
      const pending = db.fboScans.pending || [];
      const moved = [];
      db.fboScans.pending = pending.filter((row) => {
        const id = String(row?.id || '');
        if (!errById.has(id)) return true;
        moved.push({ ...row, status: 'conflict', error: errById.get(id), conflictedAt: new Date().toISOString() });
        return false;
      });
      db.fboScans.conflicts = [...moved, ...(db.fboScans.conflicts || [])].slice(0, 5000);
      await saveDb(db);
      send(res, 200, { ok: true, moved: moved.length });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/warehouse-offline/fbo-scans/delete-box') {
      const body = await readBody(req);
      const boxId = String(body?.boxId || '').trim();
      if (!boxId) {
        send(res, 400, { error: 'boxId is required' });
        return;
      }

      const db = await readJson();
      db.fboScans = db.fboScans || { pending: [], synced: [], conflicts: [] };
      let deleted = 0;
      for (const key of ['pending', 'synced', 'conflicts']) {
        const rows = Array.isArray(db.fboScans[key]) ? db.fboScans[key] : [];
        const nextRows = rows.filter((row) => String(row?.box_id || row?.boxId || '') !== boxId);
        deleted += rows.length - nextRows.length;
        db.fboScans[key] = nextRows;
      }

      await saveDb(db);
      send(res, 200, { ok: true, deleted });
      return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      if (!existsSync(staticDir)) {
        send(res, 404, { error: 'Frontend build not found. Run npm run build before starting the warehouse server.' });
        return;
      }

      const rawPath = decodeURIComponent(url.pathname || '/');
      const relativePath = rawPath === '/' ? 'index.html' : rawPath.replace(/^\/+/, '');
      const requestedPath = path.resolve(staticDir, relativePath);
      const safePath = requestedPath.startsWith(staticDir + path.sep) || requestedPath === staticDir;
      const filePath = safePath && existsSync(requestedPath) ? requestedPath : path.join(staticDir, 'index.html');

      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Cache-Control': 'no-store' });
        res.end();
        return;
      }

      await sendStatic(res, filePath);
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    send(res, 500, { error: error?.message || 'Internal server error' });
  }
});

await ensureDb();
server.listen(port, host, () => {
  console.log('Warehouse offline server: http://' + host + ':' + port);
  console.log('Data file: ' + dbPath);
});
