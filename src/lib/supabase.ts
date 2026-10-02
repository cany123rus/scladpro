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
const PRIMARY_BASE = (() => {
  try { return new URL(supabaseUrl).origin; } catch { return supabaseUrl; }
})();

const FALLBACK_BASES = [
  'https://supabase-proxy-427900628011.europe-north1.run.app',
  'https://blygwkxjogmioebutiwn.supabase.co',
].filter((base) => base !== PRIMARY_BASE);

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

const requestUrlOf = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
};

/** Тот же запрос, но на другом хосте. Путь, параметры и тело не меняются. */
const rebaseInput = (input: RequestInfo | URL, base: string): RequestInfo | URL => {
  if (base === PRIMARY_BASE) return input;
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

const resilientFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const maxAttempts = 4;
  let lastError: any;

  if (Date.now() < supabaseDegradedUntilMs) {
    const waitMs = Math.min(1200, supabaseDegradedUntilMs - Date.now());
    if (waitMs > 0) await sleep(waitMs);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutMs = 35000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);

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
      // Сеть оборвалась дважды — дальше пробуем через запасной адрес.
      if (attempt >= 2) switchToNextBase();
      if (!isRetryableFetchError(err) || attempt >= maxAttempts) {
        throw err;
      }
      const backoff = 300 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      await sleep(backoff);
    }
  }

  throw lastError;
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: resilientFetch,
  },
});
