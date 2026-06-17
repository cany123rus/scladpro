import React, { useEffect, useMemo, useState } from 'react';

// Карта продаж по федеральным округам РФ: реальные границы регионов,
// закрашенные по 8 округам; наведение подсвечивает весь округ + данные.
type Row = { name?: string; key?: string; sold_qty?: number; sales_net?: number; share_pct?: number };

// [lon, lat] — координаты городов/складов для отнесения к округу
const COORDS: Record<string, [number, number]> = {
  'москва': [37.62, 55.75], 'санкт-петербург': [30.31, 59.94], 'спб': [30.31, 59.94], 'питер': [30.31, 59.94],
  'коледино': [37.55, 55.30], 'подольск': [37.55, 55.43], 'электросталь': [38.45, 55.79], 'тула': [37.62, 54.19],
  'казань': [49.12, 55.79], 'краснодар': [38.98, 45.04], 'невинномысск': [41.94, 44.63], 'екатеринбург': [60.6, 56.83],
  'новосибирск': [82.92, 55.03], 'хабаровск': [135.07, 48.48], 'ростов': [39.7, 47.23], 'самара': [50.15, 53.20],
  'нижний новгород': [44.0, 56.33], 'уфа': [55.97, 54.74], 'челябинск': [61.4, 55.16], 'омск': [73.37, 54.99],
  'красноярск': [92.85, 56.01], 'пермь': [56.23, 58.01], 'воронеж': [39.2, 51.66], 'волгоград': [44.5, 48.7],
  'саратов': [46.0, 51.53], 'тюмень': [65.53, 57.15], 'иркутск': [104.28, 52.29], 'владивосток': [131.89, 43.12],
  'калининград': [20.45, 54.71], 'ставрополь': [41.97, 45.04], 'иваново': [40.97, 57.0], 'ярославль': [39.87, 57.62],
  'тверь': [35.9, 56.86], 'рязань': [39.73, 54.62], 'липецк': [39.6, 52.6], 'белгород': [36.6, 50.6],
  'курск': [36.19, 51.73], 'пенза': [45.0, 53.2], 'тольятти': [49.4, 53.5], 'ижевск': [53.2, 56.85],
  'киров': [49.66, 58.6], 'барнаул': [83.78, 53.35], 'кемерово': [86.09, 55.35], 'сочи': [39.73, 43.6],
  'махачкала': [47.5, 42.98], 'сабурово': [37.6, 56.05], 'чашниково': [37.3, 56.05], 'крекшино': [37.18, 55.6],
  'минск': [27.56, 53.9], 'гомель': [31.0, 52.43], 'алматы': [76.95, 43.24], 'астана': [71.43, 51.13],
  'архангельск': [40.54, 64.54], 'астрахань': [48.03, 46.35], 'брянск': [34.36, 53.24], 'великий новгород': [31.27, 58.52],
  'владимир': [40.4, 56.13], 'вологда': [39.89, 59.22], 'калуга': [36.28, 54.51], 'кострома': [40.93, 57.77],
  'магнитогорск': [59.05, 53.41], 'мурманск': [33.08, 68.97], 'набережные челны': [52.4, 55.74], 'нижний тагил': [59.97, 57.91],
  'новокузнецк': [87.11, 53.79], 'оренбург': [55.1, 51.77], 'орёл': [36.07, 52.97], 'орел': [36.07, 52.97],
  'псков': [28.33, 57.82], 'смоленск': [32.04, 54.78], 'сургут': [73.4, 61.25], 'сыктывкар': [50.81, 61.67],
  'таганрог': [38.93, 47.22], 'тамбов': [41.43, 52.72], 'улан-удэ': [107.61, 51.83], 'чебоксары': [47.25, 56.13],
  'череповец': [37.91, 59.13], 'чита': [113.5, 52.03], 'якутск': [129.73, 62.03], 'грозный': [45.7, 43.32],
  'владикавказ': [44.68, 43.02], 'нальчик': [43.62, 43.48], 'энгельс': [46.12, 51.5], 'балашиха': [37.95, 55.8],
  'химки': [37.43, 55.89], 'мытищи': [37.73, 55.91], 'люберцы': [37.9, 55.68], 'королёв': [37.85, 55.92], 'королев': [37.85, 55.92],
  'одинцово': [37.28, 55.68], 'красногорск': [37.33, 55.83], 'домодедово': [37.75, 55.44], 'сергиев посад': [38.13, 56.31],
  'раменское': [38.23, 55.57], 'севастополь': [33.52, 44.6], 'симферополь': [34.1, 44.95], 'ялта': [34.17, 44.5],
  'новороссийск': [37.77, 44.72], 'армавир': [41.12, 44.99], 'пятигорск': [43.05, 44.05], 'стерлитамак': [55.96, 53.63],
  'нижневартовск': [76.55, 60.94], 'ноябрьск': [75.45, 63.2], 'новый уренгой': [76.68, 66.08], 'норильск': [88.2, 69.35],
  'петрозаводск': [34.36, 61.79], 'йошкар-ола': [47.89, 56.63], 'саранск': [45.18, 54.18], 'курган': [65.34, 55.44],
  'благовещенск': [127.53, 50.29], 'комсомольск-на-амуре': [137.0, 50.55], 'южно-сахалинск': [142.74, 46.96],
  'петропавловск-камчатский': [158.65, 53.04], 'абакан': [91.44, 53.72], 'кызыл': [94.45, 51.72], 'горно-алтайск': [85.96, 51.96],
  'майкоп': [40.1, 44.61], 'элиста': [44.27, 46.31], 'черкесск': [42.06, 44.22], 'назрань': [44.77, 43.23], 'магас': [44.81, 43.17],
  'тобольск': [68.25, 58.2], 'бийск': [85.21, 52.54], 'рубцовск': [81.21, 51.5], 'прокопьевск': [86.74, 53.88],
  'ангарск': [103.89, 52.54], 'братск': [101.61, 56.15], 'находка': [132.87, 42.82], 'уссурийск': [131.95, 43.8],
  'дзержинск': [43.46, 56.24], 'арзамас': [43.81, 55.39], 'муром': [42.05, 55.57], 'ковров': [41.32, 56.36],
  'старый оскол': [37.84, 51.3], 'новомосковск': [38.29, 54.01], 'обнинск': [36.61, 55.1], 'серпухов': [37.41, 54.92],
  'коломна': [38.75, 55.08], 'ногинск': [38.44, 55.85], 'орехово-зуево': [38.98, 55.81], 'щёлково': [38.0, 55.92],
  'жуковский': [38.12, 55.6], 'пушкино': [37.85, 56.01], 'долгопрудный': [37.5, 55.94], 'реутов': [37.86, 55.76],
  'воскресенск': [38.68, 55.32], 'шахты': [40.22, 47.71], 'новочеркасск': [40.1, 47.42], 'батайск': [39.74, 47.14],
  'волжский': [44.77, 48.79], 'каменск-уральский': [61.92, 56.41], 'златоуст': [59.67, 55.17], 'миасс': [60.1, 55.05],
  'копейск': [61.6, 55.12], 'первоуральск': [59.94, 56.91], 'березники': [56.79, 59.41], 'ессентуки': [42.86, 44.04],
  'кисловодск': [42.72, 43.91], 'нефтекамск': [54.27, 56.09], 'салават': [55.93, 53.36], 'альметьевск': [52.3, 54.9],
  'нижнекамск': [51.81, 55.63], 'новочебоксарск': [47.48, 56.11], 'дербент': [48.29, 42.06], 'каспийск': [47.64, 42.89],
  'хасавюрт': [46.59, 43.25], 'волгодонск': [42.18, 47.51], 'бердск': [83.1, 54.76], 'минеральные воды': [43.13, 44.21],
  'тихорецк': [40.13, 45.85],
  'обухово': [38.2, 55.82], 'сарапул': [53.8, 56.46], 'котовск': [41.5, 52.6], 'внуково': [37.29, 55.6], 'шушары': [30.4, 59.8],
  'белые столбы': [37.95, 55.32], 'вёшки': [37.6, 55.95], 'крёкшино': [37.18, 55.6],
};

