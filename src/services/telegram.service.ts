import { supabase } from '../lib/supabase';

export type TelegramParseMode = 'Markdown' | 'MarkdownV2' | 'HTML';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

const createFormData = (data: Record<string, string | Blob | File>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

const request = async <T = any>(token: string, method: string, body?: BodyInit) => {
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram API ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
};

export const telegramService = {
  /**
   * Последние входящие сообщения основного бота — в том виде, что отдавал getUpdates.
   *
   * У бота вебхук (кнопка «Запросить остаток ЧЗ»), а при вебхуке Telegram
   * getUpdates не отдаёт. Вебхук scladprobot-webhook складывает сообщения в
   * таблицу telegram_updates — читаем оттуда. Токен больше не нужен, параметр
   * оставлен, чтобы не менять вызовы.
   */
  async getUpdates(_token: string, limit = 100) {
    const { data, error } = await supabase
      .from('telegram_updates')
      .select('update_id, message')
      .order('update_id', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, description: error.message, result: [] };
    return { ok: true, result: (data || []).slice().reverse() };
  },

  getFile(token: string, fileId: string) {
    return fetch(`${TELEGRAM_API_BASE}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`).then((r) => r.json());
  },

  getFileDownloadUrl(token: string, filePath: string) {
    return `${TELEGRAM_API_BASE}/file/bot${token}/${filePath}`;
  },

  sendMessage(token: string, chatId: string | number, text: string, parseMode?: TelegramParseMode) {
    const payload: Record<string, string> = {
      chat_id: String(chatId),
      text,
    };
    if (parseMode) payload.parse_mode = parseMode;

    return request(token, 'sendMessage', createFormData(payload));
  },

  sendDocument(token: string, chatId: string | number, document: Blob | File, filename = 'file.txt', caption?: string) {
    const formData = createFormData({
      chat_id: String(chatId),
      document: document instanceof File ? document : new File([document], filename),
    });
    if (caption) formData.append('caption', caption);
    return request(token, 'sendDocument', formData);
  },

  sendPhoto(token: string, chatId: string | number, photo: Blob | File, caption?: string) {
    const formData = createFormData({
      chat_id: String(chatId),
      photo,
    });
    if (caption) formData.append('caption', caption);
    return request(token, 'sendPhoto', formData);
  },
};
