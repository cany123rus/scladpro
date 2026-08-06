/*
 * Проверка раскладки по коробкам на живых данных склада.
 *
 * Берём реальные коробки Власенко из базы, придумываем лист подбора из тех же
 * товаров и смотрим: сходится ли количество, сколько коробок пришлось вскрыть
 * и не появилась ли недостача там, где товар есть.
 */
import { createClient } from '@supabase/supabase-js';
import { planPicking, stockFromBoxes, type BoxContent } from '../src/utils/boxPicking';

const url = process.env.VITE_SUPABASE_URL ?? 'https://blygwkxjogmioebutiwn.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY ?? '';
if (!key) throw new Error('нет VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

const SUPPLIER = '3559d1bc-a5ce-4b11-bec8-f05ad85e4f8f'; // ИП Власенко

// Коробки открытых поставок: именно они и лежат на складе.
const { data: supplies } = await supabase
  .from('supplies').select('id, name, status').eq('supplier_id', SUPPLIER).is('deleted_at', null);
const open = (supplies ?? []).filter((s: any) => s.status === 'open').slice(0, 6);
console.log(`поставок открытых: ${open.length} — ${open.map((s: any) => s.name).join(', ')}`);

const { data: boxRows } = await supabase
  .from('boxes').select('id, name, supply_id').in('supply_id', open.map((s: any) => s.id)).is('deleted_at', null);
const boxes = (boxRows ?? []) as any[];
console.log(`коробок: ${boxes.length}`);

const byId = new Map(boxes.map((b) => [b.id, b]));
const supplyName = new Map(open.map((s: any) => [s.id, s.name]));

// Единицы: одна строка supply_items — одна физическая штука.
const content = new Map<string, Map<string, number>>();
const CHUNK = 40;
for (let i = 0; i < boxes.length; i += CHUNK) {
  const ids = boxes.slice(i, i + CHUNK).map((b) => b.id);
  const { data: items } = await supabase
    .from('supply_items').select('box_id, product_id').in('box_id', ids).is('deleted_at', null).limit(50000);
  for (const it of (items ?? []) as any[]) {
    const inner = content.get(it.box_id) ?? new Map<string, number>();
    inner.set(it.product_id, (inner.get(it.product_id) ?? 0) + 1);
    content.set(it.box_id, inner);
  }
}

const productIds = [...new Set([...content.values()].flatMap((m) => [...m.keys()]))];
const barcode = new Map<string, { barcode: string; name: string }>();
for (let i = 0; i < productIds.length; i += 200) {
  const { data: prods } = await supabase
    .from('products').select('id, barcode, name').in('id', productIds.slice(i, i + 200));
  for (const p of (prods ?? []) as any[]) barcode.set(p.id, { barcode: String(p.barcode), name: String(p.name) });
}

const list: BoxContent[] = [...content].map(([boxId, m]) => ({
  box: String(byId.get(boxId)?.name ?? boxId),
  place: supplyName.get(byId.get(boxId)?.supply_id) as string | undefined,
  items: [...m].map(([pid, qty]) => ({ barcode: barcode.get(pid)?.barcode ?? '', qty })).filter((x) => x.barcode),
}));

const stock = stockFromBoxes(list);
const units = stock.reduce((a, s) => a + s.qty, 0);
console.log(`товаров ${stock.length}, единиц ${units}\n`);

/*
 * Лист подбора: берём двадцать случайных товаров по 1–5 штук. Псевдослучайно
 * с фиксированным зерном, чтобы прогон повторялся.
 */
let seed = 42;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const picked = [...stock].sort(() => rnd() - 0.5).slice(0, 20);
const lines = picked.map((s) => ({ barcode: s.barcode, qty: Math.min(s.qty, 1 + Math.floor(rnd() * 5)) }));

const plan = planPicking(list, lines);
console.log(`лист подбора: позиций ${plan.lines.length}, штук ${plan.totalNeed}`);
console.log(`собрано ${plan.totalPicked}, недостача ${plan.totalMissing}`);
console.log(`вскрыто коробок: ${plan.boxes.length} из ${list.length}\n`);

for (const l of plan.lines.slice(0, 8)) {
  console.log(
    `  ${l.barcode} ×${l.need} → ${l.from.map((f) => `коробка ${f.box}${f.place ? ` (${f.place})` : ''} ×${f.qty}`).join(', ') || 'НЕТ'}` +
      `${l.missing ? ` · не хватает ${l.missing}` : ''}`,
  );
}

// Проверки, которые должны выполняться при любых данных.
const bad: string[] = [];
for (const l of plan.lines) {
  const got = l.from.reduce((a, f) => a + f.qty, 0);
  if (got + l.missing !== l.need) bad.push(`${l.barcode}: ${got} + ${l.missing} ≠ ${l.need}`);
  if (l.from.some((f) => f.qty <= 0)) bad.push(`${l.barcode}: нулевой отбор`);
}
// Из коробки нельзя взять больше, чем в ней лежало.
const usedPerBox = new Map<string, number>();
for (const l of plan.lines) for (const f of l.from) usedPerBox.set(f.box, (usedPerBox.get(f.box) ?? 0) + f.qty);
for (const [box, used] of usedPerBox) {
  const had = list.filter((b) => b.box === box).reduce((a, b) => a + b.items.reduce((x, i) => x + i.qty, 0), 0);
  if (used > had) bad.push(`коробка ${box}: взяли ${used}, было ${had}`);
}
// Товар был в наличии — недостачи быть не должно.
for (const l of plan.lines) {
  const have = stock.find((s) => s.barcode === l.barcode)?.qty ?? 0;
  if (l.missing > 0 && have >= l.need) bad.push(`${l.barcode}: недостача ${l.missing}, хотя на складе ${have}`);
}

console.log(`\nпроверки: ${bad.length === 0 ? 'чисто' : 'НАРУШЕНИЯ'}`);
for (const b of bad.slice(0, 10)) console.log('  ', b);

/*
 * Сравнение с наивным подбором «первая попавшаяся коробка»: ради этой разницы
 * алгоритм и написан.
 */
const naive = new Set<string>();
const left = new Map(lines.map((l) => [l.barcode, l.qty]));
for (const b of list) {
  for (const it of b.items) {
    const want = left.get(it.barcode) ?? 0;
    if (want <= 0) continue;
    const use = Math.min(want, it.qty);
    left.set(it.barcode, want - use);
    naive.add(b.box);
  }
}
console.log(`\nнаивно (первая попавшаяся): ${naive.size} коробок, жадно: ${plan.boxes.length}`);
