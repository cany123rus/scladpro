import React from 'react';
import { X } from 'lucide-react';

type ModalAccent = 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

const ACCENTS: Record<ModalAccent, string> = {
  violet: 'from-violet-600 to-indigo-600',
  emerald: 'from-emerald-600 to-teal-600',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-600 to-pink-600',
  sky: 'from-sky-600 to-cyan-600',
  slate: 'from-slate-700 to-slate-900',
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  accent?: ModalAccent;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

/**
 * Shared modal shell — soft blurred backdrop, rounded-3xl panel, gradient header
 * with an optional icon. Use for all new dialogs to keep a consistent look.
 */
export function Modal({ open, onClose, title, subtitle, eyebrow, icon, accent = 'violet', size = 'md', children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${SIZES[size]} max-h-[92svh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-3 bg-gradient-to-r ${ACCENTS[accent]} px-6 py-5 text-white`}>
          {icon && <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">{icon}</div>}
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{eyebrow}</div>}
            <h3 className="truncate text-lg font-bold leading-tight">{title}</h3>
            {subtitle && <div className="mt-0.5 truncate text-sm text-white/80">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92svh-140px)] overflow-y-auto p-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
