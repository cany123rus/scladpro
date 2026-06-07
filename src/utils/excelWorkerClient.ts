// Thin client around the Excel parsing Web Worker. Falls back to main-thread
// parsing (safeExcel.readFirstSheetAsJson) when workers are unavailable or fail.
import { readFirstSheetAsJson } from './safeExcel';

let _worker: Worker | null = null;
const getWorker = (): Worker => {
  if (!_worker) {
    _worker = new Worker(new URL('../workers/excelParser.worker.ts', import.meta.url), { type: 'module' });
  }
  return _worker;
};

const parseInWorker = (buffer: ArrayBuffer, header?: 1): Promise<any[]> =>
  new Promise((resolve, reject) => {
    let w: Worker;
    try { w = getWorker(); } catch (e) { reject(e); return; }
    const id = Math.random().toString(36).slice(2);
    const timer = setTimeout(() => { cleanup(); reject(new Error('worker timeout')); }, 120000);
    const onMsg = (ev: MessageEvent) => {
      if (!ev.data || ev.data.id !== id) return;
      cleanup();
      if (ev.data.error) reject(new Error(ev.data.error));
      else resolve(ev.data.rows || []);
    };
    const onErr = (ev: ErrorEvent) => { cleanup(); reject(ev.error || new Error('worker error')); };
    const cleanup = () => { clearTimeout(timer); w.removeEventListener('message', onMsg); w.removeEventListener('error', onErr); };
    w.addEventListener('message', onMsg);
    w.addEventListener('error', onErr);
    // Transfer the buffer (zero-copy). Caller must not reuse it afterwards.
    w.postMessage({ id, buffer, header }, [buffer]);
  });

/**
 * Reads the first sheet of an Excel file as JSON, off the main thread when
 * possible. `file` is required for the fallback path (the worker transfers and
 * detaches the ArrayBuffer, so we re-read the file if the worker fails).
 */
export const readFirstSheetAsJsonFast = async <T = Record<string, unknown>>(
  file: File,
  options: { header?: 1 } = {}
): Promise<T[]> => {
  try {
    const buffer = await file.arrayBuffer();
    return (await parseInWorker(buffer, options.header)) as T[];
  } catch {
    // Fallback: parse on main thread from a fresh buffer.
    const buffer = await file.arrayBuffer();
    return readFirstSheetAsJson<T>(buffer, options.header === 1 ? { header: 1 } : { defval: '' });
  }
};
