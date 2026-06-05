import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type SharedPayload = {
  title?: string;
  period_start?: string | null;
  period_end?: string | null;
  summary?: any;
  analytics?: any[];
  supplier_name?: string;
};

const normalizeNmId = (v: any) => String(v ?? '').replace(/\D+/g, '').replace(/^0+/, '');

const getWbPhotoCandidates = (_code: any, initial?: string) => {
  const list: string[] = [];
  if (initial) list.push(String(initial));
  return Array.from(new Set(list.filter(Boolean)));
};

export default function SharedAnalytics() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SharedPayload | null>(null);
  const [expandedSizes, setExpandedSizes] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<string>('sales_net');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [photoAttemptByRow, setPhotoAttemptByRow] = useState<Record<string, number>>({});
  const [photoRefreshSeed, setPhotoRefreshSeed] = useState<number>(Date.now());

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError('Некорректная ссылка');
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('analytics_shared_reports')
          .select('payload_json, expires_at')
          .eq('token', token)
          .maybeSingle();
        if (error) throw error;
        if (!data?.payload_json) {
          setError('Отчёт не найден');
          setLoading(false);
          return;
        }
        if (data?.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
          setError('Срок действия ссылки истёк');
          setLoading(false);
          return;
        }
        setPayload(data.payload_json as SharedPayload);
      } catch (e: any) {
        setError(e?.message || 'Не удалось открыть отчёт');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const rows = useMemo(() => {
    const base = Array.isArray(payload?.analytics) ? [...payload!.analytics!] : [];
    const getVal = (r: any) => {
      if (sortKey === 'name') return String(r?.name || '').toLowerCase();
      if (sortKey === 'code') return String(r?.code || '');
      return Number(r?.[sortKey] || 0);
    };
    base.sort((a: any, b: any) => {
      const av = getVal(a);
      const bv = getVal(b);
      let cmp = 0;
      if (typeof av === 'string' || typeof bv === 'string') cmp = String(av).localeCompare(String(bv), 'ru', { numeric: true });
      else cmp = Number(av) - Number(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return base;
  }, [payload, sortKey, sortDir]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Загрузка отчёта…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-4">
      <div className="w-full mx-auto bg-white rounded-xl border border-slate-200 p-3 md:p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{payload?.title || 'Аналитика WB'}</h1>
          <button
            type="button"
            onClick={() => {
              setPhotoAttemptByRow({});
              setPhotoRefreshSeed(Date.now());
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            Обновить фото
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <div className="text-sm text-slate-600">
            Период: {payload?.period_start ? new Date(payload.period_start).toLocaleDateString('ru-RU') : '—'} — {payload?.period_end ? new Date(payload.period_end).toLocaleDateString('ru-RU') : '—'}
          </div>
        </div>

        {payload?.summary && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Номенклатур</div><div className="font-bold">{Number(payload.summary.items || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Продажи</div><div className="font-bold">{Number(payload.summary.sales_net || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Возвраты</div><div className="font-bold">{Number(payload.summary.returns_gross || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Логистика</div><div className="font-bold">{Number(payload.summary.logistics_sum || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">К перечислению</div><div className="font-bold">{Number(payload.summary.payout_net || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Штрафы</div><div className="font-bold">{Number(payload.summary.fine_sum || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Хранение</div><div className="font-bold">{Number(payload.summary.storage_sum || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Реклама WB</div><div className="font-bold">{Number(payload.summary.withhold_sum || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Итого к оплате</div><div className="font-bold">{Number(payload.summary.to_pay_total || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Налоги</div><div className="font-bold">{Number(payload.summary.tax_sum || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Доп траты</div><div className="font-bold">{Number(payload.summary.extra_costs || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Заработок</div><div className="font-bold">{Number((payload.summary.headline_profit ?? payload.summary.profit_total) || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Кол-во проданных</div><div className="font-bold">{Number(payload.summary.sold_qty || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Кол-во возвратов</div><div className="font-bold">{Number(payload.summary.return_qty || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Эквайринг/Комиссии</div><div className="font-bold">{Number(payload.summary.acquiring_sum || 0).toLocaleString('ru-RU')}</div></div>
            <div className="bg-slate-50 rounded-lg p-2 min-w-[135px]"><div className="text-xs text-slate-500">Размер комиссии, %</div><div className="font-bold">{Number(payload.summary.acquiring_percent || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</div></div>
          </div>
        )}

        <div className="mt-4 overflow-auto border border-slate-100 rounded-lg max-h-[86vh]">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left">Фото</th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('code'); setSortDir((d) => sortKey === 'code' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }} className="hover:underline">Код</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('name'); setSortDir((d) => sortKey === 'name' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'); }} className="hover:underline">Название</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('sales_net'); setSortDir((d) => sortKey === 'sales_net' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Продажи</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('returns_gross'); setSortDir((d) => sortKey === 'returns_gross' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Возвраты</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('logistics_sum'); setSortDir((d) => sortKey === 'logistics_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Логистика</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('payout_net'); setSortDir((d) => sortKey === 'payout_net' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">К перечислению</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('fine_sum'); setSortDir((d) => sortKey === 'fine_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Штрафы</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('storage_sum'); setSortDir((d) => sortKey === 'storage_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Хранение</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('withhold_sum'); setSortDir((d) => sortKey === 'withhold_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Реклама WB</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('to_pay_total'); setSortDir((d) => sortKey === 'to_pay_total' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Итого к оплате</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('cost'); setSortDir((d) => sortKey === 'cost' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Себестоимость</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('avg_profit'); setSortDir((d) => sortKey === 'avg_profit' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Ср. заработок с ед.</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('profit_total'); setSortDir((d) => sortKey === 'profit_total' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Заработок</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('sold_qty'); setSortDir((d) => sortKey === 'sold_qty' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Кол-во проданных</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('return_qty'); setSortDir((d) => sortKey === 'return_qty' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Кол-во возвратов</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('acquiring_sum'); setSortDir((d) => sortKey === 'acquiring_sum' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Эквайринг/Комиссии</button></th>
                <th className="px-3 py-2 text-left"><button type="button" onClick={() => { setSortKey('acquiring_percent'); setSortDir((d) => sortKey === 'acquiring_percent' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }} className="hover:underline">Размер комиссии, %</button></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => {
                const rowKey = `${r?.code || 'x'}-${i}`;
                const sizeList = Array.isArray(r?.size_breakdown_list) ? r.size_breakdown_list : [];
                const isOpen = !!expandedSizes[rowKey];
                const explicitCandidates = Array.isArray(r?.photo_candidates) ? r.photo_candidates : [];
                const candidates = explicitCandidates.length
                  ? Array.from(new Set([String(r?.photo_url || ''), ...explicitCandidates].filter(Boolean)))
                  : getWbPhotoCandidates(r?.code, r?.photo_url);
                const attempt = photoAttemptByRow[rowKey] || 0;
                const currentPhotoBase = candidates[attempt] || '';
                const currentPhoto = currentPhotoBase
                  ? `${currentPhotoBase}${currentPhotoBase.includes('?') ? '&' : '?'}v=${photoRefreshSeed}`
                  : '';
                return (
                  <Fragment key={rowKey}>
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        {currentPhoto ? (
                          <img
                            src={currentPhoto}
                            alt={r?.name || 'товар'}
                            className="w-32 h-40 object-cover rounded border border-slate-200"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() => {
                              setPhotoAttemptByRow((prev) => {
                                const current = prev[rowKey] || 0;
                                if (current + 1 >= candidates.length) return prev;
                                return { ...prev, [rowKey]: current + 1 };
                              });
                            }}
                          />
                        ) : (
                          <div className="w-32 h-40 rounded border border-slate-200 bg-slate-100" />
                        )}
                      </td>
                      <td className="px-3 py-2">{r?.code ? <a href={`https://www.wildberries.ru/catalog/${encodeURIComponent(String(r.code))}/detail.aspx`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{r.code}</a> : '—'}</td>
                      <td className="px-3 py-2">
                        <div>{r?.name || '—'}</div>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedSizes((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))}
                            className="px-2 py-0.5 text-[11px] rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            {isOpen ? 'Скрыть размеры' : 'Детализация размеров'}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">{Number(r?.sales_net || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.returns_gross || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.logistics_sum || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.payout_net || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.fine_sum || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.storage_sum || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.withhold_sum || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.to_pay_total || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.cost || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2">{Number(r?.avg_profit || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2">{Number(r?.profit_total || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2">{Number(r?.sold_qty || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.return_qty || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.acquiring_sum || 0).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2">{Number(r?.acquiring_percent || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                    </tr>
                    {isOpen && sizeList.map((s: any, idx: number) => (
                      <tr key={`${rowKey}-size-${idx}`} className="border-t border-slate-100 bg-slate-50">
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 text-xs font-semibold text-slate-700" colSpan={2}>Размер: {String(s?.size || '—')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.sales_net || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.returns_gross || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.logistics_sum || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.payout_net || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.fine_sum || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.storage_sum || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.withhold_sum || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.to_pay_total || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">—</td>
                        <td className="px-3 py-2 text-xs">—</td>
                        <td className="px-3 py-2 text-xs">—</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.sold_net_qty || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.return_qty || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.acquiring_sum || 0).toLocaleString('ru-RU')}</td>
                        <td className="px-3 py-2 text-xs">{Number(s?.acquiring_percent || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              {rows.length === 0 && (
                <tr><td className="px-3 py-6 text-slate-500" colSpan={18}>Нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
