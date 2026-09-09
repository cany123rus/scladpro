/**
 * Обмен с edge-функцией вывода из оборота.
 *
 * Сама функция ходит в ГИС МТ, а здесь только вызовы: подпись остаётся в
 * браузере, всё остальное делает сервер.
 */
import { supabase } from '../lib/supabase';

export interface ChzConfig {
  baseUrl: string;
  productGroup: string;
  documentType: string;
  documentFormat: string;
  holdDays: number;
  batchSize: number;
  soldFrom: string | null;
  documentTemplate: Record<string, unknown>;
  /** Формат подписи строки входа, подобранный при первом успешном входе. */
  authSignMode?: 'attached_text' | 'attached_asis' | 'detached_text' | 'detached_asis';
}

export interface ChzStatus {
  counts: Record<string, number>;
  signedIn: boolean;
  inn: string;
  config: ChzConfig;
}

async function call<T>(action: string, supplierId: string, extra: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('chz-withdrawal', {
    body: { action, supplierId, ...extra },
  });

  if (error) {
    /*
     * Ошибку функции достаём из тела ответа.
     *
     * supabase-js на любой не-2xx отдаёт безликое «Edge Function returned a
     * non-2xx status code», и настоящая причина — «нет ИНН», «нужен вход» —
     * теряется. А именно она и нужна человеку у экрана.
     */
    let detail = error.message || 'Функция вернула ошибку';
    const response = (error as any)?.context;
    if (response && typeof response.json === 'function') {
      try {
        const body = await response.json();
        if (body?.error) detail = String(body.error);
      } catch {
        // тело не JSON — оставляем как есть
      }
    }
    throw new Error(detail);
  }

  if ((data as any)?.error) throw new Error(String((data as any).error));
  return data as T;
}

export const chzStatus = (supplierId: string) => call<ChzStatus>('status', supplierId);

export const chzSessionStart = (supplierId: string) =>
  call<{ uuid: string; data: string }>('session/start', supplierId);

export const chzSessionFinish = (supplierId: string, uuid: string, signature: string) =>
  call<{ ok: boolean; expiresAt: string }>('session/finish', supplierId, { uuid, signature });

export const chzSaveConfig = (supplierId: string, patch: Partial<ChzConfig>) =>
  call<{ ok: boolean; config: ChzConfig }>('config/patch', supplierId, { patch });

export const chzSyncWbStatuses = (supplierId: string) =>
  call<{ asked: number; updated: number }>('sync-wb-statuses', supplierId);

export const chzEnqueue = (supplierId: string, holdDays?: number, soldFrom?: string | null) =>
  call<{ added: number; holdDays: number; soldFrom: string | null }>('enqueue', supplierId, { holdDays, soldFrom });

export const chzPrepareBatch = (supplierId: string, limit?: number) =>
  call<{ documentId: string; codesCount: number; base64: string; preview: Record<string, unknown> }>(
    'batch/prepare',
    supplierId,
    { limit },
  );

export const chzSubmitBatch = (supplierId: string, documentId: string, signature: string, signedBy: string) =>
  call<{ ok: boolean; externalId: string; codesCount: number }>('batch/submit', supplierId, {
    documentId,
    signature,
    signedBy,
  });

export const chzPoll = (supplierId: string) =>
  call<{ checked: Array<{ id: string; status: string; detail: string }> }>('poll', supplierId);

export interface ChzQueueRow {
  id: string;
  orderId: string;
  chzCode: string;
  soldAt: string | null;
  status: string;
  error: string;
  documentId: string | null;
  createdAt: string;
}

export async function fetchChzQueue(supplierId: string, status = '', limit = 200): Promise<ChzQueueRow[]> {
  let query = supabase
    .from('chz_withdrawals')
    .select('id, order_id, chz_code, sold_at, status, error, document_id, created_at')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new Error(`Очередь не прочитана: ${error.message}`);

  return (data || []).map((r: any) => ({
    id: String(r.id),
    orderId: String(r.order_id || ''),
    chzCode: String(r.chz_code || ''),
    soldAt: r.sold_at ? String(r.sold_at) : null,
    status: String(r.status || ''),
    error: String(r.error || ''),
    documentId: r.document_id ? String(r.document_id) : null,
    createdAt: String(r.created_at || ''),
  }));
}

export interface ChzDocumentRow {
  id: string;
  externalId: string;
  codesCount: number;
  status: string;
  signedBy: string;
  createdAt: string;
  response: unknown;
}

export async function fetchChzDocuments(supplierId: string, limit = 50): Promise<ChzDocumentRow[]> {
  const { data, error } = await supabase
    .from('chz_documents')
    .select('id, external_id, codes_count, status, signed_by, created_at, response')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Документы не прочитаны: ${error.message}`);

  return (data || []).map((r: any) => ({
    id: String(r.id),
    externalId: String(r.external_id || ''),
    codesCount: Number(r.codes_count || 0),
    status: String(r.status || ''),
    signedBy: String(r.signed_by || ''),
    createdAt: String(r.created_at || ''),
    response: r.response,
  }));
}
