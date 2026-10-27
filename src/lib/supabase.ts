import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://blygwkxjogmioebutiwn.supabase.co';

const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_kSk_B3Y6eN5P9sCVk67-cg_uSGedHJX';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_CONCURRENT_SUPABASE_FETCH = 4;
let activeSupabaseFetches = 0;
const supabaseFetchQueue: Array<() => void> = [];
let consecutiveSupabaseFailures = 0;
let supabaseDegradedUntilMs = 0;

const acquireSupabaseFetchSlot = async () => {
  if (activeSupabaseFetches < MAX_CONCURRENT_SUPABASE_FETCH) {
    activeSupabaseFetches += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    supabaseFetchQueue.push(() => {
      activeSupabaseFetches += 1;
      resolve();
    });
  });
};

const releaseSupabaseFetchSlot = () => {
  activeSupabaseFetches = Math.max(0, activeSupabaseFetches - 1);
  const next = supabaseFetchQueue.shift();
  if (next) next();
};

const isRetryableFetchError = (err: any) => {
  const msg = String(err?.message || err || '').toLowerCase();
  const name = String(err?.name || '').toLowerCase();
  return (
    name.includes('aborterror') ||
    msg.includes('signal is aborted') ||
    msg.includes('aborted without reason') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('err_connection_reset') ||
    msg.includes('load failed') ||
    msg.includes('network request failed')
  );
};

