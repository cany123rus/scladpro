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
const FALLBACK_OFFLINE_URL = 'http://localhost:8787';

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

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const baseUrl = getWarehouseOfflineUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(body?.error || `Offline server error: ${res.status}`);
  }
  return body as T;
};

export const warehouseOfflineClient = {
  async health() {
    return request<WarehouseOfflineStatus>('/api/warehouse-offline/health');
  },

  async getSnapshot() {
    return request<WarehouseOfflineSnapshot | null>('/api/warehouse-offline/snapshot');
  },

  async saveSnapshot(snapshot: WarehouseOfflineSnapshot) {
    return request<{ ok: true; updatedAt: string }>('/api/warehouse-offline/snapshot', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    });
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
};
