/**
 * Ежедневный отчёт в Telegram: честный знак по поставщикам.
 *
 * Каждое утро (cron, 9:00 МСК) для каждого кабинета: сколько марок ушло вчера,
 * сколько осталось в базе ЧЗ и на сколько дней хватит. Категории, где запаса
 * меньше чем на 3 дня, выносятся наверх отдельным блоком.
 *
 * Расход — заказы ФБС из WB (один заказ — одна марка) за 7 полных дней по
 * Москве, без сегодняшнего. Средний расход в день считается без самого слабого
 * и самого сильного дня: один всплеск («вторник — 50 штук») не должен ни
 * пугать, ни успокаивать. Если заказы были меньше чем в 3 днях из 7 — просто
 * сумма ÷ 7 и пометка, что прогноз неточный.
 *
 * Кому уходит:
 *  - владельцу — сводка по всем кабинетам: первым сообщением список всех
 *    позиций, которым запаса не хватит на 3 дня, дальше подробно по кабинетам;
 *  - поставщику — отдельное сообщение, только если у него что-то кончается,
 *    и только по его категориям. Если чат поставщика совпадает с чатом
 *    владельца, отдельное сообщение не шлём — сводка там уже есть.
 *
 * Настройки — app_settings `chz_stock_report_v1`:
 *   { chatIds: string[], botTokenKey: string, supplierBotTokenKeys: string[],
 *     lowDays: number, needDays: number, notifySuppliers: boolean }
 * По умолчанию: чат владельца из `backup_chat_id`, бот `telegram_bot_token`;
 * поставщикам — тоже основной бот (в нём кнопка «Запросить остаток ЧЗ»), а если
 * поставщик его не запускал — бот приёмки `telegram_reception_bot_token`.
 *
 * Тело запроса: { dryRun?: true } — собрать текст и вернуть, ничего не отправляя;
 * { force?: true } — отправить, даже если сегодня уже отправляли.
 * { supplierId?: uuid } — только один кабинет (тестовая отправка); отметку
 *   «сегодня отправлено» не ставит, утренний отчёт уйдёт как обычно.
 * { replyTo: { chatId } } — ответ на кнопку «Запросить остаток ЧЗ» в боте:
 *   чату владельца — по всем кабинетам, чату поставщика — по его кабинетам.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

const DAYS = 7;

/** Кнопка в основном боте: её же ловит вебхук scladprobot-webhook. */
const CHZ_BUTTON = '📊 Запросить остаток ЧЗ';
const BOT_KEYBOARD = { keyboard: [[{ text: CHZ_BUTTON }]], resize_keyboard: true, is_persistent: true };
const DAY_MS = 86_400_000;
const MSK_OFFSET_MS = 3 * 3_600_000;

type Gender = 'male' | 'female' | null;
type Line = {
  category: string;
  gender: Gender;
  stock: number;
  daily: number[]; // DAYS значений, [0] — самый старый день, [DAYS-1] — вчера
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU');
const fmtRate = (n: number) => (n >= 10 ? fmt(n) : n.toLocaleString('ru-RU', { maximumFractionDigits: 1 }));
const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

const normCategory = (raw: string | null | undefined) => {
  const c = String(raw || '').trim();
  if (!c) return 'Без категории';
  if (['костюмы', 'костюмы спортивные', 'костюмы / костюмы спортивные'].includes(c.toLowerCase())) {
    return 'Костюмы / Костюмы спортивные';
  }
  // Свитеры, жилеты и кардиганы — одна категория ЧЗ.
  if (['свитеры', 'свитер', 'жилеты', 'жилет', 'жилетки', 'жилетка', 'кардиганы', 'кардиган', 'свитеры / жилеты', 'свитеры / жилеты / кардиганы'].includes(c.toLowerCase())) {
    return 'Свитеры / Жилеты / Кардиганы';
  }
  return c;
};
const normGender = (raw: unknown): Gender => {
  const g = String(raw || '').trim().toLowerCase();
  if (g === 'male' || g.startsWith('муж')) return 'male';
  if (g === 'female' || g.startsWith('жен')) return 'female';
  return null;
};
const genderTitle = (g: Gender) => (g === 'male' ? 'муж.' : g === 'female' ? 'жен.' : '');

/** Средний расход в день: без крайних дней, если данных достаточно. */
function dailyRate(daily: number[]) {
  const activeDays = daily.filter((n) => n > 0).length;
  const total = daily.reduce((s, n) => s + n, 0);
  if (activeDays < 3) return { rate: total / DAYS, rough: total > 0 };
  const sorted = [...daily].sort((a, b) => a - b).slice(1, -1);
  return { rate: sorted.reduce((s, n) => s + n, 0) / sorted.length, rough: false };
}

/**
 * Есть ли у токена WB категория «Маркетплейс» (бит 16 в поле `s` JWT).
 * Без неё заказов ФБС нет (так у «Постельки») — такой кабинет в отчёт не берём.
 * Неразобранный токен пропускаем: решит сам WB.
 */
function hasMarketplaceScope(token: string) {
  const part = token.trim().split('.')[1];
  if (!part) return true;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
    return (Number(payload?.s ?? 0) & 16) !== 0;
  } catch {
    return true;
  }
}

