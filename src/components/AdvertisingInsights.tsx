import React, { useMemo, useState } from 'react';
import { Upload, Target, TrendingUp, TrendingDown, AlertTriangle, Copy, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { ADS_AUTOPILOT_CONFIG, evaluateAdsRow, buildTelegramDigest } from '../services/adsAutopilot';

type Row = {
  keyword: string;
  impressions: number;
  clicks: number;
  spend: number;
  orders: number;
  ctr: number;
  cpc: number;
  score: number;
  recommendation: string;
  wbAction: string;
};

const num = (v: any) => {
  const s = String(v ?? '').replace(/\s/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export const AdvertisingInsights = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [targetCtr, setTargetCtr] = useState(String(ADS_AUTOPILOT_CONFIG.targetCtr));
  const [error, setError] = useState('');
  const [sourceInfo, setSourceInfo] = useState('');

  const scoreKeyword = (impressions: number, clicks: number, spend: number, orders: number) => {
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cr = clicks > 0 ? (orders / clicks) * 100 : 0;

    const ctrPart = Math.min(100, ctr * 20); // 5% ~ 100
    const cpcPart = cpc <= 0 ? 40 : Math.max(0, 100 - cpc * 12);
    const volumePart = Math.min(100, (clicks / 25) * 100);
    const crPart = Math.min(100, cr * 20);
    const score = Math.round(ctrPart * 0.4 + cpcPart * 0.25 + volumePart * 0.15 + crPart * 0.2);

    const decision = evaluateAdsRow({ keyword: '', impressions, clicks, spend, orders, ctr, cpc }, {
      ...ADS_AUTOPILOT_CONFIG,
      targetCtr: Number(targetCtr) || ADS_AUTOPILOT_CONFIG.targetCtr,
    });

    return { ctr, cpc, score, recommendation: decision.recommendation, wbAction: decision.wbAction };
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError('');
    setSourceInfo('');

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const ws =
        workbook.getWorksheet('Статистика по ключевым словам') ||
        workbook.getWorksheet('Топ поисковых кластеров') ||
        workbook.worksheets.find(w => String(w.name || '').toLowerCase().includes('ключ')) ||
        workbook.worksheets.find(w => String(w.name || '').toLowerCase().includes('кластер'));

      if (!ws) throw new Error('Не найден подходящий лист статистики ключей/кластеров.');

      const headerRow = ws.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, col) => {
        headers[col] = String(cell.value ?? '').trim();
      });

      const findCol = (variants: string[]) => {
        const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
        const variantsNorm = variants.map(norm);
        for (let i = 1; i < headers.length; i++) {
          const h = norm(headers[i] || '');
          if (variantsNorm.includes(h)) return i;
        }
        return -1;
      };

      const colKeyword = findCol(['Ключевая фраза', 'Ключ', 'Фраза', 'Keyword', 'Кластер', 'Поисковый кластер']);
      const colViews = findCol(['Просмотры', 'Показы', 'Impressions']);
      const colClicks = findCol(['Клики', 'Clicks']);
      const colSpend = findCol(['Затраты', 'Расход', 'Spend']);
      const colOrders = findCol(['Заказов с этим товаром', 'Заказы', 'Заказанные товары']);

      if (colKeyword < 0 || colViews < 0 || colClicks < 0 || colSpend < 0) {
        throw new Error('В файле не найдены нужные колонки: ключ/кластер, показы/просмотры, клики, затраты.');
      }

      const agg = new Map<string, { impressions: number; clicks: number; spend: number; orders: number }>();
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const keyword = String(row.getCell(colKeyword).value ?? '').trim();
        if (!keyword) continue;

        const impressions = num(row.getCell(colViews).value);
        const clicks = num(row.getCell(colClicks).value);
        const spend = num(row.getCell(colSpend).value);
        const orders = colOrders > 0 ? num(row.getCell(colOrders).value) : 0;

        const prev = agg.get(keyword) || { impressions: 0, clicks: 0, spend: 0, orders: 0 };
        prev.impressions += impressions;
        prev.clicks += clicks;
        prev.spend += spend;
        prev.orders += orders;
        agg.set(keyword, prev);
      }

      const parsed: Row[] = Array.from(agg.entries()).map(([keyword, v]) => {
        const extra = scoreKeyword(v.impressions, v.clicks, v.spend, v.orders);
        return { keyword, impressions: v.impressions, clicks: v.clicks, spend: v.spend, orders: v.orders, ...extra };
      }).sort((a, b) => b.spend - a.spend);

      setRows(parsed);
      setSourceInfo(`Лист: ${ws.name} • строк: ${ws.rowCount - 1} • ключей/кластеров: ${parsed.length}`);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || 'Ошибка чтения файла');
    }
  };

  const summary = useMemo(() => {
    const spend = rows.reduce((a, r) => a + r.spend, 0);
    const clicks = rows.reduce((a, r) => a + r.clicks, 0);
    const impressions = rows.reduce((a, r) => a + r.impressions, 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    return { spend, clicks, impressions, ctr, cpc };
  }, [rows]);

  const topActions = useMemo(() => {
    const target = Number(targetCtr) || ADS_AUTOPILOT_CONFIG.targetCtr;
    const actions: string[] = [];

    rows.filter(r => r.clicks >= 15 && r.orders === 0).slice(0, 4)
      .forEach(r => actions.push(`Отключить/минусовать: «${r.keyword}» (клики ${r.clicks}, заказов 0)`));

    rows.filter(r => r.ctr >= target && r.clicks >= 8 && r.orders > 0).slice(0, 4)
      .forEach(r => actions.push(`Масштабировать: «${r.keyword}» (CTR ${r.ctr.toFixed(2)}%, заказы ${r.orders})`));

    rows.filter(r => r.clicks >= 12 && r.orders === 0 && r.ctr < target).slice(0, 4)
      .forEach(r => actions.push(`Снизить общую ставку: «${r.keyword}» (CTR ${r.ctr.toFixed(2)}% < ${target}%, заказов 0)`));

    return actions.slice(0, 10);
  }, [rows, targetCtr]);

  const telegramDigest = useMemo(() => buildTelegramDigest(rows.map(r => ({ keyword: r.keyword, recommendation: r.recommendation, wbAction: r.wbAction }))), [rows]);

  const copyDigest = async () => {
    try {
      await navigator.clipboard.writeText(telegramDigest || '');
      alert('Дайджест скопирован');
    } catch {
      alert('Не удалось скопировать автоматически. Выделите и скопируйте вручную.');
    }
  };

  const exportRecommendationsExcel = async () => {
    if (!rows.length) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Рекомендации');

    ws.addRow(['Ключ/кластер', 'Показы', 'Клики', 'Заказы', 'CTR %', 'CPC', 'Расход', 'Рекомендация', 'Действие в WB']);
    rows.forEach((r) => {
      ws.addRow([r.keyword, r.impressions, r.clicks, r.orders, Number(r.ctr.toFixed(2)), Number(r.cpc.toFixed(2)), Number(r.spend.toFixed(2)), r.recommendation, r.wbAction]);
    });

    ws.columns.forEach((col) => {
      col.width = Math.min(42, Math.max(12, String(col.header || '').length + 4));
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wb_ads_recommendations_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Реклама</h1>
        <p className="text-gray-500">Аналитика ключевых фраз WB из листов статистики. Режим автопилота: dry-run (без автоизменений в WB).</p>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer">
            <Upload className="h-4 w-4 mr-2" /> Загрузить отчёт (Excel)
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Целевой CTR, %</span>
            <input value={targetCtr} onChange={(e) => setTargetCtr(e.target.value)} className="w-20 p-2 border rounded" />
          </div>
        </div>
        {sourceInfo && <div className="mt-2 text-xs text-gray-500">{sourceInfo}</div>}
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white border rounded-xl p-3"><div className="text-xs text-gray-500">Показы</div><div className="font-bold">{summary.impressions}</div></div>
        <div className="bg-white border rounded-xl p-3"><div className="text-xs text-gray-500">Клики</div><div className="font-bold">{summary.clicks}</div></div>
        <div className="bg-white border rounded-xl p-3"><div className="text-xs text-gray-500">Расход</div><div className="font-bold">{summary.spend.toFixed(2)} ₽</div></div>
        <div className="bg-white border rounded-xl p-3"><div className="text-xs text-gray-500">CTR</div><div className="font-bold">{summary.ctr.toFixed(2)}%</div></div>
        <div className="bg-white border rounded-xl p-3"><div className="text-xs text-gray-500">CPC</div><div className="font-bold">{summary.cpc.toFixed(2)} ₽</div></div>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <div className="font-semibold text-gray-900 mb-2">Что сделать сегодня</div>
        {topActions.length === 0 ? <div className="text-sm text-gray-500">Загрузите отчет, чтобы получить рекомендации.</div> : (
          <ul className="space-y-1 text-sm">{topActions.map((a, i) => <li key={i}>• {a}</li>)}</ul>
        )}
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <div className="font-semibold text-gray-900">Telegram дайджест (dry-run)</div>
          <div className="flex gap-2">
            <button onClick={copyDigest} className="inline-flex items-center px-3 py-1.5 text-sm rounded border hover:bg-gray-50"><Copy className="h-4 w-4 mr-1"/>Скопировать дайджест</button>
            <button onClick={exportRecommendationsExcel} disabled={!rows.length} className={`inline-flex items-center px-3 py-1.5 text-sm rounded text-white ${rows.length ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'}`}><FileSpreadsheet className="h-4 w-4 mr-1"/>Экспорт рекомендаций</button>
          </div>
        </div>
        <textarea value={telegramDigest} readOnly className="w-full min-h-[120px] p-3 border rounded text-sm bg-gray-50" />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1.2fr_repeat(6,0.7fr)_1fr_1.4fr] gap-2 px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600">
          <div>Ключевая фраза</div><div>Показы</div><div>Клики</div><div>Заказы</div><div>CTR%</div><div>CPC</div><div>Расход</div><div>Рекомендация</div><div>Действие в WB</div>
        </div>
        <div className="max-h-[58vh] overflow-auto">
          {rows.map((r, idx) => (
            <div key={`${r.keyword}-${idx}`} className="grid grid-cols-[1.2fr_repeat(6,0.7fr)_1fr_1.4fr] gap-2 px-3 py-2 border-t text-sm">
              <div className="truncate" title={r.keyword}>{r.keyword}</div>
              <div>{r.impressions}</div>
              <div>{r.clicks}</div>
              <div>{r.orders}</div>
              <div>{r.ctr.toFixed(2)}</div>
              <div>{r.cpc.toFixed(2)}</div>
              <div>{r.spend.toFixed(2)}</div>
              <div className="text-xs">
                {r.recommendation.includes('Масштаб') && <span className="inline-flex items-center text-emerald-700"><TrendingUp className="h-3 w-3 mr-1" />{r.recommendation}</span>}
                {r.recommendation.includes('Снизить') && <span className="inline-flex items-center text-amber-700"><TrendingDown className="h-3 w-3 mr-1" />{r.recommendation}</span>}
                {(r.recommendation.includes('Отключить') || r.recommendation.includes('минус')) && <span className="inline-flex items-center text-rose-700"><AlertTriangle className="h-3 w-3 mr-1" />{r.recommendation}</span>}
                {(r.recommendation === 'Наблюдать' || r.recommendation.includes('Проверить')) && <span className="inline-flex items-center text-slate-600"><Target className="h-3 w-3 mr-1" />{r.recommendation}</span>}
              </div>
              <div className="text-xs text-gray-700">{r.wbAction}</div>
            </div>
          ))}
          {rows.length === 0 && <div className="p-6 text-sm text-gray-500">Пока нет данных. Загрузите отчёт WB.</div>}
        </div>
      </div>
    </div>
  );
};