const FED = [
  { key: 'cfo', name: 'Центральный', short: 'ЦФО', lon: 37.5, lat: 53.5, color: '#6366f1' },
  { key: 'szfo', name: 'Северо-Западный', short: 'СЗФО', lon: 33.0, lat: 62.0, color: '#0ea5e9' },
  { key: 'yfo', name: 'Южный', short: 'ЮФО', lon: 43.0, lat: 47.0, color: '#10b981' },
  { key: 'skfo', name: 'Северо-Кавказский', short: 'СКФО', lon: 45.0, lat: 43.5, color: '#14b8a6' },
  { key: 'pfo', name: 'Приволжский', short: 'ПФО', lon: 49.0, lat: 54.5, color: '#f59e0b' },
  { key: 'ufo', name: 'Уральский', short: 'УФО', lon: 65.0, lat: 60.0, color: '#a78bfa' },
  { key: 'sfo', name: 'Сибирский', short: 'СФО', lon: 90.0, lat: 56.0, color: '#ec4899' },
  { key: 'dfo', name: 'Дальневосточный', short: 'ДФО', lon: 135.0, lat: 58.0, color: '#f43f5e' },
] as const;
const FED_BY_KEY: Record<string, typeof FED[number]> = Object.fromEntries(FED.map((d) => [d.key, d]));

