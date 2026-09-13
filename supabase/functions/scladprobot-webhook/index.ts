/**
 * Вебхук основного бота @scladprobot.
 *
 * 1. Кнопка «📊 Запросить остаток ЧЗ»: отвечаем отчётом по честному знаку —
 *    владельцу по всем кабинетам, поставщику по его. Считает chz-stock-report
 *    (тот же расчёт, что в утреннем отчёте); вебхук только принимает нажатие и
 *    сразу отвечает Telegram, а отчёт собирается в фоне — иначе Telegram ждал бы
 *    минуту и слал нажатие повторно.
 * 2. Каждое входящее сообщение кладём в public.telegram_updates. Раньше сайт
 *    читал их сам через getUpdates (импорт кодов ЧЗ из Telegram, проверка бота
 *    печати), а при вебхуке Telegram getUpdates отключает.
 *
 * Запрос от Telegram проверяем по секрету из app_settings
 * `scladprobot_webhook_secret` (заголовок X-Telegram-Bot-Api-Secret-Token).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const CHZ_BUTTON = '📊 Запросить остаток ЧЗ';
const KEYBOARD = { keyboard: [[{ text: CHZ_BUTTON }]], resize_keyboard: true, is_persistent: true };
const COOLDOWN_MS = 60_000;

let cached: { token: string; secret: string; at: number } | null = null;
async function settings() {
  if (cached && Date.now() - cached.at < 60_000) return cached;
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['telegram_bot_token', 'scladprobot_webhook_secret']);
  const map = new Map((data || []).map((r: any) => [r.key, String(r.value ?? '').trim()]));
  cached = { token: map.get('telegram_bot_token') || '', secret: map.get('scladprobot_webhook_secret') || '', at: Date.now() };
  return cached;
}

async function send(token: string, chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: KEYBOARD }),
  }).catch(() => undefined);
}

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  const { token, secret } = await settings();
  if (!secret || req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== secret) {
    return new Response('forbidden', { status: 403 });
  }

  let update: any;
  try { update = await req.json(); } catch { return new Response('ok'); }

  const message = update?.message || update?.edited_message;
  if (!message?.chat?.id) return new Response('ok');
  const chatId = String(message.chat.id);
  const text = String(message.text || '').trim();

  // Сохраняем для сайта (импорт файлов из Telegram) — в том виде, что давал getUpdates.
  await supabase
    .from('telegram_updates')
    .upsert([{ update_id: Number(update.update_id), chat_id: chatId, message }], { onConflict: 'update_id' });

  // Изредка чистим старьё: сайту нужны только свежие сообщения.
  if (Math.random() < 0.02) {
    await supabase.from('telegram_updates').delete().lt('created_at', new Date(Date.now() - 60 * 86_400_000).toISOString());
  }

  if (text === '/start' || text === '/menu') {
    await send(token, chatId, 'Нажмите «Запросить остаток ЧЗ», чтобы узнать, сколько честного знака осталось и на сколько дней хватит.');
    return new Response('ok');
  }

  if (text === CHZ_BUTTON || /^\/?(остаток|chz|чз)$/i.test(text)) {
    // Не чаще раза в минуту на чат: отчёт ходит в WB по всем кабинетам.
    const since = new Date(Date.now() - COOLDOWN_MS).toISOString();
    const { data: recent } = await supabase
      .from('telegram_updates')
      .select('update_id, message')
      .eq('chat_id', chatId)
      .gte('created_at', since)
      .neq('update_id', Number(update.update_id));
    const pressedRecently = (recent || []).some((r: any) => String(r?.message?.text || '').trim() === CHZ_BUTTON);
    if (pressedRecently) {
      await send(token, chatId, 'Отчёт уже собирается — подождите минуту.');
      return new Response('ok');
    }

    await send(token, chatId, 'Считаю остаток честного знака… Это займёт до минуты.');
    const job = fetch(`${SUPABASE_URL}/functions/v1/chz-stock-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ replyTo: { chatId } }),
    })
      .then(async (r) => {
        if (!r.ok) await send(token, chatId, 'Не получилось собрать отчёт, попробуйте позже.');
      })
      .catch(() => send(token, chatId, 'Не получилось собрать отчёт, попробуйте позже.'));

    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(job);
    else await job;
    return new Response('ok');
  }

  return new Response('ok');
});
