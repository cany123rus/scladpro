import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { pushSupported, isPushSubscribed, subscribeToPush, unsubscribeFromPush, sendPush, getPushPermission } from '../utils/push';

// Кнопка включения/выключения push-уведомлений на этом устройстве.
export default function PushToggle({ className = '' }: { className?: string }) {
  const [supported] = useState(() => pushSupported());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const employeeId = (() => {
    try {
      const raw = localStorage.getItem('current_employee');
      return raw ? String(JSON.parse(raw)?.id || '') : '';
    } catch { return ''; }
  })();

  useEffect(() => {
    if (!supported) return;
    isPushSubscribed().then(setSubscribed).catch(() => setSubscribed(false));
  }, [supported]);

  if (!supported) return null;

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        const res = await subscribeToPush(employeeId);
        if (!res.ok) {
          const perm = getPushPermission();
          alert(perm === 'denied'
            ? 'Уведомления заблокированы в настройках браузера. Разрешите их для сайта и попробуйте снова.'
            : `Не удалось включить уведомления: ${res.reason || ''}`);
          setSubscribed(false);
        } else {
          setSubscribed(true);
          // Тестовый пуш самому себе — подтверждение, что всё работает.
          sendPush({ title: 'Уведомления включены ✅', body: 'Теперь вы будете получать оповещения', url: '/', target: employeeId ? [employeeId] : undefined }).catch(() => undefined);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? BellRing : subscribed ? Bell : BellOff;
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-xl border transition-colors disabled:opacity-50 ${subscribed ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'} ${className}`}
      title={subscribed ? 'Уведомления включены — выключить' : 'Включить push-уведомления'}
      aria-label="Push-уведомления"
      data-no-invert
    >
      <Icon className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`} />
    </button>
  );
}
