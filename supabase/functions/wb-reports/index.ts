import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STAT = 'https://statistics-api.wildberries.ru'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isoDaysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10)
}

function clampSpan(dateFrom: string, dateTo: string, maxDays: number) {
  try {
    const f = new Date(dateFrom + 'T00:00:00Z').getTime()
    const t = new Date(dateTo + 'T00:00:00Z').getTime()
    if (Number.isFinite(f) && Number.isFinite(t) && (t - f) > maxDays * 86400000) {
      return { dateFrom: new Date(t - maxDays * 86400000).toISOString().slice(0, 10), clamped: true }
    }
  } catch (_) {}
  return { dateFrom, clamped: false }
}

// Чистый прокси к WB reportDetailByPeriod: стримим тело ответа БЕЗ разбора в памяти
// функции (иначе на больших отчётах падает 546/WORKER_LIMIT). Группировку, маппинг
// в xlsx и импорт делает фронт — у браузера достаточно памяти.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    let body: any = {}
    try { if (req.method === 'POST') body = await req.json() } catch (_) {}
    const url = new URL(req.url)
    const supplierId = url.searchParams.get('supplier_id') || body?.supplier_id
    if (!supplierId) return new Response(JSON.stringify({ error: 'supplier_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: sup, error } = await supabase.from('suppliers').select('id, name, wb_api_token').eq('id', supplierId).single()
    if (error) throw error
    const token = String(sup?.wb_api_token || '').trim()
    if (!token) return new Response(JSON.stringify({ error: 'У поставщика не задан WB API-токен (Статистика)' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const days = Math.min(31, Math.max(1, Number(body?.days || url.searchParams.get('days') || 9)))
    const dateTo = body?.dateTo || url.searchParams.get('dateTo') || isoDaysAgo(0)
    let dateFrom = body?.dateFrom || url.searchParams.get('dateFrom') || isoDaysAgo(days)
    // Окно зажимаем до 31 дня — больше браузеру тоже тяжело, и WB лимитирует.
    dateFrom = clampSpan(dateFrom, dateTo, 31).dateFrom
    const rrdid = Number(body?.rrdid || url.searchParams.get('rrdid') || 0)
    const limit = Math.min(100000, Math.max(1, Number(body?.limit || url.searchParams.get('limit') || 100000)))

    const wbUrl = `${STAT}/api/v5/supplier/reportDetailByPeriod?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&limit=${limit}&rrdid=${rrdid}`

    let r: Response | null = null
    for (let i = 0; i < 5; i++) {
      r = await fetch(wbUrl, { headers: { Authorization: token } })
      if (r.status === 429) {
        const ra = Number(r.headers.get('Retry-After')) || 0
        await sleep(ra > 0 ? ra * 1000 : Math.min(65000, 20000 * (i + 1)))
        continue
      }
      break
    }
    if (!r) return new Response(JSON.stringify({ error: 'Нет ответа от WB' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (!r.ok) {
      const txt = (await r.text()).slice(0, 300)
      return new Response(JSON.stringify({ error: `WB ${r.status}: ${txt}` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    // Стримим тело WB как есть (это JSON-массив строк отчёта) + мета в заголовках.
    return new Response(r.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'x-date-from': dateFrom,
        'x-date-to': dateTo,
        'x-supplier-name': encodeURIComponent(String(sup?.name || '')),
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
