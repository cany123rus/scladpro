-- SkladPro hotfix: temporary_workers_logs INSERT RLS compatibility for employee-based login
-- Created: 2026-02-17 (Europe/Moscow)
-- Run in Supabase SQL Editor (project: blygwkxjogmioebutiwn)

begin;

alter table if exists public.temporary_workers_logs enable row level security;

-- Allow inserts both for authenticated and anon clients used by app employee login.
-- Keep minimal guard: created_by must be present.
drop policy if exists temp_workers_insert_auth on public.temporary_workers_logs;
create policy temp_workers_insert_auth
on public.temporary_workers_logs
for insert
to anon, authenticated
with check (created_by is not null);

commit;

-- Verify:
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname='public' and tablename='temporary_workers_logs'
-- order by policyname;
