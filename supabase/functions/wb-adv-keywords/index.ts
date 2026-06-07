import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADV = 'https://advert-api.wildberries.ru'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function wbFetch(url: string, opts: any, tries = 3): Promise<Response> {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, opts)
    if (r.status === 429) { await sleep(Math.min(40000, 12000 * (i + 1))); continue }
    return r
  }
  throw new Error('WB API rate limited (429)')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const url = new URL(req.url)
    const supplierId = url.searchParams.get('supplier_id') || body.supplier_id
    const advertId = Number(url.searchParams.get('advert_id') || body.advert_id)
    const from = url.searchParams.get('from') || body.from
    const to = url.searchParams.get('to') || body.to
    if (!supplierId || !advertId) throw new Error('supplier_id and advert_id required')

    const { data: sup, error } = await supabase.from('suppliers').select('wb_api_token, wb_adv_api_token').eq('id', supplierId).single()
    if (error) throw error
    const token = String(sup?.wb_adv_api_token || sup?.wb_api_token || '').trim()
    if (!token) throw new Error('no token')

    // PROBE-режим: вернуть статусы кандидатов эндпоинтов
    if (url.searchParams.get('probe') || body.probe) {
      const today = new Date().toISOString().slice(0, 10)
      const ago = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
      const U = `${ADV}/adv/v0/normquery/stats`
      const probes: Array<[string, string, any]> = [
        ['POST', U, { Items: [advertId] }],
        ['POST', U, { Items: [{ advertId, from: ago, to: today }] }],
        ['POST', U, { Items: [{ id: advertId, from: ago, to: today }] }],
        ['POST', U, { Items: [{ advertId, dates: [today] }] }],
        ['POST', U, { Items: [{ advertId, begin: ago, end: today }] }],
        ['POST', U, { Items: [{ advertId }] }],
      ]
      const out: any[] = []
      for (const [m, u, b] of probes) {
        try {
          const r = await fetch(u, { method: m, headers: { Authorization: token, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined })
          out.push({ m, u: u.replace(ADV, ''), status: r.status, body: (await r.text()).slice(0, 200) })
        } catch (e: any) { out.push({ m, u, err: String(e?.message || e) }) }
        await sleep(900)
      }
      return new Response(JSON.stringify({ probe: out }, null, 2), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1) Поисковые фразы кампании: GET /adv/v1/stat/words?id=
    const kwAgg = new Map<string, { keyword: string; views: number; clicks: number; sum: number }>()
    let clusters: any[] = []; let excluded: string[] = []
    let kwErr = ''
    try {
      const r = await wbFetch(`${ADV}/adv/v1/stat/words?id=${advertId}`, { headers: { Authorization: token } })
      if (r.ok) {
        const j = await r.json()
        ;(j?.stat || []).forEach((s: any) => {
          const k = String(s?.keyword || '').trim()
          if (!k || /всего по кампании/i.test(k)) return   // первая строка — итог
          const cur = kwAgg.get(k) || { keyword: k, views: 0, clicks: 0, sum: 0 }
          cur.views += Number(s?.views || 0); cur.clicks += Number(s?.clicks || 0); cur.sum += Number(s?.sum || 0)
          kwAgg.set(k, cur)
        })
        const w = j?.words || {}
        clusters = (w?.keywords || []).map((c: any) => ({ cluster: c?.keyword || '', count: Number(c?.count || 0), keywords: [] }))
        excluded = w?.excluded || []
      } else if (r.status !== 204) { kwErr = `stat/words ${r.status}: ${(await r.text()).slice(0, 80)}` }
    } catch (e: any) { kwErr = String(e?.message || e).slice(0, 80) }

    // 2) Если v1 пуст — авто-кампания, кластеры через /adv/v2/auto/stat-words
    if (!kwAgg.size && !clusters.length) {
      try {
        await sleep(800)
        const r = await wbFetch(`${ADV}/adv/v2/auto/stat-words?id=${advertId}`, { headers: { Authorization: token } })
        if (r.ok) {
          const j = await r.json()
          clusters = (j?.clusters || j?.words?.clusters || []).map((c: any) => ({ cluster: c?.cluster || c?.name || '', count: Number(c?.count || 0), keywords: c?.keywords || [] }))
          excluded = j?.excluded || j?.words?.excluded || excluded
        }
      } catch (_) {}
    }

    const keywords = [...kwAgg.values()].map((k) => ({
      ...k, ctr: k.views ? k.clicks / k.views * 100 : 0, cpc: k.clicks ? k.sum / k.clicks : 0,
    }))

    return new Response(JSON.stringify({ success: true, advert_id: advertId, keywords, clusters, excluded, kwErr }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
