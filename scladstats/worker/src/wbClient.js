const WB_BASE_URL = process.env.WB_API_BASE_URL || 'https://statistics-api.wildberries.ru';

function headers() {
  const token = process.env.WB_API_TOKEN;
  if (!token) throw new Error('WB_API_TOKEN is not set');
  return {
    Authorization: token,
    'Content-Type': 'application/json'
  };
}

async function wbFetch(pathWithQuery) {
  const resp = await fetch(`${WB_BASE_URL}${pathWithQuery}`, {
    method: 'GET',
    headers: headers()
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`WB API error ${resp.status}: ${text}`);
  }

  return resp.json();
}

export async function fetchSales({ dateFrom }) {
  return wbFetch(`/api/v1/supplier/sales?dateFrom=${encodeURIComponent(dateFrom)}`);
}

export async function fetchStocks({ dateFrom }) {
  return wbFetch(`/api/v1/supplier/stocks?dateFrom=${encodeURIComponent(dateFrom)}`);
}

export async function fetchMarketByQuery(searchQuery) {
  // Публичная выдача WB (без auth), используем для market intelligence
  const url = new URL('https://search.wb.ru/exactmatch/ru/common/v4/search');
  url.searchParams.set('appType', '1');
  url.searchParams.set('curr', 'rub');
  url.searchParams.set('dest', '-1257786');
  url.searchParams.set('query', searchQuery);
  url.searchParams.set('resultset', 'catalog');
  url.searchParams.set('sort', 'popular');
  url.searchParams.set('spp', '30');
  url.searchParams.set('page', '1');

  const resp = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json'
    }
  });

  if (!resp.ok) {
    throw new Error(`WB market search ${resp.status}`);
  }

  const json = await resp.json();
  return json?.data?.products || [];
}
