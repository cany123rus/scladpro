import { pool, getSyncCursor, setSyncCursor } from '../db.js';
import { fetchSales } from '../wbClient.js';

export async function syncSales(accountId) {
  const cursor = await getSyncCursor(accountId, 'orders_sales');
  const dateFrom = cursor || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 19);

  const rows = await fetchSales({ dateFrom });
  if (!Array.isArray(rows)) return { inserted: 0, fetched: 0 };

  let inserted = 0;
  let maxTs = cursor;

  for (const r of rows) {
    const eventAt = r.date || r.lastChangeDate || new Date().toISOString();
    const sku = String(r.supplierArticle || r.nmId || r.barcode || 'unknown');
    const qty = Number(r.quantity || 0);
    const price = Number(r.forPay || r.totalPrice || 0);
    const revenue = Number(r.forPay || r.finishedPrice || r.totalPrice || 0);
    const sourceHash = `${accountId}:${eventAt}:${sku}:${qty}:${revenue}`;

    await pool.query(
      `insert into sales_events_raw(account_id, source_hash, event_at, sku, qty, price, revenue, payload_json)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (account_id, source_hash) do nothing`,
      [accountId, sourceHash, eventAt, sku, qty, price, revenue, r]
    );

    inserted++;
    if (!maxTs || new Date(eventAt) > new Date(maxTs)) maxTs = eventAt;
  }

  if (maxTs) await setSyncCursor(accountId, 'orders_sales', maxTs);
  return { inserted, fetched: rows.length, cursor: maxTs };
}
