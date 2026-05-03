import { Router } from 'express';
import { query } from '../db/pool.js';

export const marketRouter = Router();

const demoProducts = [
  { wb_nm_id: 100001, name: 'Термокружка 450мл', brand: 'DemoBrand', category: 'Кухня', last_seen_at: new Date().toISOString(), price: 1190, sale_price: 890, rating: 4.8, feedbacks: 1243, orders_est: 210, revenue_est: 186900 },
  { wb_nm_id: 100002, name: 'Органайзер для специй', brand: 'HomeSet', category: 'Дом', last_seen_at: new Date().toISOString(), price: 990, sale_price: 690, rating: 4.7, feedbacks: 932, orders_est: 145, revenue_est: 100050 },
  { wb_nm_id: 100003, name: 'USB-C кабель 2м', brand: 'WirePro', category: 'Электроника', last_seen_at: new Date().toISOString(), price: 650, sale_price: 390, rating: 4.6, feedbacks: 5320, orders_est: 520, revenue_est: 202800 }
];

const demoNiches = [
  { query: 'термокружка', category: 'Кухня', opportunity_score: 78.4, trend_score: 64.2, competition_density: 0.41, avg_price: 920, demand_est: 540000 },
  { query: 'органайзер для кухни', category: 'Дом', opportunity_score: 71.1, trend_score: 59.8, competition_density: 0.36, avg_price: 780, demand_est: 420000 },
  { query: 'кабель usb c', category: 'Электроника', opportunity_score: 62.7, trend_score: 47.4, competition_density: 0.72, avg_price: 430, demand_est: 690000 }
];

async function safeRows(sql, params = []) {
  try {
    const data = await query(sql, params);
    return data.rows;
  } catch (e) {
    console.error('[market route]', e.message);
    return [];
  }
}

function mapWbProduct(p) {
  const salePrice = Number((p.salePriceU ?? p.salePrice ?? 0)) / 100;
  const price = Number((p.priceU ?? p.price ?? salePrice * 100)) / 100;
  return {
    wb_nm_id: Number(p.id || p.nmId || 0),
    name: p.name || '',
    brand: p.brand || '',
    category: p.entity || '',
    last_seen_at: new Date().toISOString(),
    price: price || null,
    sale_price: salePrice || null,
    rating: Number(p.rating || 0),
    feedbacks: Number(p.feedbacks || 0),
    orders_est: null,
    revenue_est: null
  };
}

async function fetchByNmId(nmId) {
  try {
    const url = new URL('https://search.wb.ru/exactmatch/ru/common/v4/search');
    url.searchParams.set('appType', '1');
    url.searchParams.set('curr', 'rub');
    url.searchParams.set('dest', '-1257786');
    url.searchParams.set('query', String(nmId));
    url.searchParams.set('resultset', 'catalog');
    url.searchParams.set('sort', 'popular');
    url.searchParams.set('spp', '30');
    url.searchParams.set('page', '1');

    const resp = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const products = json?.data?.products || [];
    const exact = products.find((x) => String(x.id) === String(nmId)) || products[0];
    if (!exact) return null;

    return mapWbProduct(exact);
  } catch (e) {
    console.error('[market nm fetch]', e.message);
    return null;
  }
}

