# WB financial analytics algorithm (как считаем, чтобы сходилось с WB)

## Источник
- API: `statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod`
- Период: по годам, постранично (`rrdid`), с retry/backoff на 429.

## Ключевые правила WB (проверено на отчёте)
1. **Продажи (net)** = `Продажа (gross)` - `Возврат (gross)`
2. **К перечислению за товар (net)** = `К перечислению по продаже (gross)` - `К перечислению по возврату (gross)`
3. **Итого к оплате (WB)** =
   `К перечислению за товар (net)`
   `- Сумма логистики`
   `- Сумма хранения`
   `- Сумма штрафов`
   `- Прочие удержания`

## Поля
- Продажи: `retail_amount`
- К перечислению: `ppvz_for_pay`
- Логистика: `delivery_rub`
- Штрафы: `penalty`
- Хранение: `storage_fee`
- Удержания: `deduction`
- Номенклатура: `nm_id` / `nmId`
- Название: `sa_name` / `subject_name`
- Тип документа: `doc_type_name` (Продажа / Возврат)

## Группировка
- По товару: `Код номенклатуры + Название`
- Для сводки: сумма по всем товарам

## Готовый скрипт
`scripts/wb_financial_all_time_report.py`

### Запуск
```bash
python3 scripts/wb_financial_all_time_report.py \
  --supplier "ИП Градов_Е_В" \
  --supabase-url "https://blygwkxjogmioebutiwn.supabase.co" \
  --supabase-anon "<YOUR_SUPABASE_ANON_KEY>" \
  --out "./exports/analitika_wb_all_time.xlsx"
```

## Почему сайт иногда виснет
- прямой запрос WB из браузера упирается в rate-limit 429;
- длинная цепочка страниц + большой объём => таймауты.

## Рекомендация
- Хранить сырой отчёт и/или агрегаты в Supabase таблицах;
- UI показывать из базы;
- отдельной кнопкой/задачей обновлять кэш с WB API.