/** Начало суток по Москве (в UTC-миллисекундах) для момента t. */
const mskDayStart = (t: number) => Math.floor((t + MSK_OFFSET_MS) / DAY_MS) * DAY_MS - MSK_OFFSET_MS;

async function loadSettings() {
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['chz_stock_report_v1', 'backup_chat_id', 'telegram_bot_token', 'telegram_reception_bot_token', 'chz_stock_report_last_v1']);
  const map = new Map((data || []).map((r: any) => [r.key, String(r.value ?? '')]));
  let cfg: {
    chatIds?: string[];
    botTokenKey?: string;
    supplierBotTokenKeys?: string[];
    lowDays?: number;
    needDays?: number;
    notifySuppliers?: boolean;
  } = {};
  try { cfg = JSON.parse(map.get('chz_stock_report_v1') || '{}'); } catch { cfg = {}; }
  const chatIds = (cfg.chatIds && cfg.chatIds.length ? cfg.chatIds : [map.get('backup_chat_id') || '']).filter(Boolean);
  let botToken = map.get(cfg.botTokenKey || 'telegram_bot_token') || '';
  if (cfg.botTokenKey && cfg.botTokenKey !== 'telegram_bot_token' && !botToken) {
    const { data: t } = await supabase.from('app_settings').select('value').eq('key', cfg.botTokenKey).maybeSingle();
    botToken = String(t?.value || '');
  }
  const supplierBotTokens = (cfg.supplierBotTokenKeys?.length ? cfg.supplierBotTokenKeys : ['telegram_bot_token', 'telegram_reception_bot_token'])
    .map((k) => String(map.get(k) || '').trim())
    .filter(Boolean);
  return {
    chatIds,
    botToken: botToken.trim(),
    supplierBotTokens: Array.from(new Set(supplierBotTokens)),
    lowDays: Number(cfg.lowDays || 3),
    needDays: Number(cfg.needDays || 7),
    notifySuppliers: cfg.notifySuppliers !== false,
    lastSent: map.get('chz_stock_report_last_v1') || '',
  };
}

async function fetchOrders(token: string, fromMs: number) {
  const out: Array<{ nmId: number; createdAt: number }> = [];
  let next = 0;
  for (let page = 0; page < 40; page++) {
    const url = `https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=${next}&dateFrom=${Math.floor(fromMs / 1000)}`;
    let res: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(url, { headers: { Authorization: token } });
      if (res.status !== 429 && res.status < 500) break;
      const wait = Number(res.headers.get('X-Ratelimit-Retry') || res.headers.get('Retry-After') || 2);
      await new Promise((r) => setTimeout(r, Math.min(30, Math.max(1, wait)) * 1000));
    }
    if (!res || !res.ok) throw new Error(`WB ${res?.status}: ${(await res?.text())?.slice(0, 120)}`);
    const data = await res.json();
    const batch: any[] = data?.orders || [];
    for (const o of batch) {
      const nmId = Number(o?.nmId);
      const createdAt = Date.parse(String(o?.createdAt || ''));
      if (nmId > 0 && Number.isFinite(createdAt)) out.push({ nmId, createdAt });
    }
    if (batch.length < 1000 || typeof data?.next !== 'number' || data.next === next) break;
    next = data.next;
  }
  return out;
}