const emitConnectionEvent = (type: 'issue' | 'ok', detail?: any) => {
  if (typeof window === 'undefined') return;
  const name = type === 'issue' ? 'supabase:connection-issue' : 'supabase:connection-ok';
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

/*
 * Запасные пути к базе.
 *
 * Прод ходит через Cloudflare-воркер (sb.scladpro.ru) — он дешевле и быстрее
 * прокси на Cloud Run. Но путь до базы у каждого провайдера свой: если воркер
 * на чьей-то сети режут, сайт оставался без данных. Теперь после двух
 * неудачных попыток подряд те же запросы идут через запасной адрес, а через
 * десять минут клиент снова пробует основной.
 */
/*
 * Данные и реалтайм ходят разными дорогами — так дешевле.
 *
 * Вебсокет Realtime висит часами, а Cloud Run считает открытое соединение
 * активным запросом: из 490 часов работы прокси за месяц почти все —
 * вебсокеты (медиана длительности запроса 20 секунд, 95-я перцентиль 197).
 * У Cloudflare такие соединения бесплатны, поэтому реалтайм оставляем ему
 * (адрес клиента), а запросы данных шлём на Cloud Run (VITE_SUPABASE_REST_URL)
 * — он доступен там, где у Cloudflare не ходит QUIC. Счёт выходит рублёвый:
 * данные — это короткие запросы по сотне-другой миллисекунд.
 */
const restUrl =
  (import.meta as any).env?.VITE_SUPABASE_REST_URL || supabaseUrl;

const PRIMARY_BASE = (() => {
  try { return new URL(restUrl).origin; } catch { return restUrl; }
})();

const FALLBACK_BASES = [
  (() => { try { return new URL(supabaseUrl).origin; } catch { return supabaseUrl; } })(),
  'https://supabase-proxy-427900628011.europe-north1.run.app',
  'https://blygwkxjogmioebutiwn.supabase.co',
].filter((base, index, all) => base !== PRIMARY_BASE && all.indexOf(base) === index);

const BASE_STICKY_MS = 10 * 60_000;
let activeFallbackIndex = -1;
let fallbackSwitchedAtMs = 0;

const currentBase = () => {
  if (activeFallbackIndex < 0) return PRIMARY_BASE;
  if (Date.now() - fallbackSwitchedAtMs > BASE_STICKY_MS) {
    activeFallbackIndex = -1;
    return PRIMARY_BASE;
  }
  return FALLBACK_BASES[activeFallbackIndex];
};

const switchToNextBase = () => {
  if (!FALLBACK_BASES.length) return;
  if (activeFallbackIndex >= FALLBACK_BASES.length - 1) return;
  activeFallbackIndex += 1;
  fallbackSwitchedAtMs = Date.now();
  emitConnectionEvent('issue', { base: FALLBACK_BASES[activeFallbackIndex], switched: true });
};

/*
 * Выбор пути при старте.
 *
 * Ждать провалов, чтобы понять, что основной адрес недоступен, дорого: на
 * айфоне из-за границы запрос к Cloudflare висел двадцать секунд, а запасной
 * отвечал за полсекунды. Поэтому при первом же обращении пингуем все адреса
 * разом и берём тот, который ответил. Основной предпочитаем: если он живой,
 * остаёмся на нём.
 */
let basePickPromise: Promise<void> | null = null;

const probeBase = (base: string, timeoutMs: number) => new Promise<string | null>((resolve) => {
  if (typeof fetch !== 'function') return resolve(null);
  const ctrl = new AbortController();
  const timer = setTimeout(() => { ctrl.abort(); resolve(null); }, timeoutMs);
  fetch(`${base}/rest/v1/`, { headers: { apikey: supabaseKey }, signal: ctrl.signal })
    .then((res) => { clearTimeout(timer); resolve(res.status < 500 ? base : null); })
    .catch(() => { clearTimeout(timer); resolve(null); });
});

const BASE_PICK_KEY = 'sb_base_pick_v1';

/**
 * Выбор пути помним десять минут — на все вкладки и перезагрузки страницы.
 * Каждая новая вкладка раньше слала по пробному запросу на все адреса, включая
 * Cloud Run, за который платят по числу запросов; выбранный путь живёт столько
 * же, сколько и ручное переключение на запасной (BASE_STICKY_MS).
 */
const readRememberedPick = (): number | null | undefined => {
  try {
    const raw = localStorage.getItem(BASE_PICK_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { index?: number; at?: number };
    if (!parsed || typeof parsed.at !== 'number' || Date.now() - parsed.at > BASE_STICKY_MS) return undefined;
    return typeof parsed.index === 'number' ? parsed.index : null;
  } catch {
    return undefined;
  }
};

const rememberPick = (index: number | null) => {
  try { localStorage.setItem(BASE_PICK_KEY, JSON.stringify({ index, at: Date.now() })); } catch { /* без хранилища проверим при следующем заходе */ }
};

const pickBaseOnce = () => {
  if (basePickPromise) return basePickPromise;
  const remembered = readRememberedPick();
  if (remembered !== undefined) {
    if (typeof remembered === 'number' && remembered >= 0 && remembered < FALLBACK_BASES.length) {
      activeFallbackIndex = remembered;
      fallbackSwitchedAtMs = Date.now();
    }
    basePickPromise = Promise.resolve();
    return basePickPromise;
  }
  if (!FALLBACK_BASES.length) {
    basePickPromise = Promise.resolve();
    return basePickPromise;
  }

  basePickPromise = (async () => {
    const primary = probeBase(PRIMARY_BASE, 4000);
    const others = FALLBACK_BASES.map((base, index) => probeBase(base, 4000).then((ok) => (ok ? index : null)));

    // Основной адрес успел ответить — ничего не меняем.
    const primaryOk = await Promise.race([primary, sleep(1500).then(() => null)]);
    if (primaryOk) { rememberPick(null); return; }

    const winner = await Promise.race([
      ...others.map(async (p) => { const i = await p; return i === null ? new Promise<number>(() => {}) : i; }),
      sleep(4000).then(() => null),
    ]);
    if (typeof winner === 'number') {
      activeFallbackIndex = winner;
      fallbackSwitchedAtMs = Date.now();
      rememberPick(winner);
      emitConnectionEvent('issue', { base: FALLBACK_BASES[winner], picked: true });
    }
  })();

  return basePickPromise;
};

const requestUrlOf = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
};

/**
 * Тот же запрос, но на выбранном хосте. Путь, параметры и тело не меняются.
 *
 * Адрес переписываем всегда, а не только для запасных: клиент собирает ссылки
 * от своего адреса (там живёт реалтайм), а данные ходят на свой.
 */
const rebaseInput = (input: RequestInfo | URL, base: string): RequestInfo | URL => {
  try {
    if (new URL(requestUrlOf(input)).origin === base) return input;
  } catch {
    return input;
  }
  try {
    const target = new URL(requestUrlOf(input));
    const next = new URL(base);
    target.protocol = next.protocol;
    target.host = next.host;
    if (typeof input === 'string' || input instanceof URL) return target.toString();
    return new Request(target.toString(), input as Request);
  } catch {
    return input;
  }
};

/*
 * Сколько ждать ответа на каждой попытке.
 *
 * 02.10 на айфоне запрос к Cloudflare висел ровно 20 секунд и отваливался по
 * таймауту, хотя запасной адрес отвечал за полсекунды (у оператора не ходит
 * QUIC до Cloudflare). С одним общим таймаутом в 35 секунд переключение на
 * запасной путь занимало больше минуты — для человека это «сайт не грузит».
 * Поэтому первая попытка короткая: лучше быстро попробовать другой путь.
 */
const attemptTimeoutMs = (attempt: number) => (attempt === 1 ? 9000 : attempt === 2 ? 18000 : 35000);

const resilientFetchCore: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const maxAttempts = 4;
  let lastError: any;

  if (Date.now() < supabaseDegradedUntilMs) {
    const waitMs = Math.min(1200, supabaseDegradedUntilMs - Date.now());
    if (waitMs > 0) await sleep(waitMs);
  }

  // Первый запрос ждёт выбора пути, но не дольше полутора секунд.
  await Promise.race([pickBaseOnce(), sleep(1500)]);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), attemptTimeoutMs(attempt));

      try {
        await acquireSupabaseFetchSlot();
        const timeoutSignal = controller.signal;
        const externalSignal = init?.signal;
        const mergedSignal = externalSignal
          ? (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).any === 'function'
              ? (AbortSignal as any).any([externalSignal, timeoutSignal])
              : timeoutSignal)
          : timeoutSignal;

        const response = await fetch(rebaseInput(input, currentBase()), {
          ...init,
          signal: mergedSignal,
        });

        // Retry only transient server/network-like states
        if ([408, 425, 429, 500, 502, 503, 504, 520, 522, 524].includes(response.status) && attempt < maxAttempts) {
          consecutiveSupabaseFailures += 1;
          if (consecutiveSupabaseFailures >= 6) {
            supabaseDegradedUntilMs = Date.now() + 45_000;
          }
          // Два провала подряд — пробуем запасной адрес, а не долбимся в тот же.
          if (attempt >= 2) switchToNextBase();
          emitConnectionEvent('issue', { status: response.status, attempt });
          const backoff = 300 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
          await sleep(backoff);
          continue;
        }

        if (response.ok) {
          consecutiveSupabaseFailures = 0;
          supabaseDegradedUntilMs = 0;
          emitConnectionEvent('ok');
        } else if ([408, 425, 429, 500, 502, 503, 504, 520, 522, 524].includes(response.status)) {
          consecutiveSupabaseFailures += 1;
          if (consecutiveSupabaseFailures >= 6) {
            supabaseDegradedUntilMs = Date.now() + 45_000;
          }
          emitConnectionEvent('issue', { status: response.status, attempt });
        }

        return response;
      } finally {
        clearTimeout(timer);
        releaseSupabaseFetchSlot();
      }
    } catch (err) {
      lastError = err;
      consecutiveSupabaseFailures += 1;
      if (consecutiveSupabaseFailures >= 6) {
        supabaseDegradedUntilMs = Date.now() + 45_000;
      }
      emitConnectionEvent('issue', { error: String((err as any)?.message || err), attempt });
      /*
       * Сеть или таймаут — меняем адрес сразу, с первой же неудачи.
       *
       * Ошибка пути не лечится повтором в тот же хост: если до Cloudflare у
       * этого оператора не достучаться, второй такой же запрос только съест
       * ещё девять секунд. Серверные 5xx — другое дело, они лечатся повтором,
       * и там переключение по-прежнему со второй попытки.
       */
      switchToNextBase();
      if (!isRetryableFetchError(err) || attempt >= maxAttempts) {
        throw err;
      }
      const backoff = 300 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      await sleep(backoff);
    }
  }

  throw lastError;
};

