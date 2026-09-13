/**
 * Марки Честного знака на сборочных заданиях FBS — запись в WB.
 *
 * Зачем сервер, если остальной обмен с WB идёт прямо из браузера: WB отдаёт
 * CORS-заголовки только на POST. Предварительный запрос для PUT и DELETE
 * отвечает 204 без Access-Control-Allow-*, и браузер режет запрос до отправки
 * (проверено 13.09.2026). Привязка марки — это PUT, снятие — DELETE, поэтому
 * они идут отсюда. Чтение тоже здесь, чтобы у окна скана был один путь.
 *
 * Токен кабинета берётся из suppliers по id — браузер его сюда не передаёт.
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

/*
 * Лимиты WB: запись — 1000 в минуту (раз в 60 мс), чтение и удаление — 300 в
 * минуту (раз в 200 мс). Ответ 4XX засчитывается за десять запросов, так что
 * интервал держим сами, а не ловим 429.
 */
const WRITE_GAP_MS = 70;
const READ_GAP_MS = 220;

/** Запрос в WB с таймаутом и одним повтором на сбой сети или 429. */
async function wbFetch(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
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

/** Ответ WB — в понятную причину. */
async function explain(res: Response): Promise<{ status: number; code: string; message: string }> {
  const text = await res.text().catch(() => '');
  let code = '';
  let message = '';
  try {
    const body = JSON.parse(text);
    code = String(body?.code || '');
    message = String(body?.message || body?.detail || body?.title || '');
  } catch {
    message = text.slice(0, 200);
  }

  if (res.status === 401 || res.status === 403) {
    message = `WB не пустил ключ (${res.status}): нужен ключ «Маркетплейс» с правом записи`;
  } else if (res.status === 409 && /processing status|FailedToUpdateMeta/i.test(`${code} ${message}`)) {
    code = code || 'FailedToUpdateMeta';
    message = 'Задание уже не на сборке — WB принимает марку только до закрытия поставки';
  } else if (res.status === 429) {
    message = 'WB ограничил частоту запросов — повторите через минуту';
  } else if (!message) {
    message = `WB ответил ${res.status}`;
  }
  return { status: res.status, code, message };
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

const cleanOrderId = (raw: unknown): number | null => {
  const id = Number(String(raw ?? '').trim());
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

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
  if (!supplierId) return json({ error: 'Не передан кабинет' }, 400);

  try {
    const token = await supplierToken(supplierId);

    /*
     * Привязать марки. Пачкой: и один скан, и «отправить всё» идут сюда.
     *
     * Код приходит уже с GS-разделителями — их восстанавливает браузер той же
     * функцией, что и для Excel-файла, чтобы в WB уходило ровно одно и то же.
     */
    if (action === 'put') {
      const items = Array.isArray(body?.items) ? body.items.slice(0, 500) : [];
      const results: Array<Record<string, unknown>> = [];

      for (const item of items) {
        const orderId = cleanOrderId(item?.orderId);
        const code = String(item?.code || '');
        if (!orderId || code.length < 16 || code.length > 135) {
          results.push({ orderId: String(item?.orderId ?? ''), ok: false, status: 0, message: 'Некорректный номер задания или марка' });
          continue;
        }

        const res = await wbFetch(`${WB}/api/v3/orders/${orderId}/meta/sgtin`, {
          method: 'PUT',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sgtins: [code] }),
        });
        if (res.ok) {
          results.push({ orderId: String(orderId), ok: true, status: res.status });
        } else {
          results.push({ orderId: String(orderId), ok: false, ...(await explain(res)) });
        }
        await sleep(WRITE_GAP_MS);
      }

      return json({ results });
    }

    // Снять марку — когда её сбросили в окне скана.
    if (action === 'delete') {
      const ids = (Array.isArray(body?.orderIds) ? body.orderIds : []).map(cleanOrderId).filter(Boolean) as number[];
      const results: Array<Record<string, unknown>> = [];

      for (const orderId of ids.slice(0, 300)) {
        const res = await wbFetch(`${WB}/api/v3/orders/${orderId}/meta?key=sgtin`, {
          method: 'DELETE',
          headers: { Authorization: token },
        });
        if (res.ok || res.status === 404) {
          results.push({ orderId: String(orderId), ok: true, status: res.status });
        } else {
          results.push({ orderId: String(orderId), ok: false, ...(await explain(res)) });
        }
        await sleep(READ_GAP_MS);
      }

      return json({ results });
    }

    /*
     * Прочитать марки и статусы их проверки. В ответ попадают только задания,
     * у которых марка ЧЗ вообще предусмотрена.
     */
    if (action === 'get') {
      const ids = Array.from(new Set(
        (Array.isArray(body?.orderIds) ? body.orderIds : []).map(cleanOrderId).filter(Boolean) as number[],
      )).slice(0, 2000);
      const orders: Record<string, { value: string; decision: string }> = {};

      for (let i = 0; i < ids.length; i += 100) {
        const res = await wbFetch(`${WB}/api/marketplace/v3/orders/meta`, {
          method: 'POST',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: ids.slice(i, i + 100) }),
        });
        if (!res.ok) {
          const why = await explain(res);
          return json({ error: why.message, orders }, 502);
        }
        const data = await res.json().catch(() => ({}));
        for (const order of Array.isArray(data?.orders) ? data.orders : []) {
          const sgtin = (Array.isArray(order?.metaDetails) ? order.metaDetails : []).find((m: any) => m?.key === 'sgtin');
          if (sgtin) orders[String(order.id)] = { value: String(sgtin.value || ''), decision: String(sgtin.decision || '') };
        }
        await sleep(READ_GAP_MS);
      }

      return json({ orders });
    }

    return json({ error: `Неизвестное действие: ${action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
