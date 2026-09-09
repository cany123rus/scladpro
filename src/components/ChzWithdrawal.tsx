import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { listCertificates, signDetachedBase64, type CertificateInfo } from '../utils/cades';
import {
  chzCheckCises,
  chzEnqueue,
  chzPoll,
  chzPrepareBatch,
  chzSaveConfig,
  chzSessionFinish,
  chzSessionStart,
  chzStatus,
  chzSubmitBatch,
  chzSyncWbStatuses,
  fetchChzDocuments,
  fetchChzQueue,
  type ChzDocumentRow,
  type ChzQueueRow,
  type ChzStatus,
} from '../utils/chzWithdrawal';
import { currentEmployeeName } from '../utils/fbsOrderCodes';

/**
 * Вывод кодов маркировки из оборота по продажам ФБС.
 *
 * Работа делится надвое: сервер знает, что выводить, и везёт это в ГИС МТ, а
 * подпись УКЭП делается здесь, в браузере — ключ не должен уезжать с
 * компьютера сотрудника. Поэтому на экране всего две подписи: вход в систему
 * (раз в смену) и сам документ.
 */

/** Как именно подписывается строка входа: перебираем, пока ГИС МТ не примет. */
type AuthSignMode = 'attached_text' | 'attached_asis' | 'detached_text' | 'detached_asis';

const AUTH_MODE_TITLES: Record<AuthSignMode, string> = {
  attached_text: 'прикреплённая, строка как текст',
  attached_asis: 'прикреплённая, строка как base64',
  detached_text: 'открепленная, строка как текст',
  detached_asis: 'открепленная, строка как base64',
};

const STATUS_TITLES: Record<string, string> = {
  pending: 'Готовы к выводу',
  blocked: 'Чужой владелец',
  retired: 'Уже выведены',
  sent: 'Отправлены, ГИС МТ проверяет',
  accepted: 'Выведены нами',
  rejected: 'Отказ',
};