// Регион → федеральный округ
const SUBJECT_FED: Record<string, string> = {};
const addSubs = (key: string, names: string[]) => names.forEach((n) => { SUBJECT_FED[n] = key; });
addSubs('cfo', ['Белгородская область', 'Брянская область', 'Владимирская область', 'Воронежская область', 'Ивановская область', 'Калужская область', 'Костромская область', 'Курская область', 'Липецкая область', 'Москва', 'Московская область', 'Орловская область', 'Рязанская область', 'Смоленская область', 'Тамбовская область', 'Тверская область', 'Тульская область', 'Ярославская область']);
addSubs('szfo', ['Архангельская область', 'Вологодская область', 'Калининградская область', 'Республика Карелия', 'Республика Коми', 'Ленинградская область', 'Мурманская область', 'Ненецкий автономный округ', 'Новгородская область', 'Псковская область', 'Санкт-Петербург']);
addSubs('yfo', ['Адыгея', 'Астраханская область', 'Волгоградская область', 'Республика Калмыкия', 'Краснодарский край', 'Ростовская область']);
addSubs('skfo', ['Дагестан', 'Ингушетия', 'Кабардино-Балкарская республика', 'Карачаево-Черкесская республика', 'Северная Осетия - Алания', 'Ставропольский край', 'Чеченская республика']);
addSubs('pfo', ['Башкортостан', 'Кировская область', 'Марий Эл', 'Республика Мордовия', 'Нижегородская область', 'Оренбургская область', 'Пензенская область', 'Пермский край', 'Самарская область', 'Саратовская область', 'Татарстан', 'Удмуртская республика', 'Ульяновская область', 'Чувашия']);
addSubs('ufo', ['Курганская область', 'Свердловская область', 'Тюменская область', 'Ханты-Мансийский автономный округ - Югра', 'Челябинская область', 'Ямало-Ненецкий автономный округ']);
addSubs('sfo', ['Алтай', 'Алтайский край', 'Иркутская область', 'Кемеровская область', 'Красноярский край', 'Новосибирская область', 'Омская область', 'Томская область', 'Тыва', 'Республика Хакасия']);
addSubs('dfo', ['Амурская область', 'Бурятия', 'Еврейская автономная область', 'Забайкальский край', 'Камчатский край', 'Магаданская область', 'Приморский край', 'Республика Саха (Якутия)', 'Сахалинская область', 'Хабаровский край', 'Чукотский автономный округ']);
// Крым, Севастополь и новые регионы (ЮФО) — их нет в базовом geojson, рисуем отдельным слоем.
addSubs('yfo', ['Республика Крым', 'Севастополь', 'Херсонская область', 'Запорожская область', 'Донецкая Народная Республика', 'Луганская Народная Республика']);

