-- SkladPro: published flags for Barters / External ads slots
-- Safe to run multiple times

alter table if exists public.barter_cards
  add column if not exists barter_published boolean[] not null default '{}'::boolean[],
  add column if not exists ad_published boolean[] not null default '{}'::boolean[];
