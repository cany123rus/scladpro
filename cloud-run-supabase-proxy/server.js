// Reverse-proxy к Supabase на Google Cloud Run.
// Зачем: *.supabase.co (AWS) и Cloudflare-прокси режут в РФ. Google IP (Cloud Run)
// в РФ доходят (как Firebase). Этот сервис прозрачно форвардит REST/Auth/Storage/
// Functions/Realtime(websocket) на Supabase. На фронте — один VITE_SUPABASE_URL.

const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');

const TARGET = process.env.UPSTREAM || 'https://blygwkxjogmioebutiwn.supabase.co';
const PORT = process.env.PORT || 8080;

// Cloud Run берёт деньги за время, пока запрос открыт. Поэтому:
//  - соединение с Supabase держим живым: без этого каждый запрос заново договаривался о TLS
//    (лишние 100–200 мс и CPU на КАЖДЫЙ запрос, а их десятки тысяч в сутки);
//  - зависший ответ Supabase обрываем через UPSTREAM_TIMEOUT_MS, а не ждём минутами;
//  - вебсокеты (Realtime) по умолчанию НЕ проксируем: открытое соединение считается активным
//    запросом, и в октябре именно они дали счёт в $39 (490 часов инстанса). Реалтайм ходит
//    через Cloudflare, где это бесплатно. Включить обратно: ALLOW_WS=1.
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 30000);
const ALLOW_WS = process.env.ALLOW_WS === '1';
const agent = new https.Agent({ keepAlive: true, maxSockets: 128, maxFreeSockets: 16, timeout: 60000 });

const proxy = httpProxy.createProxyServer({
  target: TARGET,
  changeOrigin: true, // подставляет Host = хост Supabase
  secure: true,
  ws: true,
  xfwd: true,
  agent,
  proxyTimeout: UPSTREAM_TIMEOUT_MS,
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

// Realtime websocket: по умолчанию закрыт (см. выше про стоимость).
server.on('upgrade', (req, socket, head) => {
  if (!ALLOW_WS) {
    socket.end('HTTP/1.1 426 Upgrade Required\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
    return;
  }
  proxy.ws(req, socket, head);
});

// Клиент оборвал запрос — Supabase дальше ждать незачем.
server.requestTimeout = 60000;
server.keepAliveTimeout = 65000;

server.listen(PORT, () => {
  console.log(`supabase proxy listening on ${PORT} -> ${TARGET}`);
});
