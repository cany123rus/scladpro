import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get settings (bot token, chat id)
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['backup_bot_token', 'backup_chat_id'])

    // Bot token / chat from settings (set in DB; no secrets hardcoded).
    let botToken = Deno.env.get('BACKUP_BOT_TOKEN') ?? ''
    let chatId = Deno.env.get('BACKUP_CHAT_ID') ?? ''

    if (settings) {
      const tokenSetting = settings.find(s => s.key === 'backup_bot_token')
      const chatSetting = settings.find(s => s.key === 'backup_chat_id')
      if (tokenSetting?.value) botToken = tokenSetting.value
      if (chatSetting?.value) chatId = chatSetting.value
    }

    if (!botToken || !chatId) {
      throw new Error('Backup bot not configured: set app_settings backup_bot_token and backup_chat_id')
    }

    // 2. Fetch Data — all public tables (minus cache/sensitive), dynamically.
    let tables: string[] = []
    const { data: tableList } = await supabase.rpc('get_backup_tables')
    if (Array.isArray(tableList) && tableList.length) {
      tables = tableList as string[]
    } else {
      tables = ['suppliers', 'supplies', 'supply_items', 'employees', 'receptions', 'work_logs', 'work_rates', 'temporary_workers_logs', 'delivery_logs', 'delivery_items', 'packaging_purchase_log', 'app_settings']
    }
    const dbData: any = {}

    for (const table of tables) {
      // Page through rows so large tables don't get truncated at 1000.
      const rows: any[] = []
      let from = 0
      const pageSize = 1000
      while (true) {
        const { data, error } = await supabase.from(table).select('*').range(from, from + pageSize - 1)
        if (error) { console.error(`Error fetching ${table}:`, error); break }
        if (!data || data.length === 0) break
        rows.push(...data)
        if (data.length < pageSize) break
        from += pageSize
      }
      dbData[table] = rows
    }

    // 3. Prepare File
    const now = new Date()
    // Adjust to MSK (UTC+3) for filename
    const mskDate = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    const timestamp = mskDate.toISOString().split('T')[0]
    const hour = mskDate.getUTCHours() // getUTCHours of MSK date is the MSK hour
    
    const fileName = `backup_${timestamp}_${hour}h.json`
    const fileContent = JSON.stringify(dbData, null, 2)
    const blob = new Blob([fileContent], { type: 'application/json' })

    // 4. Send to Telegram
    const formData = new FormData()
    formData.append('chat_id', chatId)
    formData.append('document', blob, fileName)
    formData.append('caption', `Автоматическая выгрузка базы данных (Server)\nВремя: ${mskDate.toLocaleString('ru-RU')}`)

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    })

    const tgData = await tgRes.json()

    if (!tgData.ok) {
      throw new Error(`Telegram Error: ${tgData.description}`)
    }

    // 5. Log success
    const { data: logSetting } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'database_backup_logs')
        .maybeSingle()

    let currentLogs: any[] = []
    if (logSetting?.value) {
        try {
            currentLogs = typeof logSetting.value === 'string' ? JSON.parse(logSetting.value) : logSetting.value
        } catch {}
    }

    const newLog = {
        version: `Backup (Server) ${mskDate.toLocaleString('ru-RU')}`,
        date: mskDate.toLocaleDateString(),
        details: 'Автоматическая выгрузка системы (Edge Function)'
    }

    await supabase.from('app_settings').upsert({
        key: 'database_backup_logs',
        value: JSON.stringify([newLog, ...currentLogs])
    })

    return new Response(JSON.stringify({ success: true, telegram: tgData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
