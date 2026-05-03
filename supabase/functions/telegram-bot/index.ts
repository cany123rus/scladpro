import { createClient } from 'jsr:@supabase/supabase-js@2';

const BOT_TOKEN = '8507409009:AAEyHiINhdM8el6Zld2devdlqxheF-X2LXA';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (req.method === 'GET') {
        return new Response("Telegram Bot Webhook is active");
    }

    const update = await req.json();
    
    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;

      // Handle /start
      if (text === '/start') {
        await sendTelegramMessage(chatId, "Добро пожаловать! Нажмите кнопку ниже, чтобы отправить файл.", {
            keyboard: [[{ text: "Отправить файл" }]],
            resize_keyboard: true,
            one_time_keyboard: false
        });
        return new Response('ok');
      }

      // Handle "Отправить файл" button
      if (text === 'Отправить файл') {
        await sendTelegramMessage(chatId, "Пожалуйста, прикрепите файл (документ или фото) к сообщению.");
        return new Response('ok');
      }

      // Handle Document or Photo
      let fileId, fileName, mimeType;

      if (message.document) {
        fileId = message.document.file_id;
        fileName = message.document.file_name || 'unknown';
        mimeType = message.document.mime_type;
      } else if (message.photo) {
        const photo = message.photo[message.photo.length - 1];
        fileId = photo.file_id;
        fileName = `photo_${Date.now()}.jpg`;
        mimeType = 'image/jpeg';
      }

      if (fileId) {
        // 1. Identify Supplier
        const { data: supplier, error: supplierError } = await supabase
            .from('suppliers')
            .select('id, name')
            .eq('telegram_chat_id', chatId.toString())
            .single();

        if (supplierError || !supplier) {
            await sendTelegramMessage(chatId, "Вы не зарегистрированы как поставщик. Пожалуйста, обратитесь к администратору.");
            return new Response('ok');
        }

        // 2. Get File Path from Telegram
        const fileInfo = await getTelegramFileInfo(fileId);
        if (!fileInfo) {
            await sendTelegramMessage(chatId, "Ошибка при получении файла.");
            return new Response('ok');
        }

        // 3. Download File
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
        const fileResponse = await fetch(fileUrl);
        const fileBlob = await fileResponse.blob();

        // 4. Upload to Supabase Storage
        // Ensure bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'print_files')) {
            await supabase.storage.createBucket('print_files', { public: true });
        }

        const storagePath = `${supplier.id}/${Date.now()}_${fileName}`;
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('print_files') 
            .upload(storagePath, fileBlob, { contentType: mimeType, upsert: true });

        if (storageError) {
            console.error('Storage Error:', storageError);
            await sendTelegramMessage(chatId, "Ошибка при сохранении файла.");
            return new Response('ok');
        }

        const publicUrl = supabase.storage.from('print_files').getPublicUrl(storagePath).data.publicUrl;

        // 5. Save to Database
        const { error: dbError } = await supabase
            .from('print_files')
            .insert({
                supplier_id: supplier.id,
                name: fileName,
                type: mimeType,
                url: publicUrl,
                file_id: fileId
            });

        if (dbError) {
            console.error('DB Error:', dbError);
            await sendTelegramMessage(chatId, "Ошибка при записи в базу данных.");
            return new Response('ok');
        }

        await sendTelegramMessage(chatId, `Файл "${fileName}" принят от поставщика ${supplier.name}.`);
      }
    }

    return new Response('ok');
  } catch (error) {
    console.error(error);
    return new Response('error', { status: 500 });
  }
});

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
    const body: any = { chat_id: chatId, text: text };
    if (replyMarkup) body.reply_markup = replyMarkup;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function getTelegramFileInfo(fileId: string) {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok) return data.result;
    return null;
}
