export type WarehouseOfflineStatus = {
  ok: boolean;
  mode?: string;
  version?: number;
  updatedAt?: string | null;
  pendingScans?: number;
  syncedScans?: number;
  conflicts?: number;
  error?: string;
};

export type WarehouseOfflineSnapshot = {
  createdAt: string;
  suppliers: unknown[];
  wbProducts: unknown[];
  modelNumbers: Record<string, string>;
  labelLayout?: unknown;
  fboSupplies: unknown[];
  fboBoxes: unknown[];
  honestSignSeen: string[];
};

const OFFLINE_URL_KEY = 'warehouse_offline_server_url_v1';
const OFFLINE_ENABLED_KEY = 'warehouse_offline_enabled_v1';
const OFFLINE_TOKEN_KEY = 'warehouse_offline_token_v1';
const FALLBACK_OFFLINE_URL = 'http://localhost:8787';
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;

export const getWarehouseOfflineToken = () => String(localStorage.getItem(OFFLINE_TOKEN_KEY) || '').trim();
export const setWarehouseOfflineToken = (token: string) => {
  const clean = String(token || '').trim();
  if (clean) localStorage.setItem(OFFLINE_TOKEN_KEY, clean);
  else localStorage.removeItem(OFFLINE_TOKEN_KEY);
};

const isLoopbackOfflineUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

export const getDefaultWarehouseOfflineUrl = () => {
  try {
    if (typeof window === 'undefined') return FALLBACK_OFFLINE_URL;

    const { origin, protocol, hostname, port } = window.location;
    const isHttp = protocol === 'http:' || protocol === 'https:';
    const isLoopbackHost = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

    if (isHttp && port === '8787' && !isLoopbackHost) {
      return origin;
    }
  } catch {
    // Keep localhost as the safe desktop default.
  }

  return FALLBACK_OFFLINE_URL;
};

export const getWarehouseOfflineUrl = () => {
  const saved = String(localStorage.getItem(OFFLINE_URL_KEY) || '').trim();
  const currentDefault = getDefaultWarehouseOfflineUrl();

  if (currentDefault !== FALLBACK_OFFLINE_URL && (!saved || isLoopbackOfflineUrl(saved))) {
    return currentDefault;
  }

  return saved || currentDefault;
};

export const setWarehouseOfflineUrl = (url: string) => {
  const normalized = String(url || '').trim().replace(/\/+$/, '');
  localStorage.setItem(OFFLINE_URL_KEY, normalized || getDefaultWarehouseOfflineUrl());
};

export const isWarehouseOfflineEnabled = () => {
  return localStorage.getItem(OFFLINE_ENABLED_KEY) === '1';
};

export const setWarehouseOfflineEnabled = (enabled: boolean) => {
  localStorage.setItem(OFFLINE_ENABLED_KEY, enabled ? '1' : '0');
};

class OfflineStaleSnapshotError extends Error {
  version?: number;
  constructor(message: string, version?: number) {
    super(message);
    this.name = 'OfflineStaleSnapshotError';
    this.version = version;
  }
}
export { OfflineStaleSnapshotError };

const request = async <T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS): Promise<T> => {
  const baseUrl = getWarehouseOfflineUrl();
  const token = getWarehouseOfflineToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-warehouse-token': token } : {}),
        ...(init.headers || {}),
      },
    });
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === 'AbortError') throw new Error(`Локальный сервер не ответил за ${Math.round(timeoutMs / 1000)} с`);
    throw e;
  }
  clearTimeout(timer);
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 409) throw new OfflineStaleSnapshotError(body?.error || 'Offline snapshot устарел', body?.version);
    throw new Error(body?.error || `Offline server error: ${res.status}`);
  }
  return body as T;
};

export const warehouseOfflineClient = {
  async health() {
    // Health must respond fast so the UI badge does not hang on a dead server.
    return request<WarehouseOfflineStatus>('/api/warehouse-offline/health', {}, 4000);
  },

  async getSnapshot() {
    return request<WarehouseOfflineSnapshot | null>('/api/warehouse-offline/snapshot', {}, 20000);
  },

  // baseVersion: the version the client last saw. The server rejects (409) if it
  // changed meanwhile, preventing one tab from clobbering a newer snapshot.
  async saveSnapshot(snapshot: WarehouseOfflineSnapshot, baseVersion?: number) {
    return request<{ ok: true; updatedAt: string; version: number }>('/api/warehouse-offline/snapshot', {
      method: 'POST',
      body: JSON.stringify(baseVersion != null ? { ...snapshot, __baseVersion: baseVersion } : snapshot),
    }, 20000);
  },

  async enqueueFboScan(scan: unknown) {
    return request<{ ok: true; id: string }>('/api/warehouse-offline/fbo-scans', {
      method: 'POST',
      body: JSON.stringify(scan),
    });
  },

  async getFboScans() {
    return request<{ pending: unknown[]; synced: unknown[]; conflicts: unknown[] }>('/api/warehouse-offline/fbo-scans');
  },

  async markFboScansSynced(ids: string[]) {
    return request<{ ok: true; synced: number }>('/api/warehouse-offline/fbo-scans/mark-synced', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  async deleteFboScansByBox(boxId: string) {
    return request<{ ok: true; deleted: number }>('/api/warehouse-offline/fbo-scans/delete-box', {
      method: 'POST',
      body: JSON.stringify({ boxId }),
    });
  },

  // Move pending scans that could not be inserted (e.g. server rejected the row)
  // into the conflicts bucket so they are not retried blindly.
  async moveFboScansToConflicts(rows: Array<{ id: string; error?: string }>) {
    return request<{ ok: true; moved: number }>('/api/warehouse-offline/fbo-scans/move-conflicts', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },
};