// Упрощённые контуры регионов, отсутствующих в geojson ([lon,lat]). Достаточно для заливки по округу.
const EXTRA_FEATURES: Array<{ properties: { name: string }; geometry: { type: 'Polygon'; coordinates: number[][][] } }> = [
  { properties: { name: 'Республика Крым' }, geometry: { type: 'Polygon', coordinates: [[[33.6, 46.15], [34.5, 46.05], [35.3, 46.1], [35.9, 45.95], [36.55, 45.35], [35.8, 45.05], [35.4, 45.0], [34.7, 44.8], [34.0, 44.45], [33.5, 44.55], [33.0, 44.85], [32.5, 45.35], [33.0, 45.7], [33.6, 46.15]]] } },
  { properties: { name: 'Севастополь' }, geometry: { type: 'Polygon', coordinates: [[[33.35, 44.68], [33.65, 44.66], [33.7, 44.52], [33.4, 44.5], [33.35, 44.68]]] } },
  { properties: { name: 'Херсонская область' }, geometry: { type: 'Polygon', coordinates: [[[31.6, 46.4], [33.5, 46.3], [34.9, 46.6], [35.0, 47.3], [33.3, 47.3], [31.8, 47.0], [31.6, 46.4]]] } },
  { properties: { name: 'Запорожская область' }, geometry: { type: 'Polygon', coordinates: [[[34.9, 46.6], [36.4, 46.7], [37.0, 47.3], [36.7, 48.0], [35.3, 47.9], [34.8, 47.3], [34.9, 46.6]]] } },
  { properties: { name: 'Донецкая Народная Республика' }, geometry: { type: 'Polygon', coordinates: [[[37.0, 47.0], [38.2, 46.9], [39.0, 47.6], [38.9, 48.3], [38.2, 48.4], [37.3, 48.2], [36.9, 47.6], [37.0, 47.0]]] } },
  { properties: { name: 'Луганская Народная Республика' }, geometry: { type: 'Polygon', coordinates: [[[38.6, 48.0], [39.8, 48.1], [40.2, 48.9], [39.9, 49.6], [39.0, 49.4], [38.5, 48.7], [38.6, 48.0]]] } },
];

const LON0 = 19, LON1 = 190, LAT0 = 41, LAT1 = 78, W = 1000, H = 520;
const project = (lon: number, lat: number): [number, number] => [((lon - LON0) / (LON1 - LON0)) * W, ((LAT1 - lat) / (LAT1 - LAT0)) * H];
const fmtMoney = (v: number) => Math.round(Number(v || 0)).toLocaleString('ru-RU') + ' ₽';

const findCoord = (name: string): [number, number] | null => {
  const n = String(name || '').toLowerCase().trim();
  if (!n) return null;
  if (COORDS[n]) return COORDS[n];
  for (const key of Object.keys(COORDS)) if (n.includes(key)) return COORDS[key];
  return null;
};
const nearestFed = (lon: number, lat: number) => {
  let best = FED[0], bd = Infinity;
  for (const d of FED) { const dd = ((d.lon - lon) * 0.7) ** 2 + ((d.lat - lat) * 1.6) ** 2; if (dd < bd) { bd = dd; best = d; } }
  return best.key;
};

// Ядро названия региона: убираем «область/край/республика/АО» и т.п. для сопоставления.
const regCore = (s: string) => String(s || '').toLowerCase()
  .replace(/ё/g, 'е')
  .replace(/\b(область|обл|край|республика|респ|автономн(ый|ая|ое)|округ|ао|город|г)\b/g, '')
  .replace(/[^а-я- ]/gi, ' ').replace(/\s+/g, ' ').trim();

const SUBJECT_CORE: Array<[string, string]> = Object.keys(SUBJECT_FED).map((s) => [regCore(s), SUBJECT_FED[s]]);

// Доп. алиасы по корню названия → округ (формы республик, новые регионы и т.п.)
const ALIAS_FED: Array<[string, string]> = [
  ['крым', 'yfo'], ['севастопол', 'yfo'], ['байконур', 'yfo'],
  ['донецк', 'yfo'], ['луганск', 'yfo'], ['херсон', 'yfo'], ['запорож', 'yfo'],
  // республики в разных формах
  ['чуваш', 'pfo'], ['марий', 'pfo'], ['мордов', 'pfo'], ['удмурт', 'pfo'], ['татарст', 'pfo'], ['башкорт', 'pfo'], ['башкир', 'pfo'],
  ['осети', 'skfo'], ['ингуш', 'skfo'], ['чечен', 'skfo'], ['дагест', 'skfo'], ['кабардин', 'skfo'], ['карачаев', 'skfo'],
  ['калмык', 'yfo'], ['адыг', 'yfo'],
  ['карел', 'szfo'], ['коми', 'szfo'],
  ['бурят', 'dfo'], ['саха', 'dfo'], ['якут', 'dfo'],
  ['тыва', 'sfo'], ['тува', 'sfo'], ['хакас', 'sfo'],
];

