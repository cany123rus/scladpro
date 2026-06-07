import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADV = 'https://advert-api.wildberries.ru'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function wbFetch(url: string, opts: any, tries = 4): Promise<Response> {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, opts)
    if (r.status === 429) {
      const ra = Number(r.headers.get('Retry-After')) || 0
      await sleep(ra > 0 ? ra * 1000 : Math.min(70000, 20000 * (i + 1)))
      continue
    }
    return r
  }
  throw new Error('WB API rate limited (429)')
}

function isoDaysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10)
}

async function syncSupplier(supabase: any, supplier: any, days: number, beginArg?: string, endArg?: string) {
  const token = String(supplier.wb_adv_api_token || supplier.wb_api_token || '').trim()
  if (!token) return { ok: false, campaigns: 0, message: 'no token' }

  // 1) campaign ids
  const cntRes = await wbFetch(`${ADV}/adv/v1/promotion/count`, { headers: { Authorization: token } })
  if (!cntRes.ok) return { ok: false, campaigns: 0, message: `count ${cntRes.status}: ${(await cntRes.text()).slice(0, 120)}` }
  const cnt = await cntRes.json()
  const ids: number[] = []
  ;(cnt?.adverts || []).forEach((g: any) => (g?.advert_list || []).forEach((a: any) => { const id = Number(a?.advertId); if (id) ids.push(id) }))
  if (!ids.length) return { ok: true, campaigns: 0, message: 'no campaigns' }

  // 2) names
  const nameMap = new Map<number, string>()
  for (let i = 0; i < ids.length; i += 50) {
    if (i > 0) await sleep(700)
    try {
      const r = await wbFetch(`${ADV}/adv/v1/promotion/adverts`, { method: 'POST', headers: { Authorization: token, 'Content-Type': 'application/json' }, body: JSON.stringify(ids.slice(i, i + 50)) })
      if (r.ok) { const arr = await r.json(); (arr || []).forEach((c: any) => nameMap.set(Number(c?.advertId), c?.name || `#${c?.advertId}`)) }
    } catch (_) {}
  }

  // 3) fullstats — GET /adv/v3/fullstats (POST v2 устарел с 23.10.2025).
  //    Параметры: ids (через запятую), beginDate, endDate. Макс. 31 день за запрос.
  const wins: Array<[string, string]> = []
  if (beginArg && endArg) {
    wins.push([beginArg, endArg])
  } else {
    const begin = isoDaysAgo(days), end = isoDaysAgo(0)
    let ws = new Date(begin + 'T00:00:00Z')
    const we = new Date(end + 'T00:00:00Z')
    while (ws.getTime() <= we.getTime()) {
      const wend = new Date(Math.min(we.getTime(), ws.getTime() + 30 * 86400000))
      wins.push([ws.toISOString().slice(0, 10), wend.toISOString().slice(0, 10)])
      ws = new Date(wend.getTime() + 86400000)
    }
  }
  const rows: any[] = []
  let firstCall = true
  for (let i = 0; i < ids.length; i += 100) {
    const idBatch = ids.slice(i, i + 100).join(',')
    for (const [b, e] of wins) {
      if (!firstCall) await sleep(1500)
      firstCall = false
      const r = await wbFetch(`${ADV}/adv/v3/fullstats?ids=${idBatch}&beginDate=${b}&endDate=${e}`, { headers: { Authorization: token } })
      if (r.status === 204) continue
      if (!r.ok) throw new Error(`fullstats ${r.status}: ${(await r.text()).slice(0, 120)}`)
      const arr = await r.json()
      if (Array.isArray(arr)) {
        arr.forEach((s: any) => {
          const advertId = Number(s?.advertId)
          const cname = nameMap.get(advertId) || `#${advertId}`
          ;(s?.days || []).forEach((d: any) => {
            const date = String(d?.date || '').slice(0, 10)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return
            rows.push({
              supplier_id: supplier.id, advert_id: advertId, date, campaign_name: cname,
              views: Number(d?.views || 0), clicks: Number(d?.clicks || 0), sum: Number(d?.sum || 0),
              atbs: Number(d?.atbs || 0), orders: Number(d?.orders || 0), shks: Number(d?.shks || 0),
              sum_price: Number(d?.sum_price || 0), updated_at: new Date().toISOString(),
            })
          })
        })
      }
    }
  }

  // 4) upsert in chunks
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('wb_adv_stats_daily').upsert(rows.slice(i, i + 500), { onConflict: 'supplier_id,advert_id,date' })
    if (error) throw error
  }

  // 5) retention 90 days
  await supabase.from('wb_adv_stats_daily').delete().eq('supplier_id', supplier.id).lt('date', isoDaysAgo(90))

  return { ok: true, campaigns: ids.length, message: `${rows.length} rows` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const url = new URL(req.url)
    let bodySupplier: any = null, bodyDays: any = null, bodyBegin: any = null, bodyEnd: any = null
    try { if (req.method === 'POST') { const b = await req.json(); bodySupplier = b?.supplier_id; bodyDays = b?.days; bodyBegin = b?.begin; bodyEnd = b?.end } } catch (_) {}
    const onlySupplier = url.searchParams.get('supplier_id') || bodySupplier
    const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') || bodyDays || '7')))
    const begin = url.searchParams.get('begin') || bodyBegin || undefined
    const end = url.searchParams.get('end') || bodyEnd || undefined

    let q = supabase.from('suppliers').select('id, name, wb_api_token, wb_adv_api_token').is('deleted_at', null)
    if (onlySupplier) q = q.eq('id', onlySupplier)
    const { data: suppliers, error } = await q
    if (error) throw error

    const targets = (suppliers || []).filter((s: any) => s.wb_adv_api_token || s.wb_api_token)
    const results: any[] = []
    for (const s of targets) {
      let res: any
      try { res = await syncSupplier(supabase, s, days, begin, end) }
      catch (e: any) { res = { ok: false, campaigns: 0, message: String(e?.message || e).slice(0, 200) } }
      results.push({ supplier_id: s.id, name: s.name, ...res })
      await supabase.from('wb_adv_sync_log').insert({ supplier_id: s.id, ok: res.ok, campaigns: res.campaigns, message: res.message })
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