async function buildSupplierLines(supplier: { id: string; wb_api_token: string }, fromMs: number, toMs: number) {
  const orders = (await fetchOrders(supplier.wb_api_token.trim(), fromMs))
    .filter((o) => o.createdAt >= fromMs && o.createdAt < toMs);

  // карточки — только для тех nmId, что встретились в заказах
  const nmIds = Array.from(new Set(orders.map((o) => o.nmId)));
  const cards = new Map<number, { category: string; gender: Gender }>();
  for (let i = 0; i < nmIds.length; i += 300) {
    const { data } = await supabase
      .from('wb_products_cache')
      .select('nm_id, subject:product_json->>subjectName, characteristics:product_json->characteristics')
      .eq('supplier_id', supplier.id)
      .in('nm_id', nmIds.slice(i, i + 300));
    for (const row of data || []) {
      const chars: any[] = Array.isArray((row as any).characteristics) ? (row as any).characteristics : [];
      const sex = chars.find((c) => String(c?.name || '') === 'Пол');
      cards.set(Number((row as any).nm_id), {
        category: normCategory((row as any).subject),
        gender: normGender(Array.isArray(sex?.value) ? sex.value[0] : sex?.value),
      });
    }
  }

  const lines = new Map<string, Line>();
  const lineFor = (category: string, gender: Gender) => {
    const key = `${category}|${gender || ''}`;
    let line = lines.get(key);
    if (!line) {
      line = { category, gender, stock: 0, daily: new Array(DAYS).fill(0) };
      lines.set(key, line);
    }
    return line;
  };

  for (const o of orders) {
    const card = cards.get(o.nmId) || { category: 'Без категории', gender: null };
    const dayIndex = Math.floor((o.createdAt - fromMs) / DAY_MS);
    if (dayIndex < 0 || dayIndex >= DAYS) continue;
    lineFor(card.category, card.gender).daily[dayIndex] += 1;
  }

  // остаток — той же функцией, что и панель на сайте (пустой массив = без расхода)
  const { data: stockRows, error } = await supabase.rpc('hs_fbs_stock_forecast', {
    p_supplier: supplier.id,
    p_nm_ids: [],
    p_days: DAYS,
  });
  if (error) throw new Error(`остаток ЧЗ: ${error.message}`);
  for (const r of stockRows || []) {
    const inBase = Number((r as any).in_base || 0);
    if (inBase > 0) lineFor(normCategory((r as any).category), normGender((r as any).gender)).stock += inBase;
  }

  return { lines: Array.from(lines.values()), ordersCount: orders.length };
}

type Row = Line & { yesterday: number; rate: number; rough: boolean; daysLeft: number | null; urgent: boolean };

const rowTitle = (r: Row) => `${esc(r.category)}${r.gender ? `, ${genderTitle(r.gender)}` : ''}`;
const rowLeft = (r: Row) => {
  if (r.daysLeft === null) return 'расхода нет';
  if (r.stock <= 0) return '<b>закончился</b>';
  const d = Math.floor(r.daysLeft);
  return `хватит на ${d < 1 ? 'меньше дня' : `${d} ${plural(d, 'день', 'дня', 'дней')}`}`;
};
/** Сколько кодов докупить, чтобы хватило на needDays дней. */
const rowNeed = (r: Row, needDays: number) => Math.max(0, Math.ceil(r.rate * needDays - r.stock));

function renderSupplier(name: string, lines: Line[], lowDays: number, dateTitle: string) {
  const rows: Row[] = lines
    .map((l) => {
      const { rate, rough } = dailyRate(l.daily);
      const daysLeft = rate > 0 ? l.stock / rate : null;
      return { ...l, yesterday: l.daily[DAYS - 1], rate, rough, daysLeft, urgent: daysLeft !== null && daysLeft < lowDays };
    })
    .filter((r) => r.rate > 0 || r.stock > 0)
    .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity) || b.rate - a.rate);

  if (!rows.length) return null;

  const line = (r: Row) =>
    `• ${rowTitle(r)}: вчера <b>${fmt(r.yesterday)}</b> · осталось <b>${fmt(r.stock)}</b> · ${rowLeft(r)}` +
    (r.rate > 0 ? ` <i>(~${fmtRate(r.rate)}/день${r.rough ? ', мало заказов' : ''})</i>` : '');

  const urgent = rows.filter((r) => r.urgent);
  const rest = rows.filter((r) => !r.urgent);
  const totalYesterday = rows.reduce((s, r) => s + r.yesterday, 0);
  const totalStock = rows.reduce((s, r) => s + r.stock, 0);

  const parts = [
    `🏷 <b>${esc(name.trim())}</b> — ЧЗ на ${dateTitle}`,
    `Вчера ушло: <b>${fmt(totalYesterday)}</b> · в базе: <b>${fmt(totalStock)}</b>`,
  ];
  if (urgent.length) {
    parts.push('', `🚨 <b>ЗАПАСА МЕНЬШЕ ЧЕМ НА ${lowDays} ${plural(lowDays, 'ДЕНЬ', 'ДНЯ', 'ДНЕЙ')}:</b>`, ...urgent.map(line));
  }
  if (rest.length) {
    parts.push('', urgent.length ? '✅ Остальное:' : '✅ Запаса хватает:', ...rest.map(line));
  }
  return { text: parts.join('\n'), urgent };
}

