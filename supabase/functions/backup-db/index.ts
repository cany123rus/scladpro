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

    // Defaults from Dashboard.tsx
    let botToken = '8535851324:AAGug52myT700ifTAlha_APm__ykSpIS1TM'
    let chatId = '498924112'

    if (settings) {
      const tokenSetting = settings.find(s => s.key === 'backup_bot_token')
      const chatSetting = settings.find(s => s.key === 'backup_chat_id')
      
      if (tokenSetting?.value) botToken = tokenSetting.value
      if (chatSetting?.value) chatId = chatSetting.value
    }

    // 2. Fetch Data
    const tables = ['suppliers', 'products', 'supplies', 'boxes', 'supply_items', 'employees', 'receptions', 'work_logs', 'work_rates']
    const dbData: any = {}

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.error(`Error fetching ${table}:`, error)
        // Continue with other tables or throw? Let's continue but log it.
        dbData[table] = []
      } else {
        dbData[table] = data || []
      }
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
