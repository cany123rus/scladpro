import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, HelpCircle, Check, X } from 'lucide-react';

export type ConfirmTone = 'danger' | 'warning' | 'primary';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

interface InternalState {
  open: boolean;
  options: ConfirmOptions;
}

// Module-level bridge so confirmDialog() can be called from anywhere (incl. plain
// async handlers) without prop-drilling a context. A single <ConfirmHost/> mounted
// in App registers the setter and resolves the active promise.
let resolver: ((value: boolean) => void) | null = null;
let externalSet: ((state: InternalState) => void) | null = null;

/**
 * Beautiful drop-in replacement for window.confirm().
 * Usage: if (!(await confirmDialog('Удалить запись?'))) return;
 * or:    if (!(await confirmDialog({ title: 'Удаление', message: '...', tone: 'danger' }))) return;
 */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : { ...options };
  return new Promise<boolean>((resolve) => {
    // If the host isn't mounted yet, fail safe to native confirm.
    if (!externalSet) {
      resolve(window.confirm(opts.message || opts.title || 'Подтвердите действие'));
      return;
    }
    resolver = resolve;
    externalSet({ open: true, options: opts });
  });
}

const TONE_STYLES: Record<ConfirmTone, {
  header: string;
  icon: JSX.Element;
  confirmBtn: string;
}> = {
  danger: {
    header: 'from-rose-500 to-red-600',
    icon: <Trash2 className="h-5 w-5" />,
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
  },
  warning: {
    header: 'from-amber-500 to-orange-500',
    icon: <AlertTriangle className="h-5 w-5" />,
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
  },
  primary: {
    header: 'from-indigo-500 to-violet-600',
    icon: <HelpCircle className="h-5 w-5" />,
    confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
  },
};

export function ConfirmHost() {
  const [state, setState] = useState<InternalState>({ open: false, options: {} });
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    externalSet = setState;
    return () => {
      if (externalSet === setState) externalSet = null;
    };
  }, []);

  const finish = (value: boolean) => {
    const r = resolver;
    resolver = null;
    setState((prev) => ({ ...prev, open: false }));
    r?.(value);
  };

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
      if (e.key === 'Enter') finish(true);
    };
    window.addEventListener('keydown', onKey);
    // Focus the confirm button for quick keyboard confirmation.
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open]);

  if (!state.open) return null;

  const { title, message, confirmText, cancelText, tone = 'danger' } = state.options;
  const styles = TONE_STYLES[tone] || TONE_STYLES.danger;
  const lines = String(message || '').split('\n').filter((l) => l.length > 0);
  const heading = title || (tone === 'danger' ? 'Подтвердите удаление' : 'Подтвердите действие');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={() => finish(false)}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-[fadeInScale_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`flex items-center gap-3 bg-gradient-to-r ${styles.header} px-6 py-5 text-white`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            {styles.icon}
          </div>
          <h3 className="min-w-0 flex-1 truncate text-lg font-bold leading-tight">{heading}</h3>
          <button
            onClick={() => finish(false)}
            className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {(title && lines.length > 0) || lines.length > 0 ? (
          <div className="px-6 py-5">
            <div className="space-y-1.5 text-sm leading-relaxed text-slate-600">
              {lines.length > 0 ? (
                lines.map((line, i) => <p key={i}>{line}</p>)
              ) : (
                <p>Вы уверены, что хотите продолжить?</p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed text-slate-600">Вы уверены, что хотите продолжить?</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            onClick={() => finish(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.97]"
          >
            {cancelText || 'Отмена'}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => finish(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.97] ${styles.confirmBtn}`}
          >
            <Check className="h-4 w-4" />
            {confirmText || (tone === 'danger' ? 'Удалить' : 'Подтвердить')}
          </button>
        </div>
      </div>
    </div>
  );
}