/*
 * Одинаковые запросы чтения, идущие одновременно, — один запрос на всех.
 *
 * Раздел при открытии просит одни и те же справочники из нескольких мест
 * (ставки, поставщики, настройки), и каждый такой запрос — отдельный платный
 * запрос через прокси. Пока первый ещё в пути, остальные берут его ответ.
 * Это не кэш: как только ответ пришёл, следующий запрос идёт в базу заново,
 * поэтому данные не «залёживаются». Запросы с телом и с собственным abort
 * не трогаем: отмена одного не должна ронять соседей.
 */
const inflightReads = new Map<string, Promise<Response>>();

const readKeyOf = (input: RequestInfo | URL, init?: RequestInit): string | null => {
  if (typeof input !== 'string' && !(input instanceof URL)) return null;
  const method = String(init?.method || 'GET').toUpperCase();
  if (method !== 'GET' || init?.body || init?.signal) return null;
  const headers = Array.from(new Headers(init?.headers || {}).entries())
    .map(([k, v]) => `${k.toLowerCase()}:${v}`)
    .sort()
    .join('|');
  return `${String(input)}#${headers}`;
};

const resilientFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const key = readKeyOf(input, init);
  if (!key) return resilientFetchCore(input, init);

  let shared = inflightReads.get(key);
  if (!shared) {
    shared = resilientFetchCore(input, init);
    const created = shared;
    const done = () => { if (inflightReads.get(key) === created) inflightReads.delete(key); };
    created.then(done, done);
    inflightReads.set(key, created);
  }
  // Каждому читателю — своя копия: тело ответа читается один раз.
  return shared.then((res) => res.clone());
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: resilientFetch,
  },
});
