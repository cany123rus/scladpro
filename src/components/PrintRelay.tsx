import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, X } from 'lucide-react';

// Приёмник заданий печати с планшета. На компьютере опрашивает таблицу print_jobs
// и даёт распечатать присланные PDF (открывает их во вкладке для печати).
interface PrintJob {
  id: string;
  file_name: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
}

// Считаем устройством-приёмником обычные десктопы (мышь, широкий экран).
const isDesktop = () => {
  try {
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    return wide && finePointer;
  } catch {
    return window.innerWidth >= 1024;
  }
};

export function PrintRelay() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [enabled, setEnabled] = useState(true);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isDesktop()) return;
    let alive = true;
    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('print_jobs')
          .select('id, file_name, file_url, created_by, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(50);
        if (!alive || error) return;
        setJobs((data || []) as PrintJob[]);
      } catch { /* ignore */ }
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const printJob = (job: PrintJob) => {
    if (!job.file_url) return;
    // Открываем PDF в новой вкладке (клик пользователя — не блокируется).
    window.open(job.file_url, '_blank', 'noopener');
    markPrinted([job.id]);
  };

  const printAll = () => {
    jobs.forEach((j) => { if (j.file_url) window.open(j.file_url, '_blank', 'noopener'); });
    markPrinted(jobs.map((j) => j.id));
  };

  const markPrinted = async (ids: string[]) => {
    if (!ids.length) return;
    setJobs((prev) => prev.filter((j) => !ids.includes(j.id)));
    ids.forEach((id) => seenRef.current.add(id));
    try {
      await supabase.from('print_jobs').update({ status: 'printed', printed_at: new Date().toISOString() }).in('id', ids);
    } catch { /* ignore */ }
  };

  const dismiss = (id: string) => markPrinted([id]);

  if (!enabled || jobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9998] w-80 max-w-[92vw] rounded-2xl border border-violet-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 rounded-t-2xl bg-violet-50">
        <div className="flex items-center gap-2 text-violet-800 font-semibold text-sm">
          <Printer className="h-4 w-4" /> Файлы на печать ({jobs.length})
        </div>
        <button onClick={() => setEnabled(false)} className="p-1 rounded-lg hover:bg-violet-100 text-violet-500" title="Скрыть">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-800 truncate" title={j.file_name || ''}>{j.file_name || 'Файл'}</div>
              <div className="text-[11px] text-slate-400">{j.created_by || 'Планшет'} · {new Date(j.created_at).toLocaleTimeString('ru-RU')}</div>
            </div>
            <button onClick={() => printJob(j)} className="px-2.5 py-1.5 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-700">Печать</button>
            <button onClick={() => dismiss(j.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" title="Убрать"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      {jobs.length > 1 && (
        <div className="p-2 border-t border-slate-100">
          <button onClick={printAll} className="w-full px-3 py-2 text-sm rounded-xl bg-violet-600 text-white hover:bg-violet-700">Печать всех ({jobs.length})</button>
        </div>
      )}
    </div>
  );
}

export default PrintRelay;
