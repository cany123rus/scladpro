/**
 * Вывод кодов маркировки из оборота (ГИС МТ «Честный знак») по продажам ФБС.
 *
 * Почему обмен идёт через сервер, а подпись остаётся в браузере: ГИС МТ не
 * отдаёт CORS-заголовки, и запрос со страницы до него просто не доедет. А ключ
 * УКЭП, наоборот, не должен покидать компьютер сотрудника. Отсюда разделение:
 * браузер подписывает то, что мы ему дали, сервер везёт это в ГИС МТ.
 *
 * Токен ГИС МТ действует от имени организации, поэтому живёт в таблице
 * chz_sessions с включённым RLS и без единой политики — до него дотягивается
 * только service_role, то есть эта функция.
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

interface ChzConfig {
  baseUrl: string;
  productGroup: string;
  documentType: string;
  documentFormat: string;
  holdDays: number;
  batchSize: number;
  /** С какой даты вообще выводим: раньше этой границы коды не трогаем. */
  soldFrom: string | null;
  /** Шаблон документа: в products подставляются коды, остальное берётся как есть. */
  documentTemplate: Record<string, unknown>;
  /** Формат подписи строки входа — подбирается при первом успешном входе. */
  authSignMode?: string;
}

/*
 * Настройки лежат в app_settings, а не в коде.
 *
 * Точные имена типа документа и полей ГИС МТ меняет, а проверить их без
 * сертификата нельзя. Пусть правятся из интерфейса за минуту, вместо того
 * чтобы ждать пересборки и деплоя ради одной строки.
 */
const DEFAULT_CONFIG: ChzConfig = {
  baseUrl: 'https://markirovka.sandbox.crptech.ru/api/v3/true-api',
  productGroup: 'lp',
  documentType: 'LP_SHIP_GOODS_CSV',
  documentFormat: 'MANUAL',
  holdDays: 3,
  batchSize: 300,
  soldFrom: '2026-09-01T00:00:00Z',
  documentTemplate: {
    withdrawal_type: 'REMOTE_SALE',
    action: 'WITHDRAWAL',
  },
};

const CONFIG_KEY = 'chz_config_v1';

async function loadConfig(): Promise<ChzConfig> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', CONFIG_KEY).maybeSingle();
  if (!data?.value) return DEFAULT_CONFIG;
  try {
    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

/** Живой токен кабинета или null — тогда сотруднику надо подписать вход. */
async function getToken(supplierId: string): Promise<string | null> {
  const { data } = await supabase
    .from('chz_sessions')
    .select('token, expires_at')
    .eq('supplier_id', supplierId)
    .maybeSingle();
  if (!data?.token) return null;
  // Минута запаса: токен, истекающий на лету, выглядит как случайная ошибка.
  if (new Date(data.expires_at).getTime() < Date.now() + 60_000) return null;
  return String(data.token);
}

async function chzFetch(cfg: ChzConfig, path: string, token: string | null, init: RequestInit = {}) {
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // ГИС МТ на создание документа отвечает голым идентификатором без кавычек.
  }
  return { ok: res.ok, status: res.status, body };
}

