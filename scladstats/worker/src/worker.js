import { syncSales } from './jobs/syncSales.js';
import { syncMarketQueries } from './jobs/syncMarket.js';

const ACCOUNT_ID = process.env.WB_ACCOUNT_ID || null;

async function runSalesSync() {
  if (!ACCOUNT_ID) {
    console.log('[worker] set WB_ACCOUNT_ID in env for account sync');
    return;
  }

  try {
    const result = await syncSales(ACCOUNT_ID);
    console.log('[syncSales] ok', result);
  } catch (e) {
    console.error('[syncSales] failed', e.message);
  }
}

async function runMarketSync() {
  try {
    const result = await syncMarketQueries();
    console.log('[syncMarket] ok', result);
  } catch (e) {
    console.error('[syncMarket] failed', e.message);
  }
}

console.log('[ScladSTATS worker] started');
await runSalesSync();
await runMarketSync();

setInterval(runSalesSync, 15 * 60 * 1000);
setInterval(runMarketSync, 60 * 60 * 1000);
