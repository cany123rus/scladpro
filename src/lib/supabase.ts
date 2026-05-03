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

        const response = await fetch(input, {
          ...init,
          signal: mergedSignal,
        });

        // Retry only transient server/network-like states
        if ([408, 425, 429, 500, 502, 503, 504, 520, 522, 524].includes(response.status) && attempt < maxAttempts) {
          consecutiveSupabaseFailures += 1;
          if (consecutiveSupabaseFailures >= 6) {
            supabaseDegradedUntilMs = Date.now() + 45_000;
          }
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
