import React from 'react';

type Row = {
  id: string;
  amount: number;
  comment?: string;
  created_at: string;
};

type Props = {
  row: Row;
  isAdmin: boolean;
  onDelete: (rowId: string) => Promise<void> | void;
};

export function WarehouseMoneyHistoryItem({ row, isAdmin, onDelete }: Props) {
  return (
    <div className="p-3 flex items-center justify-between gap-3 text-sm">
      <div>
        <div className="font-medium text-gray-900">{row.comment || 'Без комментария'}</div>
        <div className="text-xs text-gray-500">{new Date(row.created_at).toLocaleString('ru-RU')}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`font-bold ${Number(row.amount) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {Number(row.amount) >= 0 ? '+' : ''}{Number(row.amount).toFixed(2)} ₽
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onDelete(row.id)}
            className="px-2 py-1 text-xs rounded border border-red-200 text-red-700 hover:bg-red-50"
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}
