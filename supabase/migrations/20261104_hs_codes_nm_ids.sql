-- Привязка марок ЧЗ к конкретным карточкам товаров (nmId).
--
-- Пусто (NULL) — марка подходит любой карточке своей категории, как раньше.
-- Заполнено — только перечисленным карточкам. Колонка необязательная: сайт сам
-- проверяет, есть ли она, поэтому миграцию можно применить в любой момент.
alter table public.unified_honest_sign_codes
  add column if not exists nm_ids bigint[];

comment on column public.unified_honest_sign_codes.nm_ids is
  'nmId карточек WB, которым подходит марка. NULL — любой карточке категории.';