// Зарубежные регионы (не РФ) — на карту РФ не ложатся, считаем отдельно.
const FOREIGN_MARK = ['могил', 'витебск', 'брестск', 'гродненск', 'гомел', 'минск', 'беларус',
  'ташкент', 'узбек', 'самарканд', 'актобе', 'алматы', 'астана', 'караганд', 'казахст', 'шымкент',
  'бишкек', 'кыргыз', 'ереван', 'армени', 'баку', 'азербайдж', 'тбилис'];
const isForeign = (name: string) => { const n = String(name || '').toLowerCase(); return FOREIGN_MARK.some((m) => n.includes(m)); };

// Округ по названию: сначала по региону (учитывает ВСЕ регионы из отчёта), затем по координатам.
const fedFromName = (name: string): string => {
  const n = String(name || '').trim();
  if (!n) return '';
  if (SUBJECT_FED[n]) return SUBJECT_FED[n];
  const core = regCore(n);
  if (core) {
    for (const [sc, fed] of SUBJECT_CORE) {
      if (!sc) continue;
      if (core === sc || sc.includes(core) || core.includes(sc)) return fed;
    }
    for (const [al, fed] of ALIAS_FED) if (core.includes(al)) return fed;
  }
  const c = findCoord(n);
  if (c) return nearestFed(c[0], c[1]);
  return '';
};

let GEO_CACHE: any = null;
const geomToPath = (geom: any): string => {
  const rings = geom?.type === 'Polygon' ? geom.coordinates : geom?.type === 'MultiPolygon' ? geom.coordinates.flat() : [];
  let d = '';
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) { const [x, y] = project(ring[i][0], ring[i][1]); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    d += 'Z';
  }
  return d;
};

