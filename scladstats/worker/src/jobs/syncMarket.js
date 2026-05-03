import { pool } from '../db.js';
import { fetchMarketByQuery } from '../wbClient.js';

function estimateOrders(item) {
  const feedbacks = Number(item.feedbacks || item.reviewRating || 0);
  const rating = Number(item.rating || item.reviewRating || 4.5);
  return Math.max(0, Math.round(feedbacks * (0.8 + (rating / 10))));
}

export async function syncMarketQueries() {
  const { rows: queries } = await pool.query(
    'select id, query, category from market_queries where is_active = true order by created_at asc limit 50'
  );

  let snapshotsInserted = 0;

  for (const q of queries) {
    const items = await fetchMarketByQuery(q.query);
    let pos = 0;

    for (const item of items.slice(0, 100)) {
      pos += 1;
      const nmId = Number(item.id || item.nmId || item.nm_id || 0);
      if (!nmId) continue;

      const salePrice = Number((item.salePriceU ?? item.salePrice ?? 0)) / 100;
      const price = Number((item.priceU ?? item.price ?? salePrice * 100)) / 100;
      const rating = Number(item.rating || 0);
      const feedbacks = Number(item.feedbacks || 0);
      const ordersEst = estimateOrders(item);
      const revenueEst = ordersEst * (salePrice || price || 0);

      await pool.query(
        `insert into market_products(wb_nm_id, name, brand, category, seller, first_seen_at, last_seen_at)
         values ($1,$2,$3,$4,$5,now(),now())
         on conflict (wb_nm_id)
         do update set name = excluded.name, brand = excluded.brand, category = excluded.category, seller = excluded.seller, last_seen_at = now()`,
        [nmId, item.name || '', item.brand || '', q.category || item.entity || '', item.supplier || '']
      );

      await pool.query(
        `insert into market_product_snapshots(
          wb_nm_id, query_id, snapshot_date, snapshot_at, price, sale_price, rating, feedbacks,
          stocks_est, orders_est, revenue_est, rank_pos, payload_json
        ) values ($1,$2,current_date,now(),$3,$4,$5,$6,$7,$8,$9,$10,$11)
        on conflict (wb_nm_id, query_id, snapshot_date, rank_pos) do nothing`,
        [nmId, q.id, price || null, salePrice || null, rating || null, feedbacks || 0, null, ordersEst, revenueEst, pos, item]
      );

      snapshotsInserted++;
    }

    await pool.query(
      `insert into market_niche_daily(
        query_id, day, products_count, avg_price, demand_est, competition_density,
        trend_score, entry_barrier_score, opportunity_score
      )
      select
        $1,
        current_date,
        count(*)::int as products_count,
        coalesce(avg(sale_price),0) as avg_price,
        coalesce(sum(revenue_est),0) as demand_est,
        coalesce(count(*)::numeric / 100.0, 0) as competition_density,
        0 as trend_score,
        0 as entry_barrier_score,
        greatest(0, least(100,
          (coalesce(sum(revenue_est),0) / 10000.0)
          - (coalesce(count(*)::numeric / 100.0,0) * 10)
        )) as opportunity_score
      from market_product_snapshots
      where query_id = $1 and snapshot_date = current_date
      on conflict (query_id, day)
      do update set
        products_count = excluded.products_count,
        avg_price = excluded.avg_price,
        demand_est = excluded.demand_est,
        competition_density = excluded.competition_density,
        trend_score = excluded.trend_score,
        entry_barrier_score = excluded.entry_barrier_score,
        opportunity_score = excluded.opportunity_score`,
      [q.id]
    );
  }

  return { queries: queries.length, snapshotsInserted };
}