/** Сообщение самому поставщику — только о том, что у него кончается. */
function renderForSupplier(name: string, urgent: Row[], lowDays: number, needDays: number) {
  return [
    `⚠️ <b>Заканчивается честный знак</b> — ${esc(name.trim())}`,
    `Запаса меньше чем на ${lowDays} ${plural(lowDays, 'день', 'дня', 'дней')}:`,
    '',
    ...urgent.map((r) => `• <b>${rowTitle(r)}</b>: осталось <b>${fmt(r.stock)}</b> · расход ~${fmtRate(r.rate)}/день · на ${needDays} ${plural(needDays, 'день', 'дня', 'дней')} нужно ещё <b>~${fmt(rowNeed(r, needDays))}</b>`),
    '',
    'Пришлите, пожалуйста, новые коды ЧЗ по этим категориям.',
  ].join('\n');
}

/** Отправка поставщику: основной бот, если поставщик его не запускал — бот приёмки. */
async function sendToSupplier(tokens: string[], chatId: string, text: string) {
  let lastError: unknown = null;
  for (const [i, token] of tokens.entries()) {
    try {
      // Кнопка есть только в основном боте (первый в списке).
      await sendTelegram(token, chatId, text, i === 0 ? BOT_KEYBOARD : undefined);
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('нет бота для отправки поставщику');
}

/** Сообщения по очереди; длинные режем по строкам, кнопку вешаем на последнее. */
async function sendAll(botToken: string, chatId: string, texts: string[]) {
  const chunks: string[] = [];
  for (const text of texts) {
    let chunk = '';
    for (const row of text.split('\n')) {
      if (chunk && chunk.length + row.length + 1 > 3900) {
        chunks.push(chunk);
        chunk = '';
      }
      chunk = chunk ? `${chunk}\n${row}` : row;
    }
    if (chunk) chunks.push(chunk);
  }
  for (let i = 0; i < chunks.length; i++) {
    await sendTelegram(botToken, chatId, chunks[i], i === chunks.length - 1 ? BOT_KEYBOARD : undefined);
  }
}

const validChatId = (raw: unknown) => {
  const id = String(raw ?? '').trim();
  return /^-?\d{5,}$/.test(id) ? id : '';
};

async function sendTelegram(botToken: string, chatId: string, text: string, replyMarkup?: unknown) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(`Telegram: ${body?.description || res.status}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const dryRun = Boolean(body?.dryRun);
  const force = Boolean(body?.force);
  const onlySupplier = typeof body?.supplierId === 'string' ? body.supplierId : '';
  const replyChat = validChatId(body?.replyTo?.chatId);
  // Тест и ответ на кнопку — не утренний отчёт: без отметки и без рассылки поставщикам.
  const isTest = Boolean(onlySupplier) || Boolean(replyChat);

  try {
    const settings = await loadSettings();
    const now = Date.now();
    const todayStart = mskDayStart(now);
    const fromMs = todayStart - DAYS * DAY_MS;
    const todayKey = new Date(todayStart + MSK_OFFSET_MS).toISOString().slice(0, 10);
    const dateTitle = new Date(now).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' });

    if (!dryRun && !force && !isTest && settings.lastSent === todayKey) {
      return json({ ok: true, skipped: 'сегодня отчёт уже отправлен' });
    }
    if (!dryRun && (!settings.botToken || !settings.chatIds.length)) {
      throw new Error('Не настроены бот или чат: app_settings telegram_bot_token и backup_chat_id / chz_stock_report_v1');
    }

    let query = supabase
      .from('suppliers')
      .select('id, name, wb_api_token, telegram_chat_id')
      .not('wb_api_token', 'is', null)
      .order('name');
    if (onlySupplier) query = query.eq('id', onlySupplier);
    const { data: allSuppliers, error } = await query;
    if (error) throw error;

    // Ответ на кнопку: владельцу — всё, поставщику — только его кабинеты.
    const isOwnerReply = Boolean(replyChat) && settings.chatIds.map((c) => String(c).trim()).includes(replyChat);
    const suppliers = replyChat && !isOwnerReply
      ? (allSuppliers || []).filter((x: any) => validChatId(x.telegram_chat_id) === replyChat)
      : allSuppliers;
    if (replyChat && !isOwnerReply && !suppliers?.length) {
      await sendTelegram(settings.botToken, replyChat, 'Этот чат не привязан ни к одному поставщику. Обратитесь к администратору склада.', BOT_KEYBOARD);
      return json({ ok: true, reply: 'не поставщик' });
    }

    const messages: string[] = [];
    const problems: string[] = [];
    const urgentList: string[] = [];
    const supplierNotices: Array<{ name: string; chatId: string; text: string }> = [];
    let urgentTotal = 0;
    const ownerChats = new Set(settings.chatIds.map((c) => String(c).trim()));

    for (const s of suppliers || []) {
      if (!String(s.wb_api_token || '').trim()) continue;
      if (!hasMarketplaceScope(String(s.wb_api_token))) continue;
      try {
        const { lines } = await buildSupplierLines(s as any, fromMs, todayStart);
        const rendered = renderSupplier(String(s.name || ''), lines, settings.lowDays, dateTitle);
        if (rendered) {
          messages.push(rendered.text);
          urgentTotal += rendered.urgent.length;
          const supplierName = String(s.name || '').trim();
          for (const r of rendered.urgent) {
            urgentList.push(
              `• ${esc(supplierName)} — <b>${rowTitle(r)}</b>: осталось ${fmt(r.stock)} · ~${fmtRate(r.rate)}/день · на ${settings.needDays} дн. нужно ~${fmt(rowNeed(r, settings.needDays))}`,
            );
          }
          const chatId = validChatId((s as any).telegram_chat_id);
          if (rendered.urgent.length && settings.notifySuppliers && chatId && !ownerChats.has(chatId)) {
            supplierNotices.push({
              name: supplierName,
              chatId,
              text: renderForSupplier(supplierName, rendered.urgent, settings.lowDays, settings.needDays),
            });
          }
        }
      } catch (e) {
        problems.push(`${String(s.name || '').trim()}: ${(e as Error).message}`);
      }
    }

    if (problems.length) {
      messages.push(`⚠️ <b>Не удалось посчитать</b>\n${problems.map((p) => `• ${esc(p)}`).join('\n')}`);
    }
    if (!messages.length) messages.push('ЧЗ: за 7 дней заказов ФБС не было, в базе кодов нет.');

    // Сводка первым сообщением — чтобы срочное было видно в уведомлении.
    const header = urgentTotal > 0
      ? [
          `🚨 <b>Честный знак: ${urgentTotal} ${plural(urgentTotal, 'позиция', 'позиции', 'позиций')} закончится в ближайшие ${settings.lowDays} ${plural(settings.lowDays, 'день', 'дня', 'дней')}</b>`,
          '',
          ...urgentList,
        ].join('\n')
      : '✅ <b>Честный знак: запаса хватает</b>';
    const all = replyChat
      ? [header, ...messages]
      : isTest ? [`🧪 <b>Тестовая отправка</b>\n${header}`, ...messages] : [header, ...messages];

    if (replyChat && !dryRun) {
      await sendAll(settings.botToken, replyChat, all);
      return json({ ok: true, reply: isOwnerReply ? 'владелец' : 'поставщик', sent: all.length });
    }

    if (dryRun) {
      return json({
        ok: true,
        dryRun: true,
        chats: settings.chatIds.length,
        messages: all,
        // чаты поставщиков не показываем — только кому и что ушло бы
        supplierNotices: supplierNotices.map((n) => ({ name: n.name, text: n.text })),
      });
    }

    for (const chatId of settings.chatIds) {
      await sendAll(settings.botToken, chatId, all);
    }
    // Поставщикам — только в настоящем утреннем отчёте, не в тестовой отправке.
    const supplierResults: Array<{ name: string; ok: boolean; error?: string }> = [];
    if (!isTest) {
      for (const n of supplierNotices) {
        try {
          await sendToSupplier(settings.supplierBotTokens, n.chatId, n.text);
          supplierResults.push({ name: n.name, ok: true });
        } catch (e) {
          supplierResults.push({ name: n.name, ok: false, error: (e as Error).message });
        }
      }
      const failed = supplierResults.filter((r) => !r.ok);
      if (failed.length) {
        const text = `⚠️ <b>Не дошло поставщикам</b>\n${failed.map((f) => `• ${esc(f.name)}: ${esc(f.error || '')}`).join('\n')}`;
        for (const chatId of settings.chatIds) await sendTelegram(settings.botToken, chatId, text).catch(() => undefined);
      }
      await supabase.from('app_settings').upsert([{ key: 'chz_stock_report_last_v1', value: todayKey }], { onConflict: 'key' });
    }

    return json({ ok: true, sent: all.length, chats: settings.chatIds.length, urgent: urgentTotal, problems, suppliers: supplierResults });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
