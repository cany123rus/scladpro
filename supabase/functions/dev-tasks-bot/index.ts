// Telegram → dev_tasks inbox (Supabase Edge Function, Deno).
// Принимает задачи по проекту из Telegram и кладёт их в таблицу public.dev_tasks.
// Реальную работу делает агент (Claude Code) на компьютере: читает new-задачи,
// выполняет, пишет result/status. Пользователь смотрит статусы командой /list.
//
// Секреты (Supabase → Edge Functions → Secrets):
//   TELEGRAM_TASK_BOT_TOKEN     - токен бота от @BotFather
//   TELEGRAM_TASK_WEBHOOK_SECRET- случайная строка (ставится как secret_token вебхука)
//   ALLOWED_TASK_CHAT_IDS       - разрешённые chat_id через запятую
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - подставляет Supabase
//
// Вебхук (один раз):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>&secret_token=<TELEGRAM_TASK_WEBHOOK_SECRET>

import { createClient } from 'jsr:@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_TASK_BOT_TOKEN') ?? Deno.env.get('TELEGRAM_CHAT_BOT_TOKEN') ?? '';
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_TASK_WEBHOOK_SECRET') ?? '';
const ALLOWED_CHAT_IDS = (Deno.env.get('ALLOWED_TASK_CHAT_IDS') ?? Deno.env.get('ALLOWED_CHAT_IDS') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

const STATUS_EMOJI: Record<string, string> = { new: '🆕', in_progress: '⏳', done: '✅', rejected: '🚫' };

async function sendTelegram(chatId: number | string, text: string): Promise<void> {
  for (let i = 0; i < text.length || i === 0; i += 4000) {
    const chunk = text.slice(i, i + 4000) || '(пусто)';
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
    if (text.length <= 4000) break;
  }
}

async function listTasks(chatId: number): Promise<string> {
  const { data, error } = await supabase
    .from('dev_tasks')
    .select('id, text, status, result, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return `Ошибка чтения задач: ${error.message}`;
  if (!data || !data.length) return 'Задач пока нет. Просто пришлите текст задачи.';
  return data.map((t: any) => {
    const em = STATUS_EMOJI[t.status] || '•';
    const head = `${em} #${t.id} [${t.status}] ${String(t.text || '').slice(0, 120)}`;
    const res = t.result ? `\n   ↳ ${String(t.result).slice(0, 300)}` : '';
    return head + res;
  }).join('\n\n');
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('dev-tasks bot active');
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  let update: any;
  try { update = await req.json(); } catch { return new Response('bad request', { status: 400 }); }

  const message = update?.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string = (message?.text ?? '').trim();
  if (!chatId || !text) return new Response('ok');

  try {
    if (ALLOWED_CHAT_IDS.length && !ALLOWED_CHAT_IDS.includes(String(chatId))) {
      await sendTelegram(chatId, `Доступ запрещён. Ваш chat_id: ${chatId}\nДобавьте его в ALLOWED_TASK_CHAT_IDS.`);
      return new Response('ok');
    }

    if (text === '/start') {
      await sendTelegram(chatId, 'Привет! Это очередь задач по проекту ScladPro.\n\nПросто пришлите текст задачи — она попадёт в список, и я выполню её на компьютере.\n\n/list — статусы последних задач.');
      return new Response('ok');
    }

    if (text === '/list' || text === '/tasks') {
      await sendTelegram(chatId, await listTasks(chatId));
      return new Response('ok');
    }

    // Любой другой текст = новая задача.
    const taskText = text.replace(/^\/task\s+/i, '').trim() || text;
    const { data, error } = await supabase
      .from('dev_tasks')
      .insert({ chat_id: String(chatId), text: taskText, status: 'new' })
      .select('id')
      .single();
    if (error) throw error;
    await sendTelegram(chatId, `✅ Задача #${data?.id} принята. Выполню на компьютере.\nСтатус — /list`);
  } catch (e) {
    console.error('dev-tasks-bot error', e);
    try { await sendTelegram(chatId, 'Ошибка при сохранении задачи. Попробуйте ещё раз.'); } catch { /* ignore */ }
  }

  return new Response('ok');
});
