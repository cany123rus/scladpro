import React from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  total: number;
  collapsed: boolean;
  onToggle: () => void;
};

export function WarehouseMoneyHeader({ total, collapsed, onToggle }: Props) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-lg text-slate-900">Деньги на складе</h3>
        <button type="button" onClick={onToggle} className="p-1 rounded border border-slate-200 hover:bg-slate-50">
          <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>
      <div className="text-2xl font-extrabold text-emerald-700">{total.toFixed(2)} ₽</div>
    </div>
  );
}