export default function SalesMap({ rows }: { rows: Row[]; accent?: string }) {
  const [hover, setHover] = useState<string | null>(null); // ключ округа
  const [geo, setGeo] = useState<any>(GEO_CACHE);

  useEffect(() => {
    if (GEO_CACHE) { setGeo(GEO_CACHE); return; }
    let alive = true;
    fetch('/ru-regions.geojson').then((r) => r.json()).then((j) => { GEO_CACHE = j; if (alive) setGeo(j); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // агрегируем продажи по округам
  const { byFed, totalSales, offNames, foreignNames } = useMemo(() => {
    const acc: Record<string, { sold: number; sales: number; cities: Array<{ nm: string; sales: number }> }> = {};
    let total = 0; const off: string[] = []; const foreign: string[] = [];
    (rows || []).forEach((r) => {
      const nm = String(r.name || r.key || '').trim();
      const sales = Number(r.sales_net || 0); const sold = Number(r.sold_qty || 0);
      total += sales;
      const k = fedFromName(nm);
      if (!k) { if (nm) { if (isForeign(nm)) foreign.push(nm); else off.push(nm); } return; }
      const a = acc[k] || { sold: 0, sales: 0, cities: [] };
      a.sold += sold; a.sales += sales; a.cities.push({ nm, sales });
      acc[k] = a;
    });
    Object.values(acc).forEach((a) => a.cities.sort((x, y) => y.sales - x.sales));
    return { byFed: acc, totalSales: total, offNames: off, foreignNames: foreign };
  }, [rows]);

  const maxSales = Math.max(0.0001, ...Object.values(byFed).map((a) => a.sales));

  const paths = useMemo(() => {
    if (!geo?.features) return [] as Array<{ d: string; fed: string; name: string; cx: number; cy: number }>;
    return [...geo.features, ...EXTRA_FEATURES].map((f: any) => {
      const ring = f.geometry?.type === 'Polygon' ? (f.geometry.coordinates[0] || [])
        : f.geometry?.type === 'MultiPolygon' ? (f.geometry.coordinates[0]?.[0] || []) : [];
      let sx = 0, sy = 0;
      ring.forEach((pt: number[]) => { const [x, y] = project(pt[0], pt[1]); sx += x; sy += y; });
      const n = ring.length || 1;
      return { d: geomToPath(f.geometry), fed: SUBJECT_FED[f.properties?.name] || '', name: f.properties?.name || '', cx: sx / n, cy: sy / n };
    });
  }, [geo]);

  const fedFill = (key: string) => {
    const d = FED_BY_KEY[key]; if (!d) return '#1e293b';
    return d.color;
  };
  const fedOpacity = (key: string) => {
    const a = byFed[key]; if (!a) return 0.12;
    return 0.3 + 0.65 * (a.sales / maxSales);
  };

  return (
    <div className="relative" data-no-invert>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 ring-1 ring-white/10">
        {!geo && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="14" fill="#64748b">Загрузка карты…</text>}
        {paths.map((p, i) => {
          if (!p.d) return null;
          const on = !!hover && p.fed === hover;
          return (
            <path
              key={i}
              d={p.d}
              fill={p.fed ? fedFill(p.fed) : '#243044'}
              fillOpacity={p.fed ? (on ? 0.95 : fedOpacity(p.fed)) : 0.15}
              stroke={on ? '#ffffff' : '#0b1220'}
              strokeWidth={on ? 1.1 : 0.4}
              style={{ transition: 'fill-opacity 0.12s', cursor: p.fed ? 'pointer' : 'default' }}
              onMouseEnter={() => p.fed && setHover(p.fed)}
              onMouseLeave={() => setHover((h) => (h === p.fed ? null : h))}
            />
          );
        })}
        {/* подписи округов */}
        {geo && FED.map((d) => {
          const [x, y] = project(d.lon, d.lat);
          const a = byFed[d.key];
          const share = totalSales > 0 && a ? a.sales / totalSales * 100 : 0;
          return (
            <g key={d.key} style={{ pointerEvents: 'none' }}>
              <text x={x} y={y} textAnchor="middle" fontSize="13" fontWeight={800} fill="#fff" stroke="#0b1220" strokeWidth={0.5} opacity={hover === null || hover === d.key ? 1 : 0.55}>{d.short}</text>
              <text x={x} y={y + 14} textAnchor="middle" fontSize="11" fill="#e2e8f0" opacity={hover === null || hover === d.key ? 0.9 : 0.4}>{share.toFixed(0)}%</text>
            </g>
          );
        })}
      </svg>

      {hover && byFed[hover] && (() => {
        const d = FED_BY_KEY[hover]; const a = byFed[hover];
        const [x, y] = project(d.lon, d.lat);
        const left = `${(x / W) * 100}%`; const top = `${(y / H) * 100}%`; const flip = x > W * 0.6;
        const share = totalSales > 0 ? a.sales / totalSales * 100 : 0;
        return (
          <div className="absolute z-10 pointer-events-none" style={{ left, top, transform: `translate(${flip ? '-105%' : '12px'}, -60%)` }}>
            <div className="rounded-xl bg-white shadow-xl ring-1 ring-slate-200 px-3 py-2 text-xs min-w-[200px]">
              <div className="font-bold text-slate-900 mb-1">{d.name} ФО</div>
              <div className="flex justify-between gap-3 text-slate-600"><span>Продано</span><span className="font-medium text-slate-800">{a.sold.toLocaleString('ru-RU')} шт</span></div>
              <div className="flex justify-between gap-3 text-slate-600"><span>Продажи</span><span className="font-medium text-slate-800">{fmtMoney(a.sales)}</span></div>
              <div className="flex justify-between gap-3 text-slate-600"><span>Доля</span><span className="font-medium text-indigo-600">{share.toFixed(1)}%</span></div>
              <div className="flex justify-between gap-3 text-slate-600"><span>Городов</span><span className="font-medium text-slate-800">{a.cities.length}</span></div>
              {a.cities.length > 0 && <div className="mt-1 pt-1 border-t border-slate-100 text-[11px] text-slate-500">Топ: {a.cities.slice(0, 3).map((c) => c.nm).join(', ')}</div>}
            </div>
          </div>
        );
      })()}

      {foreignNames.length > 0 && <div className="mt-2 text-[11px] text-slate-400">🌍 Зарубежье ({foreignNames.length}): {foreignNames.slice(0, 10).join(', ')}{foreignNames.length > 10 ? '…' : ''}</div>}
      {offNames.length > 0 && <div className="mt-1 text-[11px] text-slate-400">Без региона ({offNames.length}): {offNames.slice(0, 10).join(', ')}{offNames.length > 10 ? '…' : ''}</div>}
    </div>
  );
}
