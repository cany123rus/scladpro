// Reverse-proxy к Supabase на Google Cloud Run.
// Зачем: *.supabase.co (AWS) и Cloudflare-прокси режут в РФ. Google IP (Cloud Run)
// в РФ доходят (как Firebase). Этот сервис прозрачно форвардит REST/Auth/Storage/
// Functions/Realtime(websocket) на Supabase. На фронте — один VITE_SUPABASE_URL.

const http = require('http');
const httpProxy = require('http-proxy');

const TARGET = process.env.UPSTREAM || 'https://blygwkxjogmioebutiwn.supabase.co';
const PORT = process.env.PORT || 8080;

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true, // подставляет Host = хост Supabase
  secure: true,
  ws: true,
  xfwd: true,
});

function setCors(res, req) {
  const origin = (req.headers && req.headers.origin) || '*';
  const reqHeaders = (req.headers && req.headers['access-control-request-headers'])
    || 'authorization, x-client-info, apikey, content-type, prefer, range, x-supabase-api-version';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.setHeader('Access-Control-Allow-Headers', reqHeaders);
  res.setHeader('Access-Control-Expose-Headers', 'content-range, content-encoding, range, x-supabase-api-version');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}

// Перезаписываем CORS на ответах апстрима под наш origin (с credentials нельзя "*").
proxy.on('proxyRes', (proxyRes, req) => {
  const origin = (req.headers && req.headers.origin) || '*';
  proxyRes.headers['access-control-allow-origin'] = origin;
  proxyRes.headers['access-control-allow-credentials'] = 'true';
  proxyRes.headers['vary'] = 'Origin';
});

proxy.on('error', (err, req, res) => {
  try {
    if (res && res.writeHead && !res.headersSent) {
      setCors(res, req);
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    if (res && res.end) res.end(JSON.stringify({ error: 'proxy_error', message: String(err && err.message || err) }));
  } catch (_) {}
});

const server = http.createServer((req, res) => {
  // Лёгкий healthcheck для Cloud Run.
  if (req.url === '/__health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (req.method === 'OPTIONS') {
    setCors(res, req);
    res.writeHead(204);
    res.end();
    return;
  }
  proxy.web(req, res);
});

// Realtime websocket.
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(PORT, () => {
  console.log(`supabase proxy listening on ${PORT} -> ${TARGET}`);
});