marketRouter.get('/products', async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const sku = String(req.query.sku || '').trim();
  const limit = Math.min(Number(req.query.limit || 50), 200);

  const rows = await safeRows(
    `select p.wb_nm_id, p.name, p.brand, p.category, p.last_seen_at,
            s.price, s.sale_price, s.rating, s.feedbacks, s.orders_est, s.revenue_est
     from market_products p
     left join lateral (
       select price, sale_price, rating, feedbacks, orders_est, revenue_est
       from market_product_snapshots mps
       where mps.wb_nm_id = p.wb_nm_id
       order by mps.snapshot_at desc
       limit 1
     ) s on true
     where (
       ($1 = '' or p.name ilike '%' || $1 || '%' or p.brand ilike '%' || $1 || '%')
       and ($2 = '' or cast(p.wb_nm_id as text) ilike '%' || $2 || '%')
     )
     order by p.last_seen_at desc
     limit $3`,
    [q, sku, limit]
  );

  if (rows.length) return res.json({ items: rows, total: rows.length, source: 'db' });

  if (sku && /^\d+$/.test(sku)) {
    const wbItem = await fetchByNmId(sku);
    if (wbItem) {
      return res.json({ items: [wbItem], total: 1, source: 'wb-live' });
    }
  }

  if (q && !sku) {
    try {
      const url = new URL('https://search.wb.ru/exactmatch/ru/common/v4/search');
      url.searchParams.set('appType', '1');
      url.searchParams.set('curr', 'rub');
      url.searchParams.set('dest', '-1257786');
      url.searchParams.set('query', q);
      url.searchParams.set('resultset', 'catalog');
      url.searchParams.set('sort', 'popular');
      url.searchParams.set('spp', '30');
      url.searchParams.set('page', '1');
      const resp = await fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
      if (resp.ok) {
        const json = await resp.json();
        const real = (json?.data?.products || []).slice(0, limit).map(mapWbProduct).filter(x => x.wb_nm_id);
        if (real.length) return res.json({ items: real, total: real.length, source: 'wb-live' });
      }
    } catch {}
  }

  const items = demoProducts
    .filter((p) => (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)))
    .filter((p) => (!sku || String(p.wb_nm_id).includes(sku)))
    .slice(0, limit);

  if (!items.length && sku) {
    return res.json({
      items: [],
      total: 0,
      source: 'none',
      hint: 'SKU не найден: возможно это не nmId, либо WB временно ограничил публичные запросы (429).'
    });
  }

  return res.json({ items, total: items.length, source: 'demo' });
});

marketRouter.get('/products/:nmId/history', async (req, res) => {
  const nmId = Number(req.params.nmId);
  const days = Math.min(Number(req.query.days || 30), 180);

  const rows = await safeRows(
    `select snapshot_date, avg(sale_price) as sale_price, avg(price) as price,
            avg(rating) as rating, max(feedbacks) as feedbacks,
            avg(orders_est) as orders_est, avg(revenue_est) as revenue_est
     from market_product_snapshots
     where wb_nm_id = $1 and snapshot_date >= current_date - ($2::int || ' days')::interval
     group by snapshot_date
     order by snapshot_date asc`,
    [nmId, days]
  );

  if (rows.length) return res.json({ nmId, points: rows, source: 'db' });

  const points = Array.from({ length: Math.min(days, 30) }).map((_, i) => {
    const d = new Date(Date.now() - (Math.min(days, 30) - i) * 86400000);
    return {
      snapshot_date: d.toISOString().slice(0, 10),
      sale_price: 850 + Math.round(Math.sin(i / 3) * 40),
      price: 1100 + Math.round(Math.sin(i / 4) * 35),
      rating: 4.6 + Math.sin(i / 7) * 0.1,
      feedbacks: 500 + i * 8,
      orders_est: 120 + Math.round(Math.sin(i / 2) * 20),
      revenue_est: 100000 + Math.round(Math.sin(i / 2) * 18000)
    };
  });

  return res.json({ nmId, points, source: 'demo' });
});

marketRouter.get('/niches', async (_, res) => {
  const rows = await safeRows(
    `select mq.query, mq.category, mnd.day, mnd.products_count, mnd.avg_price,
            mnd.demand_est, mnd.competition_density, mnd.trend_score,
            mnd.entry_barrier_score, mnd.opportunity_score
     from market_niche_daily mnd
     join market_queries mq on mq.id = mnd.query_id
     where mnd.day = (select max(day) from market_niche_daily)
     order by mnd.opportunity_score desc
     limit 100`
  );

  if (rows.length) return res.json({ items: rows, source: 'db' });

  return res.json({ items: demoNiches, source: 'demo' });
});

marketRouter.get('/opportunities', async (_, res) => {
  const rows = await safeRows(
    `select mq.query, mq.category, mnd.opportunity_score, mnd.trend_score,
            mnd.competition_density, mnd.avg_price, mnd.demand_est
     from market_niche_daily mnd
     join market_queries mq on mq.id = mnd.query_id
     where mnd.day = (select max(day) from market_niche_daily)
     order by mnd.opportunity_score desc
     limit 50`
  );

  if (rows.length) return res.json({ items: rows, source: 'db' });
  return res.json({ items: demoNiches, source: 'demo' });
});

marketRouter.get('/status', async (_, res) => {
  const rows = await safeRows(
    `select
      (select count(*) from market_queries where is_active = true) as active_queries,
      (select count(*) from market_products) as products_count,
      (select count(*) from market_product_snapshots where snapshot_date = current_date) as snapshots_today`
  );

  if (rows.length) return res.json({ ...rows[0], source: 'db' });
  return res.json({ active_queries: 3, products_count: 3, snapshots_today: 120, source: 'demo' });
});