const fmt = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const ChzWithdrawal = ({ supplierId, supplierName }: { supplierId: string; supplierName?: string }) => {
  const [status, setStatus] = useState<ChzStatus | null>(null);
  const [queue, setQueue] = useState<ChzQueueRow[]>([]);
  const [documents, setDocuments] = useState<ChzDocumentRow[]>([]);
  const [queueFilter, setQueueFilter] = useState('pending');

  const [certificates, setCertificates] = useState<CertificateInfo[] | null>(null);
  const [thumbprint, setThumbprint] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!supplierId) return;
    try {
      const [s, q, d] = await Promise.all([
        chzStatus(supplierId),
        fetchChzQueue(supplierId, queueFilter),
        fetchChzDocuments(supplierId),
      ]);
      setStatus(s);
      setQueue(q);
      setDocuments(d);
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось получить состояние' });
    }
  }, [supplierId, queueFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /*
   * Сертификаты читаем по кнопке, а не при открытии страницы.
   *
   * Обращение к хранилищу поднимает плагин и может спросить пин от токена —
   * делать это фоном, когда человек просто зашёл посмотреть очередь, нельзя.
   */
  const loadCertificates = async () => {
    setBusy('certs');
    setNotice(null);
    try {
      const list = await listCertificates();
      setCertificates(list);

      const inn = status?.inn || '';
      const mine = inn ? list.find((c) => c.inn === inn) : null;
      if (mine) {
        setThumbprint(mine.thumbprint);
        setNotice({ type: 'success', text: `Сертификат кабинета найден: ${mine.organization || mine.subject}` });
      } else if (list.length) {
        setNotice({
          type: 'error',
          text: `Среди сертификатов нет ни одного с ИНН ${inn || 'кабинета'}. Подписывать чужим ключом нельзя — вставьте нужный носитель.`,
        });
      } else {
        setNotice({ type: 'error', text: 'Действующих сертификатов не найдено. Вставьте носитель с ключом.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Плагин недоступен' });
    } finally {
      setBusy('');
    }
  };

  /*
   * Вход в ГИС МТ: подписываем присланную ими строку.
   *
   * Формат подписи их документация задаёт неоднозначно: строку можно понимать
   * и как обычный текст, и как уже закодированный base64, а подпись бывает
   * прикреплённой и открепленной. Ошибка на любой комбинации одна и та же —
   * «Подпись невалидна, код 2», — по ней не отличить неверный формат от
   * неверного ключа. Поэтому первый раз перебираем варианты и запоминаем тот,
   * который ГИС МТ принял: дальше вход идёт сразу правильным.
   */
  const signIn = async () => {
    if (!thumbprint) {
      setNotice({ type: 'error', text: 'Сначала выберите сертификат' });
      return;
    }
    setBusy('signin');
    setNotice(null);

    const known = status?.config.authSignMode;
    const modes: AuthSignMode[] = known
      ? [known]
      : ['attached_text', 'attached_asis', 'detached_text', 'detached_asis'];

    const errors: string[] = [];

    try {
      for (const mode of modes) {
        const detached = mode.startsWith('detached');
        // Строку либо кодируем сами, либо отдаём как есть — плагин ждёт base64
        // и раскодирует его в те байты, которые в итоге и подписываются.
        const challenge = await chzSessionStart(supplierId);
        const content = mode.endsWith('_text') ? btoa(challenge.data) : challenge.data;

        try {
          const signature = await signDetachedBase64(content, thumbprint, detached);
          const res = await chzSessionFinish(supplierId, challenge.uuid, signature);

          if (!known) await chzSaveConfig(supplierId, { authSignMode: mode });
          setNotice({
            type: 'success',
            text: `Вход выполнен, токен действует до ${fmt(res.expiresAt)}.`
              + (known ? '' : ` Формат подписи подобран: ${AUTH_MODE_TITLES[mode]} — запомнили.`),
          });
          await refresh();
          return;
        } catch (e: any) {
          errors.push(`${AUTH_MODE_TITLES[mode]}: ${e?.message || e}`);
        }
      }

      setNotice({
        type: 'error',
        text: `Ни один формат подписи не подошёл. ${errors.join(' · ')}`,
      });
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Вход не выполнен' });
    } finally {
      setBusy('');
    }
  };

  /** Обновить статусы заказов в WB и добрать очередь — то же, что делает суточная задача. */
  const refreshQueue = async () => {
    setBusy('queue');
    setNotice(null);
    try {
      const synced = await chzSyncWbStatuses(supplierId);
      const added = await chzEnqueue(supplierId);
      setNotice({
        type: 'success',
        text: `Статусы обновлены у ${synced.updated} заказов, в очередь добавлено ${added.added} кодов.`,
      });
      await refresh();
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось обновить очередь' });
    } finally {
      setBusy('');
    }
  };

  /** Собрать документ, подписать и отправить. Три шага, одно нажатие. */
  const sendBatch = async () => {
    if (!thumbprint) {
      setNotice({ type: 'error', text: 'Сначала выберите сертификат' });
      return;
    }
    setBusy('send');
    setNotice(null);
    try {
      const batch = await chzPrepareBatch(supplierId);
      setNotice({ type: 'info', text: `Документ на ${batch.codesCount} кодов собран, подпишите его на носителе…` });

      const signature = await signDetachedBase64(batch.base64, thumbprint);
      const sent = await chzSubmitBatch(supplierId, batch.documentId, signature, currentEmployeeName());

      setNotice({
        type: 'success',
        text: `Документ отправлен: ${sent.codesCount} кодов, номер в ГИС МТ ${sent.externalId}. Результат проверки придёт не сразу — нажмите «Проверить результат» через несколько минут.`,
      });
      await refresh();
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Отправка не удалась' });
      await refresh();
    } finally {
      setBusy('');
    }
  };

  /*
   * Спросить ГИС МТ, чьи это коды.
   *
   * Вывести из оборота может только владелец. По живой очереди видно, зачем
   * проверка: часть кодов числится за поставщиком — приёмка по УПД не
   * оформлена, — и без этой сверки они ушли бы в отправку и вернулись отказом.
   */
  const checkCises = async () => {
    setBusy('cises');
    setNotice(null);
    try {
      const res = await chzCheckCises(supplierId);
      const s = res.summary;
      setNotice({
        type: s.foreign || s.retired ? 'info' : 'success',
        text:
          `Проверено кодов: ${res.asked}. Ваши и в обороте — ${s.ours}.`
          + (s.foreign ? ` Числятся за другим владельцем — ${s.foreign}: их выводить нельзя, нужна приёмка по УПД.` : '')
          + (s.retired ? ` Уже выведены — ${s.retired}.` : ''),
      });
      await refresh();
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось проверить коды' });
    } finally {
      setBusy('');
    }
  };

  const poll = async () => {
    setBusy('poll');
    setNotice(null);
    try {
      const res = await chzPoll(supplierId);
      setNotice({
        type: res.checked.length ? 'success' : 'info',
        text: res.checked.length
          ? `Готовы результаты по ${res.checked.length} документам.`
          : 'ГИС МТ ещё проверяет — результата пока нет.',
      });
      await refresh();
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Не удалось получить результат' });
    } finally {
      setBusy('');
    }
  };

  if (!supplierId) {
    return (
      <div className="oc-card p-8 text-center text-slate-500">
        Вывод из оборота настроен только для кабинетов с заполненным ИНН.
      </div>
    );
  }

  const counts = status?.counts || {};
  const pending = counts.pending || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Вывод из оборота</h2>
          <p className="text-sm text-slate-500">
            Честный знак по продажам ФБС{supplierName ? ` • ${supplierName}` : ''}
            {status?.inn ? ` • ИНН ${status.inn}` : ''}
          </p>
        </div>
        <button onClick={refresh} className="ml-auto text-slate-400 hover:text-slate-600" title="Обновить">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {status && status.config.baseUrl.includes('sandbox') && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <b>Сейчас включена песочница ГИС МТ.</b> Документы уходят на тестовый контур и настоящие коды из оборота не
          выводят. Боевой адрес и точный тип документа задаются в настройке <code>chz_config_v1</code>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {(['pending', 'blocked', 'retired', 'sent', 'accepted', 'rejected'] as const).map((key) => (
          <div key={key} className="oc-card p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{STATUS_TITLES[key]}</div>
            <div
              className={`mt-1 text-[22px] font-bold tabular-nums ${
                (key === 'rejected' || key === 'blocked') && counts[key]
                  ? 'text-rose-600'
                  : key === 'accepted'
                    ? 'text-emerald-600'
                    : ''
              }`}
            >
              {counts[key] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Шаг 1: ключ */}
      <div className="oc-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Ключ и вход</h3>
          {status?.signedIn && (
            <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> вход в ГИС МТ выполнен
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadCertificates}
            disabled={Boolean(busy)}
            className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === 'certs' ? 'Читаем хранилище…' : 'Найти сертификат'}
          </button>

          {certificates && certificates.length > 0 && (
            <select
              value={thumbprint}
              onChange={(e) => setThumbprint(e.target.value)}
              className="oc-select min-w-[280px]"
            >
              <option value="">выберите сертификат</option>
              {certificates.map((c) => (
                <option key={c.thumbprint} value={c.thumbprint}>
                  {c.organization || c.subject.slice(0, 40)}
                  {c.inn ? ` · ИНН ${c.inn}` : ''} · до {new Date(c.validTo).toLocaleDateString('ru-RU')}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={signIn}
            disabled={Boolean(busy) || !thumbprint}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {busy === 'signin' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Войти в ГИС МТ
          </button>
        </div>

        <p className="text-[12px] text-slate-500">
          Вход подписывается один раз за смену — токен действует девять часов. Ключ остаётся на вашем компьютере: в
          Честный знак его никто не передаёт, подписывается только строка от них.
        </p>
      </div>

      {/* Шаг 2: очередь и отправка */}
      <div className="oc-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Очередь и отправка</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={refreshQueue}
            disabled={Boolean(busy)}
            className="px-3 py-2 text-sm rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 flex items-center gap-2"
            title="Спросить у WB статусы заказов и добрать в очередь проданное"
          >
            {busy === 'queue' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Обновить статусы и очередь
          </button>

          <button
            onClick={sendBatch}
            disabled={Boolean(busy) || !pending || !status?.signedIn}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
            title={status?.signedIn ? 'Собрать документ, подписать и отправить' : 'Сначала войдите в ГИС МТ'}
          >
            {busy === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Подписать и отправить ({Math.min(pending, status?.config.batchSize || 300)})
          </button>

          <button
            onClick={checkCises}
            disabled={Boolean(busy) || !status?.signedIn}
            className="px-3 py-2 text-sm rounded border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            title="Спросить у ГИС МТ, чьи это коды и не выведены ли они уже"
          >
            {busy === 'cises' ? 'Проверяем коды…' : 'Проверить коды в ГИС МТ'}
          </button>

          <button
            onClick={poll}
            disabled={Boolean(busy)}
            className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === 'poll' ? 'Спрашиваем…' : 'Проверить результат'}
          </button>
        </div>

        <p className="text-[12px] text-slate-500">
          Очередь пополняется сама раз в сутки. Отправку оставили за человеком: она требует подписи, а ключ лежит у вас,
          не на сервере.
        </p>
      </div>

      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Очередь */}
      <div className="oc-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <h3 className="font-semibold text-slate-900">Коды</h3>
          <select value={queueFilter} onChange={(e) => setQueueFilter(e.target.value)} className="oc-select ml-auto">
            <option value="">все</option>
            <option value="pending">готовы к выводу</option>
            <option value="blocked">чужой владелец</option>
            <option value="retired">уже выведены</option>
            <option value="sent">отправлены</option>
            <option value="accepted">выведены нами</option>
            <option value="rejected">отказ</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Заказ</th>
                <th className="px-3 py-2 font-medium">Код маркировки</th>
                <th className="px-3 py-2 font-medium">Продан</th>
                <th className="px-3 py-2 font-medium">Владелец кода</th>
                <th className="px-3 py-2 font-medium">Состояние</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    Пусто
                  </td>
                </tr>
              )}
              {queue.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{row.orderId}</td>
                  <td className="px-3 py-2 font-mono text-[11px] break-all text-slate-600">
                    {row.chzCode.length > 44 ? `${row.chzCode.slice(0, 44)}…` : row.chzCode}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">{fmt(row.soldAt)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.ownerName || <span className="text-slate-400">не проверяли</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        row.status === 'accepted'
                          ? 'text-emerald-600'
                          : row.status === 'rejected' || row.status === 'blocked'
                            ? 'text-rose-600'
                            : 'text-slate-600'
                      }
                    >
                      {STATUS_TITLES[row.status] || row.status}
                    </span>
                    {row.error && <div className="text-[11px] text-rose-600">{row.error}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Документы */}
      {documents.length > 0 && (
        <div className="oc-card p-4">
          <h3 className="font-semibold text-slate-900">Документы в ГИС МТ</h3>
          <div className="mt-3 space-y-1.5 text-[13px]">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center gap-3">
                <span className="text-slate-500">{fmt(doc.createdAt)}</span>
                <span className="font-mono text-[11px]">{doc.externalId || '—'}</span>
                <span>{doc.codesCount} кодов</span>
                <span
                  className={
                    doc.status === 'accepted'
                      ? 'text-emerald-600'
                      : doc.status === 'rejected'
                        ? 'text-rose-600'
                        : 'text-slate-500'
                  }
                >
                  {doc.status}
                </span>
                {doc.signedBy && <span className="text-slate-400">подписал {doc.signedBy}</span>}
                {doc.status === 'rejected' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChzWithdrawal;
