// Cloudflare Worker — обратный прокси к Supabase.
// Зачем: домен *.supabase.co в РФ часто блокируют/режут, и сайт не грузит данные
// без VPN. Этот воркер живёт на ТВОЁМ домене (который не блокируют) и прозрачно
// форвардит всё на Supabase: REST (PostgREST), Auth (GoTrue), Storage, Functions
// и Realtime (websocket). На фронте достаточно поменять один VITE_SUPABASE_URL.

// Реф твоего проекта Supabase. Можно переопределить через переменную окружения
// воркера UPSTREAM (Settings → Variables), тогда менять код не нужно.
const DEFAULT_UPSTREAM = 'https://blygwkxjogmioebutiwn.supabase.co';

export default {
  async fetch(request, env) {
    const upstreamBase = (env && env.UPSTREAM) ? String(env.UPSTREAM) : DEFAULT_UPSTREAM;
    const upstream = new URL(upstreamBase);
    const incoming = new URL(request.url);

    // Собираем целевой URL: тот же путь и query, но хост Supabase.
    const targetUrl = new URL(incoming.pathname + incoming.search, upstream);

    // Websocket (Realtime): просто прокидываем апгрейд-запрос на Supabase.
    const upgrade = request.headers.get('Upgrade') || '';
    if (upgrade.toLowerCase() === 'websocket') {
      return fetch(new Request(targetUrl.toString(), request));
    }

    // Быстрый ответ на CORS-preflight (на случай если апстрим капризничает).
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // Обычный HTTP-запрос: копируем метод/заголовки/тело, меняем только хост.
    const proxied = new Request(targetUrl.toString(), request);
    const resp = await fetch(proxied);

    // Возвращаем ответ как есть, но гарантируем разрешающий CORS для нашего origin.
    const headers = new Headers(resp.headers);
    const cors = corsHeaders(request);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    });
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  const reqHeaders = request.headers.get('Access-Control-Request-Headers')
    || 'authorization, x-client-info, apikey, content-type, prefer, range, x-supabase-api-version';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',
    'Access-Control-Allow-Headers': reqHeaders,
    'Access-Control-Expose-Headers': 'content-range, content-encoding, range, x-supabase-api-version',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