const errorText = (body: unknown) => {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    return String(record.error_message ?? record.errorMessage ?? JSON.stringify(body));
  }
  return String(body ?? 'нет ответа');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Только POST' }, 405);

  let payload: Record<string, any>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Тело запроса не разобрано' }, 400);
  }

  const action = String(payload.action || '');
  const supplierId = String(payload.supplierId || '').trim();
  if (!supplierId) return json({ error: 'Не указан кабинет' }, 400);

  const cfg = await loadConfig();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name, inn')
    .eq('id', supplierId)
    .maybeSingle();
  if (!supplier) return json({ error: 'Кабинет не найден' }, 404);

  try {
    switch (action) {
      /* ---------- вход: строку из ГИС МТ подписывает браузер ---------- */
      case 'session/start': {
        const res = await chzFetch(cfg, '/auth/key', null);
        if (!res.ok) return json({ error: `ГИС МТ не выдал строку для входа: ${errorText(res.body)}` }, 502);
        const body = res.body as { uuid?: string; data?: string };
        if (!body?.uuid || !body?.data) return json({ error: 'ГИС МТ вернул пустой ответ на /auth/key' }, 502);
        return json({ uuid: body.uuid, data: body.data });
      }

      case 'session/finish': {
        const uuid = String(payload.uuid || '');
        const signature = String(payload.signature || '');
        if (!uuid || !signature) return json({ error: 'Нет подписи или идентификатора' }, 400);

        const res = await chzFetch(cfg, '/auth/simpleSignIn', null, {
          method: 'POST',
          body: JSON.stringify({ uuid, data: signature }),
        });
        if (!res.ok) return json({ error: `ГИС МТ не принял подпись: ${errorText(res.body)}` }, 403);

        const token = (res.body as { token?: string })?.token;
        if (!token) return json({ error: 'ГИС МТ не вернул токен' }, 502);

        // Девять часов вместо десяти: остаток — запас на длинную смену.
        const expiresAt = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase
          .from('chz_sessions')
          .upsert({ supplier_id: supplierId, token, expires_at: expiresAt, updated_at: new Date().toISOString() });
        if (error) return json({ error: `Токен не сохранён: ${error.message}` }, 500);

        return json({ ok: true, expiresAt });
      }

      /*
       * Статусы заказов из WB по всей базе кабинета.
       *
       * В разделе «База заказов» статусы подтягиваются только для открытой
       * страницы — человеку больше и не нужно. Но очередь на вывод строится по
       * признаку «продано», а он есть лишь у просмотренных строк. Поэтому здесь
       * обходим всё, где исход ещё не наступил: проданное и отменённое своего
       * состояния уже не меняет, и перезапрашивать его незачем.
       */
      case 'sync-wb-statuses': {
        const { data: cabinet } = await supabase
          .from('suppliers')
          .select('wb_api_token')
          .eq('id', supplierId)
          .maybeSingle();
        const wbToken = String(cabinet?.wb_api_token || '').trim();
        if (!wbToken) return json({ error: 'У кабинета нет токена WB' }, 400);

        const FINAL = ['sold', 'canceled', 'canceled_by_client', 'declined_by_client', 'defect'];
        const wanted = Number(payload.limit ?? 12000);

        /*
         * Читаем страницами по тысяче.
         *
         * PostgREST отдаёт максимум тысячу строк за запрос независимо от limit:
         * первый прогон честно вернул 1000 из трёх тысяч, и всё, что старше,
         * так и осталось бы без статуса — а значит и без вывода из оборота.
         */
        const rows: Array<{ order_id: string }> = [];
        for (let from = 0; from < wanted; from += 1000) {
          const { data: part, error } = await supabase
            .from('fbs_order_codes')
            .select('order_id')
            .eq('supplier_id', supplierId)
            .not('wb_status', 'in', `(${FINAL.map((s) => `"${s}"`).join(',')})`)
            .order('scanned_at', { ascending: false })
            .range(from, from + 999);
          if (error) return json({ error: `Не прочитали заказы: ${error.message}` }, 500);
          rows.push(...(part || []));
          if (!part || part.length < 1000) break;
        }

        const ids = Array.from(
          new Set(rows.map((r: { order_id: string }) => Number(String(r.order_id || '').trim()))),
        ).filter((id) => Number.isFinite(id) && id > 0);

        let updated = 0;
        const nowIso = new Date().toISOString();

        for (let i = 0; i < ids.length; i += 1000) {
          const chunk = ids.slice(i, i + 1000);
          const res = await fetch('https://marketplace-api.wildberries.ru/api/v3/orders/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: wbToken },
            body: JSON.stringify({ orders: chunk }),
          });
          if (!res.ok) {
            const text = await res.text();
            return json({ error: `WB ответил ${res.status}: ${text.slice(0, 200)}`, updated }, 502);
          }

          const body = await res.json();
          const list: Array<Record<string, unknown>> = Array.isArray(body?.orders) ? body.orders : [];

          for (const order of list) {
            const { error: upError } = await supabase
              .from('fbs_order_codes')
              .update({
                wb_status: String(order?.wbStatus || ''),
                supplier_status: String(order?.supplierStatus || ''),
                wb_synced_at: nowIso,
                updated_at: nowIso,
              })
              .eq('supplier_id', supplierId)
              .eq('order_id', String(order?.id ?? ''));
            if (!upError) updated += 1;
          }
        }

        return json({ asked: ids.length, updated });
      }

      /*
       * Дописать настройку.
       *
       * Нужна ровно для одного: запомнить формат подписи, который ГИС МТ принял.
       * Подбирать его при каждом входе — значит четыре раза дёргать носитель
       * и человека, который держит токен.
       */
      case 'config/patch': {
        const patch = (payload.patch ?? {}) as Record<string, unknown>;
        if (!patch || typeof patch !== 'object') return json({ error: 'Нечего сохранять' }, 400);

        const next = { ...cfg, ...patch };
        const { error } = await supabase
          .from('app_settings')
          .upsert([{ key: CONFIG_KEY, value: JSON.stringify(next) }], { onConflict: 'key' });
        if (error) return json({ error: `Настройка не сохранена: ${error.message}` }, 500);

        return json({ ok: true, config: next });
      }

      /* ---------- очередь ---------- */
      case 'enqueue': {
        const holdDays = Number(payload.holdDays ?? cfg.holdDays);
        const soldFrom = payload.soldFrom ? String(payload.soldFrom) : cfg.soldFrom || null;
        const { data, error } = await supabase.rpc('chz_enqueue_sold', {
          p_supplier: supplierId,
          p_hold_days: holdDays,
          p_sold_from: soldFrom,
        });
        if (error) return json({ error: `Очередь не пополнена: ${error.message}` }, 500);
        return json({ added: Number(data ?? 0), holdDays, soldFrom });
      }

      /*
       * Ежедневный прогон: обновить статусы и добрать очередь.
       *
       * Отправку сюда не тянем намеренно — она требует подписи УКЭП, а ключ
       * лежит у сотрудника, не на сервере. Задача готовит работу к одному
       * нажатию, а не делает её тайком.
       */
      case 'daily': {
        const started = Date.now();
        const statuses = await fetch(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify({ action: 'sync-wb-statuses', supplierId }),
        }).then((r) => r.json()).catch((e) => ({ error: String(e) }));

        const holdDays = Number(payload.holdDays ?? cfg.holdDays);
        const soldFrom = payload.soldFrom ? String(payload.soldFrom) : cfg.soldFrom || null;
        const { data: added } = await supabase.rpc('chz_enqueue_sold', {
          p_supplier: supplierId,
          p_hold_days: holdDays,
          p_sold_from: soldFrom,
        });

        return json({ statuses, added: Number(added ?? 0), tookMs: Date.now() - started });
      }

      case 'status': {
        const { data: rows } = await supabase
          .from('chz_withdrawals')
          .select('status')
          .eq('supplier_id', supplierId)
          .limit(10000);
        const counts: Record<string, number> = {};
        (rows || []).forEach((r: { status: string }) => {
          counts[r.status] = (counts[r.status] || 0) + 1;
        });
        const token = await getToken(supplierId);
        return json({ counts, signedIn: Boolean(token), inn: supplier.inn || '', config: cfg });
      }

      /* ---------- документ: собираем и отдаём браузеру на подпись ---------- */
      case 'batch/prepare': {
        if (!supplier.inn) return json({ error: 'У кабинета не заполнен ИНН — без него документ не собрать' }, 400);

        const limit = Math.min(Number(payload.limit ?? cfg.batchSize), cfg.batchSize);
        const { data: rows, error } = await supabase
          .from('chz_withdrawals')
          .select('id, chz_code, order_id, sold_at')
          .eq('supplier_id', supplierId)
          .eq('status', 'pending')
          .order('sold_at', { ascending: true })
          .limit(limit);
        if (error) return json({ error: `Очередь не прочитана: ${error.message}` }, 500);
        if (!rows?.length) return json({ error: 'Выводить нечего: очередь пуста' }, 400);

        const document = {
          ...cfg.documentTemplate,
          inn: supplier.inn,
          action_date: new Date().toISOString(),
          products: rows.map((r: { chz_code: string }) => ({ cis: r.chz_code })),
        };

        const { data: doc, error: docError } = await supabase
          .from('chz_documents')
          .insert({
            supplier_id: supplierId,
            codes_count: rows.length,
            status: 'draft',
            payload: document,
          })
          .select('id')
          .single();
        if (docError) return json({ error: `Документ не сохранён: ${docError.message}` }, 500);

        // Строки закрепляем за документом сразу: иначе соседняя вкладка соберёт
        // вторую пачку из тех же кодов, и один код уедет в двух документах.
        await supabase
          .from('chz_withdrawals')
          .update({ document_id: doc.id, updated_at: new Date().toISOString() })
          .in('id', rows.map((r: { id: string }) => r.id));

        const text = JSON.stringify(document);
        return json({ documentId: doc.id, codesCount: rows.length, base64: toBase64(text), preview: document });
      }

      case 'batch/submit': {
        const documentId = String(payload.documentId || '');
        const signature = String(payload.signature || '');
        const signedBy = String(payload.signedBy || '');
        if (!documentId || !signature) return json({ error: 'Нет подписи или документа' }, 400);

        const token = await getToken(supplierId);
        if (!token) return json({ error: 'Нужен вход в ГИС МТ: подпишите вход заново' }, 401);

        const { data: doc } = await supabase
          .from('chz_documents')
          .select('id, payload, status')
          .eq('id', documentId)
          .maybeSingle();
        if (!doc) return json({ error: 'Документ не найден' }, 404);
        if (doc.status !== 'draft') return json({ error: 'Этот документ уже отправляли' }, 409);

        const body = {
          document_format: cfg.documentFormat,
          product_document: toBase64(JSON.stringify(doc.payload)),
          type: cfg.documentType,
          signature,
        };

        const res = await chzFetch(cfg, `/lk/documents/create?pg=${encodeURIComponent(cfg.productGroup)}`, token, {
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          await supabase
            .from('chz_documents')
            .update({ status: 'rejected', response: { error: res.body }, updated_at: new Date().toISOString() })
            .eq('id', documentId);
          // Строки возвращаем в очередь: отказ на отправке — это не вывод.
          await supabase
            .from('chz_withdrawals')
            .update({ status: 'pending', document_id: null, error: errorText(res.body), updated_at: new Date().toISOString() })
            .eq('document_id', documentId);
          return json({ error: `ГИС МТ не принял документ: ${errorText(res.body)}` }, 502);
        }

        // На создание документа ГИС МТ отвечает его идентификатором строкой.
        const externalId = typeof res.body === 'string' ? res.body.replace(/"/g, '').trim() : String(res.body ?? '');

        await supabase
          .from('chz_documents')
          .update({
            status: 'sent',
            external_id: externalId,
            response: { raw: res.body },
            signed_by: signedBy,
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentId);

        await supabase
          .from('chz_withdrawals')
          .update({ status: 'sent', error: '', updated_at: new Date().toISOString() })
          .eq('document_id', documentId);

        return json({ ok: true, externalId, codesCount: doc.payload?.products?.length ?? 0 });
      }

      /* ---------- ГИС МТ проверяет документ не сразу ---------- */
      case 'poll': {
        const token = await getToken(supplierId);
        if (!token) return json({ error: 'Нужен вход в ГИС МТ: подпишите вход заново' }, 401);

        const { data: docs } = await supabase
          .from('chz_documents')
          .select('id, external_id')
          .eq('supplier_id', supplierId)
          .eq('status', 'sent')
          .limit(20);

        const checked: Array<{ id: string; status: string; detail: string }> = [];

        for (const doc of docs || []) {
          if (!doc.external_id) continue;
          const res = await chzFetch(cfg, `/doc/${encodeURIComponent(doc.external_id)}/info`, token);
          if (!res.ok) continue;

          const info = res.body as Record<string, any>;
          const raw = String(info?.status ?? '').toUpperCase();
          // ГИС МТ различает много промежуточных состояний, нам важны три исхода.
          const accepted = raw.includes('CHECKED_OK') || raw === 'ACCEPTED';
          const rejected = raw.includes('NOT_OK') || raw.includes('REJECT') || raw.includes('ERROR');
          if (!accepted && !rejected) continue;

          const detail = accepted ? '' : errorText(info?.errors ?? info);

          await supabase
            .from('chz_documents')
            .update({
              status: accepted ? 'accepted' : 'rejected',
              response: info,
              updated_at: new Date().toISOString(),
            })
            .eq('id', doc.id);

          await supabase
            .from('chz_withdrawals')
            .update({
              status: accepted ? 'accepted' : 'rejected',
              error: detail,
              updated_at: new Date().toISOString(),
            })
            .eq('document_id', doc.id);

          checked.push({ id: doc.id, status: accepted ? 'accepted' : 'rejected', detail });
        }

        return json({ checked });
      }

      default:
        return json({ error: `Неизвестное действие: ${action}` }, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
