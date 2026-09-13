/**
 * Грузоместа поставок FBS, отгружаемых на ПВЗ: создать, список, стикеры, удалить.
 *
 * Через сервер, а не из браузера: WB отдаёт CORS-заголовки только на POST, а
 * список грузомест — GET, удаление — DELETE. Чтобы у кнопки был один путь,
 * через функцию идут все четыре действия.
 *
 * Токен кабинета берётся из suppliers по id — браузер его сюда не передаёт.
 *
 * Правила WB (спецификация 03-orders-fbs, 13.09.2026):
 *  - грузоместа только для поставок на ПВЗ и только в открытой поставке;
 *  - не больше половины заданий поставки: на 10 заданий — до 5;
 *  - удалить можно, пока поставка на сборке;
 *  - задания по грузоместам WB не раскладывает: грузоместо — номер и стикер.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const WB = 'https://marketplace-api.wildberries.ru';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Запрос в WB с таймаутом и одним повтором на сбой сети или 429. */
async function wbFetch(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.status === 429 && attempt === 0) {
        const retryAfter = Number(res.headers.get('Retry-After') || '1');
        await sleep(Math.min(10, Math.max(1, retryAfter)) * 1000);
        continue;
      }
      return res;
    } catch (e) {
      lastError = e;
      await sleep(800);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`WB не отвечает: ${lastError instanceof Error ? lastError.message : lastError}`);
}

/** Отказ WB — словами. */
async function explain(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  let message = '';
  try {
    const body = JSON.parse(text);
    message = String(body?.message || body?.detail || body?.title || body?.code || '');
  } catch {
    message = text.slice(0, 200);
  }
  if (res.status === 401 || res.status === 403) {
    return `WB не пустил ключ (${res.status}): нужен ключ «Маркетплейс» с правом записи`;
  }
  if (res.status === 404) return 'WB не нашёл поставку';
  if (res.status === 429) return 'WB ограничил частоту запросов — повторите через минуту';
  return `WB ответил ${res.status}${message ? `: ${message}` : ''}`;
}

async function supplierToken(supplierId: string): Promise<string> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('wb_api_token')
    .eq('id', supplierId)
    .maybeSingle();
  if (error) throw new Error(`Не прочитали кабинет: ${error.message}`);
  const token = String(data?.wb_api_token || '').trim();
  if (!token) throw new Error('У кабинета нет ключа WB API');
  return token;
}

const cleanIds = (raw: unknown): string[] =>
  Array.from(new Set((Array.isArray(raw) ? raw : []).map((x) => String(x || '').trim()).filter(Boolean)));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Только POST' }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Тело запроса не JSON' }, 400);
  }

  const action = String(body?.action || '');
  const supplierId = String(body?.supplierId || '').trim();
  const supplyId = String(body?.supplyId || '').trim();
  if (!supplierId) return json({ error: 'Не передан кабинет' }, 400);
  if (!/^WB-GI-\d+$/.test(supplyId)) return json({ error: 'Некорректный номер поставки' }, 400);

  const base = `${WB}/api/v3/supplies/${encodeURIComponent(supplyId)}/trbx`;

  try {
    const token = await supplierToken(supplierId);

    if (action === 'list') {
      const res = await wbFetch(base, { method: 'GET', headers: { Authorization: token } });
      if (!res.ok) return json({ error: await explain(res) }, 502);
      const data = await res.json().catch(() => ({}));
      const ids = (Array.isArray(data?.trbxes) ? data.trbxes : [])
        .map((t: any) => String(t?.id || ''))
        .filter(Boolean);
      return json({ ids });
    }

    if (action === 'create') {
      const amount = Math.floor(Number(body?.amount));
      if (!Number.isFinite(amount) || amount < 1 || amount > 1000) {
        return json({ error: 'Количество грузомест — от 1 до 1000' }, 400);
      }
      const res = await wbFetch(base, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) return json({ error: await explain(res) }, 502);
      const data = await res.json().catch(() => ({}));
      const ids = (Array.isArray(data?.trbxIds) ? data.trbxIds : []).map((x: unknown) => String(x)).filter(Boolean);
      return json({ ids });
    }

    /*
     * Стикеры PNG 580×400 — те же 58×40, что и стикеры заданий, печатаются
     * на тот же термопринтер. WB отдаёт их пачкой; режем по сотне на всякий
     * случай, лимита в спецификации нет.
     */
    if (action === 'stickers') {
      const ids = cleanIds(body?.trbxIds);
      if (!ids.length) return json({ error: 'Не переданы грузоместа' }, 400);

      const stickers: Array<{ id: string; barcode: string; file: string }> = [];
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const res = await wbFetch(`${base}/stickers?type=png`, {
          method: 'POST',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ trbxIds: chunk }),
        });
        if (!res.ok) return json({ error: await explain(res), stickers }, 502);
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.stickers) ? data.stickers : [];
        list.forEach((s: any, index: number) => {
          stickers.push({
            // В ответе нет id грузоместа — порядок совпадает с запросом.
            id: String(s?.trbxId || s?.id || chunk[index] || ''),
            barcode: String(s?.barcode || ''),
            file: String(s?.file || ''),
          });
        });
        await sleep(220);
      }
      return json({ stickers });
    }

    if (action === 'delete') {
      const ids = cleanIds(body?.trbxIds);
      if (!ids.length) return json({ error: 'Не переданы грузоместа' }, 400);
      const res = await wbFetch(base, {
        method: 'DELETE',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ trbxIds: ids }),
      });
      if (!res.ok) return json({ error: await explain(res) }, 502);
      return json({ deleted: ids.length });
    }

    return json({ error: `Неизвестное действие: ${action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
