// Telegram → Claude chat bot (Supabase Edge Function, Deno).
// New dedicated bot. Whitelist-only. Keeps per-chat conversation history in app_settings.
//
// Required secrets (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY        - sk-ant-...  (Anthropic API key, billed separately)
//   TELEGRAM_CHAT_BOT_TOKEN  - token of the NEW bot from @BotFather
//   ALLOWED_CHAT_IDS         - comma-separated Telegram chat ids allowed to use the bot
//   TELEGRAM_WEBHOOK_SECRET  - random string; set as Telegram webhook secret_token
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - provided automatically by Supabase
//
// Set the webhook (once):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>&secret_token=<TELEGRAM_WEBHOOK_SECRET>

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const BOT_TOKEN = Deno.env.get('TELEGRAM_CHAT_BOT_TOKEN') ?? '';
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';
const ALLOWED_CHAT_IDS = (Deno.env.get('ALLOWED_CHAT_IDS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 4096;
const MAX_HISTORY_TURNS = 20; // keep last N user+assistant messages

const SYSTEM_PROMPT = `Ты — ассистент проекта ScladPro (учёт склада и поставок Wildberries: склады, поставки, паллеты, товары; стек React + Vite + Supabase + Telegram-боты).
Отвечай на русском, кратко и по делу. Если вопрос про код проекта — давай конкретные, практичные ответы.
Ты общаешься через Telegram, поэтому избегай длинных простыней: структурируй ответ, используй короткие абзацы.`;

type Msg = { role: 'user' | 'assistant'; content: string };

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

const historyKey = (chatId: number | string) => `claude_chat_history_${chatId}`;

async function loadHistory(chatId: number): Promise<Msg[]> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', historyKey(chatId))
    .maybeSingle();
  if (!data?.value) return [];
  try {
    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveHistory(chatId: number, history: Msg[]): Promise<void> {
  const trimmed = history.slice(-MAX_HISTORY_TURNS * 2);
  await supabase
    .from('app_settings')
    .upsert({ key: historyKey(chatId), value: JSON.stringify(trimmed) }, { onConflict: 'key' });
}

async function clearHistory(chatId: number): Promise<void> {
  await supabase.from('app_settings').delete().eq('key', historyKey(chatId));
}

async function sendTelegram(chatId: number, text: string): Promise<void> {
  // Telegram caps messages at 4096 chars; chunk if needed.
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000));
  for (const chunk of chunks.length ? chunks : ['(пустой ответ)']) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
  }
}

async function askClaude(history: Msg[]): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Cache the (stable) system prompt so repeated turns are cheaper.
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: history,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('Anthropic API error', resp.status, errText);
    throw new Error(`Anthropic ${resp.status}`);
  }

  const json = await resp.json();
  const text = (json?.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();
  return text || '(модель вернула пустой ответ)';
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('Claude chat bot is active');
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  // Verify the request really comes from Telegram (secret_token set on the webhook).
  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }

  const message = update?.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string = (message?.text ?? '').trim();

  // Always return 200 to Telegram so it doesn't retry; do work best-effort.
  if (!chatId || !text) return new Response('ok');

  try {
    // Whitelist enforcement.
    if (ALLOWED_CHAT_IDS.length && !ALLOWED_CHAT_IDS.includes(String(chatId))) {
      await sendTelegram(chatId, `Доступ запрещён. Ваш chat_id: ${chatId}\nПопросите администратора добавить его в список разрешённых.`);
      return new Response('ok');
    }

    if (text === '/start') {
      await sendTelegram(chatId, 'Привет! Я ассистент ScladPro на базе Claude. Просто напишите вопрос.\n\n/reset — очистить историю диалога.');
      return new Response('ok');
    }

    if (text === '/reset') {
      await clearHistory(chatId);
      await sendTelegram(chatId, 'История диалога очищена.');
      return new Response('ok');
    }

    if (!ANTHROPIC_API_KEY) {
      await sendTelegram(chatId, 'Бот не настроен: отсутствует ANTHROPIC_API_KEY.');
      return new Response('ok');
    }

    const history = await loadHistory(chatId);
    history.push({ role: 'user', content: text });

    const answer = await askClaude(history);
    history.push({ role: 'assistant', content: answer });

    await saveHistory(chatId, history);
    await sendTelegram(chatId, answer);
  } catch (e) {
    console.error('handler error', e);
    try {
      await sendTelegram(chatId, 'Произошла ошибка при обработке запроса. Попробуйте позже.');
    } catch { /* ignore */ }
  }

  return new Response('ok');
});
