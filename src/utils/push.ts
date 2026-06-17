import { supabase } from '../lib/supabase';

// Публичный VAPID-ключ (можно держать в коде — он публичный). Приватный — только в Edge Function.
export const VAPID_PUBLIC_KEY = 'BGIt69Tfm0uZrx0O_Mg-WDAOf67LmYZN6dACYocxfX2g0OiaJFYqziKp4AuwSzFs22gg4u4hIMqdyguysZKVaaE';

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

export const getPushPermission = (): NotificationPermission =>
  (pushSupported() ? Notification.permission : 'denied');

// Подписать текущее устройство на пуши и сохранить подписку в БД для сотрудника.
export const subscribeToPush = async (employeeId?: string | null): Promise<{ ok: boolean; reason?: string }> => {
  if (!pushSupported()) return { ok: false, reason: 'Браузер не поддерживает push-уведомления' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'Уведомления не разрешены' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json: any = sub.toJSON();
  const row = {
    employee_id: employeeId || null,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    user_agent: navigator.userAgent,
    last_seen: new Date().toISOString(),
  };

  const { error } = await supabase.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
};

// Отписать текущее устройство.
export const unsubscribeFromPush = async (): Promise<void> => {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  try { await sub.unsubscribe(); } catch {}
  try { await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint); } catch {}
};

export const isPushSubscribed = async (): Promise<boolean> => {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
};

// Отправить пуш через Edge Function. target: 'all' | массив employee_id.
export const sendPush = async (payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  target?: 'all' | string[];
}): Promise<{ ok: boolean; sent?: number; reason?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('push-send', { body: payload });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, sent: (data as any)?.sent };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'Не удалось отправить' };
  }
};
